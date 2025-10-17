import type { NextApiRequest, NextApiResponse } from "next";
import { readContract } from "@wagmi/core";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import _bignumber from "bignumber.js";
import { CONTRACT_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI, DEFAULT_CHAIN_ID } from "@/config/chains";
import { config } from "@/wagmiConfig";
import contractABI from "@/constant/TokenManager.abi.json";
import { globalCache, CacheKeys, CacheTTL } from "@/utils/cache";

interface TokenInfo {
    base: string;
    quote: string;
    reserve0: string;
    reserve1: string;
    vReserve0: string;
    vReserve1: string;
    maxOffers: string;
    totalSupply: string;
    lastPrice: string;
    target: string;
    creator: string;
    launched: boolean;
}

interface TokenData {
    id: string;
    address: string;
    uri: string;
    info: TokenInfo | null;
    launched: boolean;
    progress: string;
    progressPercent: number;
    metadata?: {
        name?: string;
        symbol?: string;
        description?: string;
        image?: string;
        website?: string;
        x?: string;
        telegram?: string;
    };
}

type TokenDetailResponse = {
    success: boolean;
    message: string;
    data: TokenData;
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TokenDetailResponse | ErrorResponse>) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { address } = req.query;

        if (!address || typeof address !== "string") {
            return res.status(400).json({
                success: false,
                error: "Token address is required",
            });
        }

        // 验证地址格式
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({
                success: false,
                error: "Invalid token address format",
            });
        }

        // 检查缓存
        const cacheKey = CacheKeys.TOKEN_DETAIL(address);
        const cachedResult = globalCache.get<TokenData>(cacheKey);

        if (cachedResult) {
            console.log(`Cache hit for token detail: ${address}`);
            return res.status(200).json({
                success: true,
                message: "Token details retrieved from cache",
                data: cachedResult,
            });
        }

        console.log(`Cache miss for token detail: ${address}`);
        console.log(`Fetching token details for address: ${address}`);

        // 使用 Multicall 批量获取代币信息
        const calls = [
            // URI 调用
            {
                target: CONTRACT_CONFIG.FACTORY_CONTRACT,
                allowFailure: true,
                callData: encodeFunctionData({
                    abi: contractABI,
                    functionName: "uri",
                    args: [address],
                }),
            },
            // tokensInfo 调用
            {
                target: CONTRACT_CONFIG.FACTORY_CONTRACT,
                allowFailure: true,
                callData: encodeFunctionData({
                    abi: contractABI,
                    functionName: "tokensInfo",
                    args: [address],
                }),
            },
        ];

        const results = (await readContract(config, {
            address: MULTICALL3_ADDRESS as `0x${string}`,
            abi: MULTICALL3_ABI,
            functionName: "aggregate3",
            args: [calls],
            chainId: DEFAULT_CHAIN_ID,
        })) as any[];

        // 解析 URI
        let uri = "";
        if (results[0]?.success) {
            try {
                uri = decodeFunctionResult({
                    abi: contractABI,
                    functionName: "uri",
                    data: results[0].returnData,
                }) as string;
                console.log(`Token URI: ${uri}`);
            } catch (error) {
                console.warn(`Failed to decode URI for token ${address}:`, error);
            }
        } else {
            console.warn(`Failed to get URI for token ${address}`);
        }

        // 解析 tokensInfo
        let tokenInfo = null;
        if (results[1]?.success) {
            try {
                const tokenInfoResult = decodeFunctionResult({
                    abi: contractABI,
                    functionName: "tokensInfo",
                    data: results[1].returnData,
                }) as any[];

                tokenInfo = {
                    base: tokenInfoResult[0],
                    quote: tokenInfoResult[1],
                    reserve0: tokenInfoResult[2].toString(),
                    reserve1: tokenInfoResult[3].toString(),
                    vReserve0: tokenInfoResult[4].toString(),
                    vReserve1: tokenInfoResult[5].toString(),
                    maxOffers: tokenInfoResult[6].toString(),
                    totalSupply: tokenInfoResult[7].toString(),
                    lastPrice: tokenInfoResult[8].toString(),
                    target: tokenInfoResult[9].toString(),
                    creator: tokenInfoResult[10],
                    launched: tokenInfoResult[11],
                };
                console.log(`Token info retrieved for ${address}`);
            } catch (error) {
                console.warn(`Failed to decode tokensInfo for token ${address}:`, error);
            }
        } else {
            console.warn(`Failed to get tokensInfo for token ${address}`);
        }

        // 如果既没有URI也没有tokensInfo，说明token不存在
        if (!uri && !tokenInfo) {
            return res.status(404).json({
                success: false,
                error: "Token not found",
            });
        }

        // 计算进度
        let progress = 0;
        if (tokenInfo && tokenInfo.reserve1 && tokenInfo.target) {
            const reserve = _bignumber(tokenInfo.reserve1);
            const target = _bignumber(tokenInfo.target);
            if (!target.isZero()) {
                progress = reserve.div(target).times(100).dp(2).toNumber();
                progress = Math.min(progress, 100);
            }
        }

        // 构建基础token数据
        const tokenData: TokenData = {
            id: address,
            address: address,
            uri: uri,
            info: tokenInfo,
            launched: tokenInfo?.launched || false,
            progress: progress.toFixed(2),
            progressPercent: progress,
        };

        // 获取元数据（带缓存）
        const metadataCacheKey = CacheKeys.TOKEN_METADATA(address);
        const cachedMetadata = globalCache.get<any>(metadataCacheKey);
        
        if (cachedMetadata) {
            console.log(`Cache hit for metadata: ${address}`);
            tokenData.metadata = cachedMetadata;
        } else if (uri && uri !== "") {
            try {
                console.log(`Fetching metadata from URI: ${uri}`);

                // 处理IPFS URI
                let fetchUrl = uri;
                if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
                    fetchUrl = `https://ipfs.io/ipfs/${uri}`;
                } else if (uri.startsWith("ipfs://")) {
                    fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
                }

                const response = await fetch(fetchUrl, {
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (response.ok) {
                    const metadata = await response.json();
                    const result = {
                        name: metadata.name || `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                        symbol: metadata.symbol || "UNKNOWN",
                        description: metadata.description || "",
                        image: metadata.image || undefined,
                        website: metadata.website || "",
                        x: metadata.x || "",
                        telegram: metadata.telegram || "",
                    };
                    
                    tokenData.metadata = result;
                    // 缓存成功获取的元数据（永久）
                    globalCache.set(metadataCacheKey, result, CacheTTL.TOKEN_METADATA);
                    console.log(`Metadata fetched and cached for ${address}`);
                } else {
                    console.warn(`Failed to fetch metadata: HTTP ${response.status}`);
                    const errorMetadata = {
                        name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                        symbol: "UNKNOWN",
                        description: "",
                        image: undefined,
                    };
                    tokenData.metadata = errorMetadata;
                    // 缓存错误结果，5分钟后重试
                    globalCache.set(metadataCacheKey, errorMetadata, 300);
                }
            } catch (error) {
                console.warn(`Failed to fetch metadata for token ${address}:`, error);
                const errorMetadata = {
                    name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                    symbol: "UNKNOWN",
                    description: "",
                    image: undefined,
                };
                tokenData.metadata = errorMetadata;
                // 缓存错误结果，5分钟后重试
                globalCache.set(metadataCacheKey, errorMetadata, 300);
            }
        } else {
            // 没有URI时的默认metadata
            const defaultMetadata = {
                name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                symbol: "UNKNOWN",
                description: "",
                image: undefined,
            };
            tokenData.metadata = defaultMetadata;
            // 缓存默认元数据（永久）
            globalCache.set(metadataCacheKey, defaultMetadata, CacheTTL.TOKEN_METADATA);
        }

        // 缓存结果
        globalCache.set(cacheKey, tokenData, CacheTTL.TOKEN_DETAIL);
        console.log(`Cached token detail for: ${address}`);

        return res.status(200).json({
            success: true,
            message: "Token details retrieved successfully",
            data: tokenData,
        });
    } catch (error) {
        console.error("Token detail API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch token details",
            code: 500,
        });
    }
}
