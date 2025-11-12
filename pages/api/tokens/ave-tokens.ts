import type { NextApiRequest, NextApiResponse } from "next";
import { globalCache } from "@/utils/cache";

// 获取 token holders 信息
async function fetchTokenHoldersData(tokenAddress: string): Promise<any | null> {
    try {
        // 先检查缓存
        const cacheKey = `ave:holders:${tokenAddress.toLowerCase()}`;
        const cachedData = globalCache.get<any>(cacheKey);
        if (cachedData) {
            console.log(`Cache hit for token holders: ${tokenAddress}`);
            return cachedData;
        }

        console.log(`Fetching holders data for token: ${tokenAddress}`);

        const apiKey = process.env.NEXT_PUBLIC_AVE_KEY;
        if (!apiKey) {
            console.warn("AVE_API_KEY not found in environment variables");
            return null;
        }

        const url = "https://prod.ave-api.com/v2/tokens";
        const params = new URLSearchParams({
            keyword: tokenAddress,
            chain: "popchain",
            limit: "1", // 只获取一个结果
            orderby: "market_cap",
        });

        const response = await fetch(`${url}?${params}`, {
            method: "GET",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.warn(`Ave tokens API request failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log("Ave tokens API response:", data.data[0]);

        // 查找匹配的token
        if (data.data.length > 0) {
            // 寻找exact match的token地址
            const tokenData = data.data[0]; // 如果没有exact match，使用第一个结果
            console.log("Selected token data:", tokenData);

            // 缓存结果30分钟
            globalCache.set(cacheKey, tokenData, 1800);
            console.log(`Cached holders data for ${tokenAddress} for 30 minutes`);

            return tokenData;
        }

        console.log(`No token data found for address: ${tokenAddress}`);
        return null;
    } catch (error) {
        console.error("Error fetching token holders data:", error);
        return null;
    }
}

type TokenHoldersResponse = {
    success: boolean;
    message: string;
    data: any | null;
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TokenHoldersResponse | ErrorResponse>) {
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

        const tokenData = await fetchTokenHoldersData(address);

        return res.status(200).json({
            success: true,
            message: "Token holders data retrieved successfully",
            data: tokenData,
        });
    } catch (error) {
        console.error("Token holders API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch token holders data",
            code: 500,
        });
    }
}
