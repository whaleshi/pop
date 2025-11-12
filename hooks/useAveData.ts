import { useQuery } from "@tanstack/react-query";

interface AveDataResponse {
    success: boolean;
    message: string;
    data: Record<string, any>;
}

// 获取 AVE 数据的函数
async function fetchAveData(tokenAddresses: string[]): Promise<Record<string, any>> {
    if (!tokenAddresses || tokenAddresses.length === 0) {
        return {};
    }

    const response = await fetch("/api/tokens/ave-data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAddresses }),
    });

    const data: AveDataResponse = await response.json();
    
    if (!data.success) {
        throw new Error(data.message || "Failed to fetch Ave data");
    }

    return data.data;
}

// 使用 AVE 数据的 hook
export function useAveData(tokenAddresses: string[], enabled: boolean = true) {
    return useQuery({
        queryKey: ["aveData", tokenAddresses.sort()],
        queryFn: () => fetchAveData(tokenAddresses),
        enabled: enabled && tokenAddresses.length > 0,
        staleTime: 30 * 60 * 1000, // 30分钟 - 数据在30分钟内认为是新鲜的
        gcTime: 60 * 60 * 1000, // 1小时 - 缓存保留时间
        refetchInterval: 30 * 60 * 1000, // 30分钟 - 自动刷新间隔
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
    });
}