import type { NextApiRequest, NextApiResponse } from "next";
import { readContract } from "@wagmi/core";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import _bignumber from "bignumber.js";
import { CONTRACT_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI, DEFAULT_CHAIN_ID } from "@/config/chains";
import { config } from "@/config/wagmi";
import contractABI from "@/constant/TokenFactory.abi.json";
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
    name?: string;
    symbol?: string;
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
            // name 调用
            {
                target: address,
                allowFailure: true,
                callData: encodeFunctionData({
                    abi: [{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}],
                    functionName: "name",
                    args: [],
                }),
            },
            // symbol 调用
            {
                target: address,
                allowFailure: true,
                callData: encodeFunctionData({
                    abi: [{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}],
                    functionName: "symbol",
                    args: [],
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

        // 解析 name
        let name = "";
        if (results[2]?.success) {
            try {
                name = decodeFunctionResult({
                    abi: [{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}],
                    functionName: "name",
                    data: results[2].returnData,
                }) as string;
                console.log(`Token name: ${name}`);
            } catch (error) {
                console.warn(`Failed to decode name for token ${address}:`, error);
            }
        }

        // 解析 symbol
        let symbol = "";
        if (results[3]?.success) {
            try {
                symbol = decodeFunctionResult({
                    abi: [{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}],
                    functionName: "symbol",
                    data: results[3].returnData,
                }) as string;
                console.log(`Token symbol: ${symbol}`);
            } catch (error) {
                console.warn(`Failed to decode symbol for token ${address}:`, error);
            }
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

        // 构建基础token数据（不包含元数据）
        const tokenData: TokenData = {
            id: address,
            address: address,
            uri: uri,
            info: tokenInfo,
            launched: tokenInfo?.launched || false,
            progress: progress.toFixed(2),
            progressPercent: progress,
            name: name || undefined,
            symbol: symbol || undefined,
        };

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
