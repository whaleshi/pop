import type { NextApiRequest, NextApiResponse } from "next";
import { globalCache } from "@/utils/cache";

// 批量获取多个 token 的 AVE 数据
async function fetchBatchAveTokenData(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
        if (tokenAddresses.length === 0) {
            return {};
        }

        const result: Record<string, any> = {};
        const uncachedAddresses: string[] = [];

        // 先检查每个token的缓存
        for (const address of tokenAddresses) {
            const cacheKey = `ave:token:${address.toLowerCase()}`;
            const cachedData = globalCache.get<any>(cacheKey);
            if (cachedData) {
                result[address.toLowerCase()] = cachedData;
            } else {
                uncachedAddresses.push(address);
            }
        }

        // 如果所有数据都有缓存，直接返回
        if (uncachedAddresses.length === 0) {
            console.log(`All ${tokenAddresses.length} Ave tokens found in cache`);
            return result;
        }

        console.log(`Fetching Ave data for ${uncachedAddresses.length}/${tokenAddresses.length} tokens...`);

        const apiKey = process.env.NEXT_PUBLIC_AVE_KEY;
        if (!apiKey) {
            console.warn("AVE_API_KEY not found in environment variables");
            return result;
        }

        const url = "https://prod.ave-api.com/v2/tokens/price";
        const token_ids = uncachedAddresses.map((address) => `${address.toLowerCase()}-popchain`);
        const requestBody = {
            token_ids,
            tvl_min: 1000,
            tx_24h_volume_min: 0,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return result;
        }

        const data = await response.json();

        // 检查返回数据格式和成功状态
        if (data.msg === "SUCCESS" && data.data) {
            // 将结果转换为以原始地址为键的格式，并分别缓存每个token
            uncachedAddresses.forEach((address) => {
                const tokenKey = `${address.toLowerCase()}-popchain`;
                if (data.data[tokenKey]) {
                    const tokenData = data.data[tokenKey];
                    result[address.toLowerCase()] = tokenData;
                    
                    // 为每个token单独缓存30分钟 (1800秒)
                    const cacheKey = `ave:token:${address.toLowerCase()}`;
                    globalCache.set(cacheKey, tokenData, 1800);
                }
            });
            
            console.log(`Cached ${uncachedAddresses.length} Ave tokens for 30 minutes`);
        }

        return result;
    } catch (error) {
        console.error("Error fetching batch Ave token data:", error);
        return {};
    }
}

type AveDataResponse = {
    success: boolean;
    message: string;
    data: Record<string, any>;
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<AveDataResponse | ErrorResponse>) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { tokenAddresses } = req.body;

        if (!Array.isArray(tokenAddresses)) {
            return res.status(400).json({
                success: false,
                error: "tokenAddresses must be an array",
            });
        }

        const aveDataMap = await fetchBatchAveTokenData(tokenAddresses);

        return res.status(200).json({
            success: true,
            message: "Ave data retrieved successfully",
            data: aveDataMap,
        });
    } catch (error) {
        console.error("Ave data API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch ave data",
            code: 500,
        });
    }
}