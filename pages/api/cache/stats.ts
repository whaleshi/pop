import type { NextApiRequest, NextApiResponse } from 'next'
import { globalCache } from "@/utils/cache";

type CacheStatsResponse = {
    success: boolean;
    message: string;
    data: {
        size: number;
        totalItems: number;
        expiredItems: number;
        memoryUsage: string;
        uptime: string;
    };
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CacheStatsResponse | ErrorResponse>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const stats = globalCache.getStats();
        
        // 获取内存使用情况
        const memoryUsage = process.memoryUsage();
        const formatBytes = (bytes: number) => {
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        };

        // 获取运行时间
        const uptime = process.uptime();
        const formatUptime = (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours}h ${minutes}m ${secs}s`;
        };

        return res.status(200).json({
            success: true,
            message: 'Cache statistics retrieved successfully',
            data: {
                size: stats.size,
                totalItems: stats.totalItems,
                expiredItems: stats.expiredItems,
                memoryUsage: formatBytes(memoryUsage.heapUsed),
                uptime: formatUptime(uptime)
            }
        });

    } catch (error) {
        console.error('Cache stats API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get cache statistics',
            code: 500
        });
    }
}