import { useQuery } from "@tanstack/react-query";

interface TokenHoldersResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        chain: string;
        name: string;
        symbol: string;
        current_price_usd: string;
        market_cap: string;
        holders: number;
        logo_url: string;
        updated_at: number;
    } | null;
}

// 获取 token holders 数据的函数
async function fetchTokenHolders(address: string): Promise<any | null> {
    if (!address) {
        return null;
    }

    const response = await fetch(`/api/tokens/ave-tokens?address=${encodeURIComponent(address)}`);
    const data: TokenHoldersResponse = await response.json();
    
    if (!data.success) {
        console.warn("Failed to fetch token holders:", data.message);
        return null;
    }

    return data.data;
}

// 使用 token holders 数据的 hook
export function useTokenHolders(address: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ["tokenHolders", address],
        queryFn: () => fetchTokenHolders(address),
        enabled: enabled && !!address,
        staleTime: 30 * 60 * 1000, // 30分钟 - 数据在30分钟内认为是新鲜的
        gcTime: 60 * 60 * 1000, // 1小时 - 缓存保留时间
        refetchInterval: 30 * 60 * 1000, // 30分钟 - 自动刷新间隔
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
    });
}