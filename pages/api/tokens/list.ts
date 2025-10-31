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
    balance?: string;
}

type TokenListResponse = {
    success: boolean;
    message: string;
    data: {
        tokens: TokenData[];
        tokenCount: number;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            hasNext: boolean;
        };
    };
};

type ErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TokenListResponse | ErrorResponse>) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { page = 1, limit = 20, sort = "newest", launched, search, hasBalance, userAddress } = req.query;

        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

        // 生成缓存键（包含hasBalance和userAddress参数）
        const cacheKey = `${CacheKeys.TOKEN_LIST(pageNum, limitNum, sort as string, launched as string, search as string)}_hasBalance:${hasBalance || 'all'}_user:${userAddress || 'none'}`;

        // 尝试从缓存获取
        const cachedResult = globalCache.get<TokenListResponse["data"]>(cacheKey);
        if (cachedResult) {
            console.log(`Cache hit for token list: ${cacheKey}`);
            return res.status(200).json({
                success: true,
                message: "Tokens retrieved from cache",
                data: cachedResult,
            });
        }

        console.log(`Cache miss for token list: ${cacheKey}`);

        // 1. 获取代币总数 (使用缓存)
        let totalTokens: number;
        const tokenCountCacheKey = CacheKeys.TOKEN_COUNT;
        const cachedTokenCount = globalCache.get<number>(tokenCountCacheKey);

        if (cachedTokenCount !== null) {
            totalTokens = cachedTokenCount;
            console.log(`Using cached token count: ${totalTokens}`);
        } else {
            console.log("Fetching token count from contract...");

            try {
                const tokenCount = (await readContract(config, {
                    address: CONTRACT_CONFIG.FACTORY_CONTRACT as `0x${string}`,
                    abi: contractABI,
                    functionName: "allTokens",
                })) as bigint;
                console.log("Raw token count from contract:", tokenCount.toString());
                totalTokens = Number(tokenCount);
                console.log("Total tokens from contract:", totalTokens);
            } catch (error) {
                console.error("Detailed readContract error:", {
                    error: error,
                    message: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : "No stack trace",
                });
                throw error;
            }

            // 缓存代币总数
            globalCache.set(tokenCountCacheKey, totalTokens, CacheTTL.TOKEN_COUNT);
        }

        if (totalTokens === 0) {
            const emptyResult = {
                tokens: [],
                tokenCount: 0,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: 0,
                    hasNext: false,
                },
            };

            // 缓存空结果
            globalCache.set(cacheKey, emptyResult, CacheTTL.TOKEN_LIST);

            return res.status(200).json({
                success: true,
                message: "No tokens found",
                data: emptyResult,
            });
        }

        // 2. 批量获取代币地址 (使用缓存)
        let validAddresses: string[];
        const addressesCacheKey = CacheKeys.TOKEN_ADDRESSES;
        const cachedAddresses = globalCache.get<string[]>(addressesCacheKey);

        if (cachedAddresses !== null && cachedAddresses.length >= totalTokens) {
            validAddresses = cachedAddresses;
            console.log(`Using cached token addresses: ${validAddresses.length} addresses`);
        } else {
            console.log(`Fetching ${totalTokens} token addresses from contract...`);
            const addressCalls = [];
            for (let i = 0; i < totalTokens; i++) {
                addressCalls.push({
                    target: CONTRACT_CONFIG.FACTORY_CONTRACT,
                    allowFailure: true,
                    callData: encodeFunctionData({
                        abi: contractABI,
                        functionName: "tokens",
                        args: [i],
                    }),
                });
            }
            const addressResults = (await readContract(config, {
                address: MULTICALL3_ADDRESS as `0x${string}`,
                abi: MULTICALL3_ABI,
                functionName: "aggregate3",
                args: [addressCalls],
                chainId: DEFAULT_CHAIN_ID,
            })) as any[];

            // 解析地址
            const addresses: string[] = [];
            addressResults.forEach((result: any, index: number) => {
                if (result.success) {
                    try {
                        const tokenAddress = decodeFunctionResult({
                            abi: contractABI,
                            functionName: "tokens",
                            data: result.returnData,
                        }) as string;
                        addresses.push(tokenAddress);
                    } catch (error) {
                        console.warn(`Failed to decode token address at index ${index}:`, error);
                        addresses.push("");
                    }
                } else {
                    addresses.push("");
                }
            });

            validAddresses = addresses.filter((addr) => addr && addr !== "");

            // 缓存地址列表
            globalCache.set(addressesCacheKey, validAddresses, CacheTTL.TOKEN_ADDRESSES);
            console.log(`Cached ${validAddresses.length} token addresses`);
        }

        if (validAddresses.length === 0) {
            const emptyResult = {
                tokens: [],
                tokenCount: 0,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: 0,
                    hasNext: false,
                },
            };

            // 缓存空结果
            globalCache.set(cacheKey, emptyResult, CacheTTL.TOKEN_LIST);

            return res.status(200).json({
                success: true,
                message: "No valid tokens found",
                data: emptyResult,
            });
        }

        // 3. 批量获取代币信息和URI (使用合约数据缓存)
        // 注意：如果查询用户余额，不使用缓存，因为余额是用户特定的
        let allTokens: TokenData[];
        const contractDataCacheKey = userAddress
            ? `${CacheKeys.TOKEN_CONTRACT_DATA}:user:${userAddress}`
            : CacheKeys.TOKEN_CONTRACT_DATA;
        const cachedContractData = globalCache.get<TokenData[]>(contractDataCacheKey);

        // 如果是查询用户余额，跳过缓存直接查询最新数据
        const shouldUseCache = !userAddress && cachedContractData !== null && cachedContractData.length >= validAddresses.length;

        if (shouldUseCache) {
            allTokens = cachedContractData!;
            console.log(`Using cached contract data: ${allTokens.length} tokens`);
        } else {
            console.log(`Fetching data for ${validAddresses.length} tokens from contract...`);
            const dataCalls = [];
            const hasUserAddress = userAddress && typeof userAddress === "string";
            const callsPerToken = hasUserAddress ? 5 : 4; // 根据是否查询用户余额决定调用数量

            for (const address of validAddresses) {
                // URI 调用
                dataCalls.push({
                    target: CONTRACT_CONFIG.FACTORY_CONTRACT,
                    allowFailure: true,
                    callData: encodeFunctionData({
                        abi: contractABI,
                        functionName: "uri",
                        args: [address],
                    }),
                });
                // tokensInfo 调用
                dataCalls.push({
                    target: CONTRACT_CONFIG.FACTORY_CONTRACT,
                    allowFailure: true,
                    callData: encodeFunctionData({
                        abi: contractABI,
                        functionName: "tokensInfo",
                        args: [address],
                    }),
                });
                // name 调用
                dataCalls.push({
                    target: address,
                    allowFailure: true,
                    callData: encodeFunctionData({
                        abi: [
                            {
                                inputs: [],
                                name: "name",
                                outputs: [{ internalType: "string", name: "", type: "string" }],
                                stateMutability: "view",
                                type: "function",
                            },
                        ],
                        functionName: "name",
                        args: [],
                    }),
                });
                // symbol 调用
                dataCalls.push({
                    target: address,
                    allowFailure: true,
                    callData: encodeFunctionData({
                        abi: [
                            {
                                inputs: [],
                                name: "symbol",
                                outputs: [{ internalType: "string", name: "", type: "string" }],
                                stateMutability: "view",
                                type: "function",
                            },
                        ],
                        functionName: "symbol",
                        args: [],
                    }),
                });
                // balanceOf 调用 - 只有提供userAddress时才查询用户余额
                if (hasUserAddress) {
                    dataCalls.push({
                        target: address,
                        allowFailure: true,
                        callData: encodeFunctionData({
                            abi: [
                                {
                                    inputs: [{ internalType: "address", name: "account", type: "address" }],
                                    name: "balanceOf",
                                    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                                    stateMutability: "view",
                                    type: "function",
                                },
                            ],
                            functionName: "balanceOf",
                            args: [userAddress as `0x${string}`],
                        }),
                    });
                }
            }

            const dataResults = (await readContract(config, {
                address: MULTICALL3_ADDRESS as `0x${string}`,
                abi: MULTICALL3_ABI,
                functionName: "aggregate3",
                args: [dataCalls],
                chainId: DEFAULT_CHAIN_ID,
            })) as any[];

            // 4. 组装代币数据
            allTokens = validAddresses.map((address, index) => {
                const uriIndex = index * callsPerToken;
                const infoIndex = index * callsPerToken + 1;
                const nameIndex = index * callsPerToken + 2;
                const symbolIndex = index * callsPerToken + 3;
                const balanceIndex = hasUserAddress ? index * callsPerToken + 4 : -1;

                // 解析 URI
                let uri = "";
                if (dataResults[uriIndex]?.success) {
                    try {
                        uri = decodeFunctionResult({
                            abi: contractABI,
                            functionName: "uri",
                            data: dataResults[uriIndex].returnData,
                        }) as string;
                    } catch (error) {
                        console.warn(`Failed to decode URI for token ${address}:`, error);
                    }
                }

                // 解析 tokensInfo
                let tokenInfo = null;
                if (dataResults[infoIndex]?.success) {
                    try {
                        const tokenInfoResult = decodeFunctionResult({
                            abi: contractABI,
                            functionName: "tokensInfo",
                            data: dataResults[infoIndex].returnData,
                        }) as any[];
                        console.log(tokenInfoResult);
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
                    } catch (error) {
                        console.warn(`Failed to decode tokensInfo for token ${address}:`, error);
                    }
                }

                // 解析 name
                let name = "";
                if (dataResults[nameIndex]?.success) {
                    try {
                        name = decodeFunctionResult({
                            abi: [
                                {
                                    inputs: [],
                                    name: "name",
                                    outputs: [{ internalType: "string", name: "", type: "string" }],
                                    stateMutability: "view",
                                    type: "function",
                                },
                            ],
                            functionName: "name",
                            data: dataResults[nameIndex].returnData,
                        }) as string;
                    } catch (error) {
                        console.warn(`Failed to decode name for token ${address}:`, error);
                    }
                }

                // 解析 symbol
                let symbol = "";
                if (dataResults[symbolIndex]?.success) {
                    try {
                        symbol = decodeFunctionResult({
                            abi: [
                                {
                                    inputs: [],
                                    name: "symbol",
                                    outputs: [{ internalType: "string", name: "", type: "string" }],
                                    stateMutability: "view",
                                    type: "function",
                                },
                            ],
                            functionName: "symbol",
                            data: dataResults[symbolIndex].returnData,
                        }) as string;
                    } catch (error) {
                        console.warn(`Failed to decode symbol for token ${address}:`, error);
                    }
                }

                // 解析 balance - 只有提供了userAddress时才解析
                let balance: string | undefined = undefined;
                if (hasUserAddress && balanceIndex >= 0 && dataResults[balanceIndex]?.success) {
                    try {
                        const balanceResult = decodeFunctionResult({
                            abi: [
                                {
                                    inputs: [{ internalType: "address", name: "account", type: "address" }],
                                    name: "balanceOf",
                                    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                                    stateMutability: "view",
                                    type: "function",
                                },
                            ],
                            functionName: "balanceOf",
                            data: dataResults[balanceIndex].returnData,
                        }) as bigint;
                        balance = balanceResult.toString();
                    } catch (error) {
                        console.warn(`Failed to decode balance for token ${address}:`, error);
                    }
                }

                // 计算进度
                let progress = 0;
                if (tokenInfo && tokenInfo.reserve1 && tokenInfo.target) {
                    const reserve = _bignumber(tokenInfo.reserve1);
                    const target = _bignumber(tokenInfo.target);
                    console.log(reserve.div(target).times(100).toString());
                    if (!target.isZero()) {
                        progress = reserve.div(target).times(100).dp(18).toNumber();
                        progress = Math.min(progress, 100);
                    }
                }

                const tokenData: TokenData = {
                    id: address,
                    address: address,
                    uri: uri,
                    info: tokenInfo,
                    launched: tokenInfo?.launched || false,
                    progress: progress.toString(),
                    progressPercent: progress,
                    name: name || undefined,
                    symbol: symbol || undefined,
                };

                // 只有查询了用户余额时才包含balance字段
                if (hasUserAddress && balance !== undefined) {
                    tokenData.balance = balance;
                }

                return tokenData;
            });

            // 缓存合约数据（不包含元数据）
            // 如果是用户特定查询，使用更短的TTL（1秒）或不缓存
            const cacheTTL = userAddress ? 1 : CacheTTL.CONTRACT_DATA;
            globalCache.set(contractDataCacheKey, allTokens, cacheTTL);
            console.log(`Cached contract data for ${allTokens.length} tokens with TTL: ${cacheTTL}s`);
        }

        // 4. 应用过滤器
        let filteredTokens = allTokens;

        // 按地址搜索过滤
        if (search && typeof search === "string") {
            const searchLower = search.toLowerCase().trim();
            filteredTokens = filteredTokens.filter((token) => token.address.toLowerCase().includes(searchLower));
        }

        // 按启动状态过滤
        if (launched !== undefined) {
            const isLaunched = launched === "true";
            filteredTokens = filteredTokens.filter((token) => token.launched === isLaunched);
        }

        // 按余额过滤 - 只显示余额大于0的代币
        if (hasBalance === "true") {
            filteredTokens = filteredTokens.filter((token) => {
                try {
                    return token.balance && _bignumber(token.balance).isGreaterThan(0);
                } catch (error) {
                    console.warn(`Failed to parse balance for token ${token.address}:`, error);
                    return false;
                }
            });
        }
        console.log(filteredTokens);
        // 5. 排序
        switch (sort) {
            case "newest":
                // 新创建 - 倒序，过滤掉100%进度的
                filteredTokens = filteredTokens.filter((token) => parseFloat(token.progress) < 100).reverse();
                break;
            case "trending":
                // 飙升 - 按进度最高排序，过滤掉100%进度的
                filteredTokens = filteredTokens
                    .filter((token) => parseFloat(token.progress) < 100)
                    .sort((a, b) => parseFloat(b.progress) - parseFloat(a.progress));
                break;
            case "launched":
                // 新开盘 - 只显示launched=true的token
                filteredTokens = filteredTokens
                    .filter((token) => token.launched === true)
                    .sort((a, b) => parseFloat(b.progress) - parseFloat(a.progress));
                break;
            default:
                break;
        }

        // 6. 分页
        const total = filteredTokens.length;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedTokens = filteredTokens.slice(startIndex, endIndex);
        const hasNext = endIndex < total;

        const result = {
            tokens: paginatedTokens,
            tokenCount: total,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                hasNext,
            },
        };

        // 缓存最终结果
        globalCache.set(cacheKey, result, CacheTTL.TOKEN_LIST);
        console.log(`Cached result for: ${cacheKey}`);
        return res.status(200).json({
            success: true,
            message: "Tokens retrieved successfully",
            data: result,
        });
    } catch (error) {
        console.error("Token list API error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch token list",
            code: 500,
        });
    }
}
