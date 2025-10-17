interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class InMemoryCache {
    private cache = new Map<string, CacheItem<any>>();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly maxItems: number;
    private readonly maxMemoryMB: number;

    constructor(maxItems: number = 10000, maxMemoryMB: number = 100) {
        this.maxItems = maxItems;
        this.maxMemoryMB = maxMemoryMB;

        // 每5分钟清理一次过期缓存
        this.cleanupInterval = setInterval(
            () => {
                this.cleanup();
            },
            5 * 60 * 1000
        );
    }

    set<T>(key: string, data: T, ttlSeconds: number = 300): void {
        // 检查是否需要清理空间
        this.checkAndCleanup();

        const now = Date.now();
        const expiresAt = now + ttlSeconds * 1000;

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt,
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // 检查是否过期
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    has(key: string): boolean {
        const item = this.cache.get(key);

        if (!item) {
            return false;
        }

        // 检查是否过期
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // 检查并清理空间
    private checkAndCleanup(): void {
        // 检查缓存项数量限制
        if (this.cache.size >= this.maxItems) {
            console.log(`Cache size limit reached (${this.maxItems}), cleaning up...`);
            this.cleanup();

            // 如果清理后仍超限，使用LRU清理
            if (this.cache.size >= this.maxItems) {
                this.evictLRU(Math.floor(this.maxItems * 0.2)); // 清理20%
            }
        }

        // 检查内存使用（简单估算）
        if (process.memoryUsage) {
            const memUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
            if (memUsageMB > this.maxMemoryMB) {
                // console.log(`Memory usage high (${memUsageMB.toFixed(2)}MB), cleaning cache...`);
                this.cleanup();

                // 如果内存仍然过高，强制清理
                if (process.memoryUsage().heapUsed / 1024 / 1024 > this.maxMemoryMB) {
                    this.evictLRU(Math.floor(this.cache.size * 0.3)); // 清理30%
                }
            }
        }
    }

    // LRU清理策略
    private evictLRU(count: number): void {
        const entries = Array.from(this.cache.entries());
        // 按时间戳排序，删除最老的项
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (let i = 0; i < count && i < entries.length; i++) {
            this.cache.delete(entries[i][0]);
        }

        // console.log(`Evicted ${count} LRU cache items`);
    }

    // 清理过期的缓存项
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((item, key) => {
            if (now > item.expiresAt) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            // console.log(`Cleaned up ${keysToDelete.length} expired cache items`);
        }
    }

    // 获取缓存统计信息
    getStats(): {
        size: number;
        totalItems: number;
        expiredItems: number;
        maxItems: number;
        maxMemoryMB: number;
        memoryPressure: boolean;
    } {
        const now = Date.now();
        let expiredItems = 0;

        this.cache.forEach((item) => {
            if (now > item.expiresAt) {
                expiredItems++;
            }
        });

        // 检查内存压力
        let memoryPressure = false;
        if (process.memoryUsage) {
            const memUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
            memoryPressure = memUsageMB > this.maxMemoryMB * 0.8; // 80%阈值
        }

        return {
            size: this.cache.size,
            totalItems: this.cache.size,
            expiredItems,
            maxItems: this.maxItems,
            maxMemoryMB: this.maxMemoryMB,
            memoryPressure,
        };
    }

    // 销毁缓存实例
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}

// 创建全局缓存实例
export const globalCache = new InMemoryCache();

// 缓存键生成器
export const CacheKeys = {
    // 代币总数
    TOKEN_COUNT: "token:count",

    // 代币列表 - 包含分页和排序参数
    TOKEN_LIST: (page: number, limit: number, sort: string, launched?: string, search?: string) => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sort,
        });

        if (launched !== undefined) {
            params.set("launched", launched);
        }

        if (search) {
            params.set("search", search);
        }

        return `token:list:${params.toString()}`;
    },

    // 单个代币详情
    TOKEN_DETAIL: (address: string) => `token:detail:${address.toLowerCase()}`,

    // 代币元数据
    TOKEN_METADATA: (address: string) => `token:metadata:${address.toLowerCase()}`,

    // 批量代币元数据
    BATCH_TOKEN_METADATA: (addresses: string[]) => {
        const sortedAddresses = addresses.map((addr) => addr.toLowerCase()).sort();
        return `token:metadata:batch:${sortedAddresses.join(",")}`;
    },

    // 原始合约数据
    TOKEN_CONTRACT_DATA: "token:contract:data",

    // 代币地址列表
    TOKEN_ADDRESSES: "token:addresses",
};

// 缓存TTL配置（秒）
export const CacheTTL = {
    TOKEN_COUNT: 10, // 代币总数：10秒（缩短以快速响应新代币）
    TOKEN_LIST: 30, // 代币列表：30秒（缩短以显示新代币）
    TOKEN_DETAIL: 300, // 代币详情：5分钟
    TOKEN_METADATA: 86400 * 365, // 代币元数据：1年（永久）
    CONTRACT_DATA: 10, // 合约原始数据：10秒（缩短以快速更新）
    TOKEN_ADDRESSES: 30, // 代币地址列表：30秒（缩短以包含新代币）
};

// 缓存工具函数
export const CacheUtils = {
    // 生成带时间戳的缓存键（用于强制刷新）
    withTimestamp: (key: string, timestampMinutes: number = 5) => {
        const timestamp = Math.floor(Date.now() / (timestampMinutes * 60 * 1000));
        return `${key}:${timestamp}`;
    },

    // 删除匹配模式的所有缓存
    deletePattern: (pattern: string) => {
        let deletedCount = 0;
        const keysToDelete: string[] = [];

        // 遍历所有键查找匹配项
        globalCache["cache"].forEach((_, key) => {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => {
            if (globalCache.delete(key)) {
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            // console.log(`Deleted ${deletedCount} cache items matching pattern: ${pattern}`);
        }

        return deletedCount;
    },

    // 强制刷新新代币相关缓存
    invalidateTokenCache: () => {
        const patterns = ["token:count", "token:addresses", "token:contract:data", "token:list"];
        let totalDeleted = 0;

        patterns.forEach((pattern) => {
            totalDeleted += CacheUtils.deletePattern(pattern);
        });

        console.log(`Invalidated token cache: ${totalDeleted} items deleted`);
        return totalDeleted;
    },

    // 预热缓存 - 在应用启动时调用
    warmup: async () => {
        console.log("Cache warmup not implemented for token data - data will be cached on first request");
    },
};
