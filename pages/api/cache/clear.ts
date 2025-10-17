import type { NextApiRequest, NextApiResponse } from 'next'
import { globalCache } from "@/utils/cache";

type ClearCacheResponse = {
    success: boolean;
    message: string;
    data: {
        cleared: boolean;
        stats?: {
            size: number;
            totalItems: number;
            expiredItems: number;
        };
    };
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ClearCacheResponse | ErrorResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const { type } = req.body;

        // 获取清理前的统计信息
        const beforeStats = globalCache.getStats();

        switch (type) {
            case 'all':
                // 清理所有缓存
                globalCache.clear();
                console.log('All cache cleared');
                break;

            case 'tokens':
                // 清理代币相关缓存
                // 注意：这里简化实现，实际可以根据需要实现更精确的模式匹配
                globalCache.clear(); // 临时实现，清理所有
                console.log('Token cache cleared');
                break;

            case 'expired':
                // 只清理过期缓存（通过访问触发清理）
                const afterStats = globalCache.getStats();
                console.log(`Expired cache cleanup triggered. Before: ${beforeStats.expiredItems}, After: ${afterStats.expiredItems}`);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid cache type. Supported types: all, tokens, expired'
                });
        }

        const afterStats = globalCache.getStats();

        return res.status(200).json({
            success: true,
            message: `Cache cleared successfully (type: ${type})`,
            data: {
                cleared: true,
                stats: afterStats
            }
        });

    } catch (error) {
        console.error('Cache clear API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to clear cache',
            code: 500
        });
    }
}