import type { NextApiRequest, NextApiResponse } from "next";
import { CacheUtils } from "@/utils/cache";

type InvalidateResponse = {
    success: boolean;
    message: string;
    data: {
        deletedItems: number;
        patterns?: string[];
    };
};

type ErrorResponse = {
    success: false;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<InvalidateResponse | ErrorResponse>) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { pattern, type } = req.body;

        let deletedItems = 0;
        let patterns: string[] = [];

        if (type === "tokens") {
            // 刷新所有代币相关缓存
            deletedItems = CacheUtils.invalidateTokenCache();
            patterns = ["token:count", "token:addresses", "token:contract:data", "token:list"];
        } else if (pattern && typeof pattern === "string") {
            // 刷新指定模式的缓存
            deletedItems = CacheUtils.deletePattern(pattern);
            patterns = [pattern];
        } else {
            return res.status(400).json({
                success: false,
                error: "Invalid request. Provide 'type: tokens' or 'pattern: string'",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Cache invalidated successfully`,
            data: {
                deletedItems,
                patterns,
            },
        });
    } catch (error) {
        console.error("Cache invalidate API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to invalidate cache",
        });
    }
}
