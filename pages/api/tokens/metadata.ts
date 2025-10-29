import type { NextApiRequest, NextApiResponse } from "next";
import { globalCache, CacheKeys, CacheTTL } from "@/utils/cache";

interface TokenMetadata {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    website?: string;
    x?: string;
    telegram?: string;
}

interface MetadataRequest {
    addresses: string[];
    uris: string[];
}

type MetadataResponse = {
    success: boolean;
    message: string;
    data: {
        [address: string]: TokenMetadata;
    };
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

// 批量获取代币元数据的函数
async function fetchTokensMetadata(addresses: string[], uris: string[]): Promise<{ [address: string]: TokenMetadata }> {
    const result: { [address: string]: TokenMetadata } = {};
    const BATCH_SIZE = 10;

    if (addresses.length !== uris.length) {
        throw new Error("Addresses and URIs arrays must have the same length");
    }

    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
        const batchAddresses = addresses.slice(i, i + BATCH_SIZE);
        const batchUris = uris.slice(i, i + BATCH_SIZE);

        const batchPromises = batchAddresses.map(async (address, batchIndex) => {
            const uri = batchUris[batchIndex];
            
            // 检查缓存
            const cacheKey = CacheKeys.TOKEN_METADATA(address);
            const cachedMetadata = globalCache.get<TokenMetadata>(cacheKey);

            if (cachedMetadata) {
                result[address] = cachedMetadata;
                return;
            }

            if (!uri || uri === "") {
                const defaultMetadata: TokenMetadata = {
                    name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                    symbol: "--",
                    description: "",
                };
                result[address] = defaultMetadata;
                globalCache.set(cacheKey, defaultMetadata, CacheTTL.TOKEN_METADATA);
                return;
            }

            try {
                // 处理IPFS URI
                let fetchUrl = uri;
                if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
                    fetchUrl = `https://ipfs.io/ipfs/${uri}`;
                } else if (uri.startsWith("ipfs://")) {
                    fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

                const response = await fetch(fetchUrl, {
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const metadata = await response.json();
                const processedMetadata: TokenMetadata = {
                    name: metadata.name || `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                    symbol: metadata.symbol || "--",
                    description: metadata.description || "",
                    image: metadata.image || undefined,
                    website: metadata.website || "",
                    x: metadata.x || "",
                    telegram: metadata.telegram || "",
                };

                result[address] = processedMetadata;
                globalCache.set(cacheKey, processedMetadata, CacheTTL.TOKEN_METADATA);
            } catch (error) {
                console.warn(`Failed to fetch metadata for token ${address}:`, error);
                const errorMetadata: TokenMetadata = {
                    name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                    symbol: "--",
                    description: "",
                };
                result[address] = errorMetadata;
                globalCache.set(cacheKey, errorMetadata, 300); // 5分钟后重试
            }
        });

        await Promise.allSettled(batchPromises);

        // 在批次之间添加小延迟，避免请求过于频繁
        if (i + BATCH_SIZE < addresses.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MetadataResponse | ErrorResponse>) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { addresses, uris }: MetadataRequest = req.body;

        if (!addresses || !Array.isArray(addresses)) {
            return res.status(400).json({
                success: false,
                error: "addresses must be an array",
                code: 400,
            });
        }

        if (!uris || !Array.isArray(uris)) {
            return res.status(400).json({
                success: false,
                error: "uris must be an array",
                code: 400,
            });
        }

        if (addresses.length !== uris.length) {
            return res.status(400).json({
                success: false,
                error: "addresses and uris arrays must have the same length",
                code: 400,
            });
        }

        if (addresses.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No tokens to process",
                data: {},
            });
        }

        if (addresses.length > 100) {
            return res.status(400).json({
                success: false,
                error: "Maximum 100 tokens per request",
                code: 400,
            });
        }

        console.log(`Fetching metadata for ${addresses.length} tokens...`);
        const metadata = await fetchTokensMetadata(addresses, uris);

        return res.status(200).json({
            success: true,
            message: `Metadata retrieved for ${Object.keys(metadata).length} tokens`,
            data: metadata,
        });
    } catch (error) {
        console.error("Token metadata API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch token metadata",
            code: 500,
        });
    }
}