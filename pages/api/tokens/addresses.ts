import type { NextApiRequest, NextApiResponse } from "next";
import { readContract } from "@wagmi/core";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import _bignumber from "bignumber.js";
import { CONTRACT_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI, DEFAULT_CHAIN_ID } from "@/config/chains";
import { config } from "@/config/wagmi";
import contractABI from "@/constant/TokenFactory.abi.json";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { keyword } = req.query;

    try {
        // 1. 获取token总数
        const totalTokens = Number(
            (await readContract(config, {
                address: CONTRACT_CONFIG.FACTORY_CONTRACT as `0x${string}`,
                abi: contractABI,
                functionName: "allTokens",
            })) as bigint
        );

        console.log(`获取到token总数: ${totalTokens}`);

        if (totalTokens === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
            });
        }

        // 2. 批量获取所有token地址
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
        for (const result of addressResults) {
            if (result.success) {
                try {
                    const decoded = decodeFunctionResult({
                        abi: contractABI,
                        functionName: "tokens",
                        data: result.returnData,
                    });
                    if (decoded && typeof decoded === "string") {
                        addresses.push(decoded);
                    }
                } catch (error) {
                    console.warn("解析地址失败:", error);
                }
            }
        }

        console.log(`成功获取 ${addresses.length} 个token地址`);

        // 如果没有搜索关键词，只返回地址列表
        if (!keyword || typeof keyword !== "string") {
            return res.status(200).json({
                success: true,
                data: addresses,
                count: addresses.length,
            });
        }

        // 2. 匹配地址
        const searchKeyword = keyword.toLowerCase();
        const matchedAddresses = addresses
            .filter((address: string) => address.toLowerCase().includes(searchKeyword))
            .slice(0, 10); // 限制10个结果

        console.log(`关键词 "${keyword}" 匹配到 ${matchedAddresses.length} 个地址`);

        if (matchedAddresses.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
            });
        }

        // 3. 批量获取匹配地址的详细信息
        const dataCalls = [];
        for (const address of matchedAddresses) {
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
        }

        const dataResults = (await readContract(config, {
            address: MULTICALL3_ADDRESS as `0x${string}`,
            abi: MULTICALL3_ABI,
            functionName: "aggregate3",
            args: [dataCalls],
            chainId: DEFAULT_CHAIN_ID,
        })) as any[];

        const tokens = [];

        for (let i = 0; i < matchedAddresses.length; i++) {
            const address = matchedAddresses[i];
            const uriIndex = i * 2;
            const infoIndex = i * 2 + 1;

            let uri = "";
            let tokenInfo = null;

            // 解析 URI
            if (dataResults[uriIndex]?.success) {
                try {
                    const decoded = decodeFunctionResult({
                        abi: contractABI,
                        functionName: "uri",
                        data: dataResults[uriIndex].returnData,
                    });
                    uri = decoded as string;
                } catch (error) {
                    console.warn(`解析URI失败 ${address}:`, error);
                }
            }

            // 解析 tokensInfo
            if (dataResults[infoIndex]?.success) {
                try {
                    const decoded = decodeFunctionResult({
                        abi: contractABI,
                        functionName: "tokensInfo",
                        data: dataResults[infoIndex].returnData,
                    });
                    tokenInfo = decoded;
                } catch (error) {
                    console.warn(`解析tokenInfo失败 ${address}:`, error);
                }
            }

            if (tokenInfo) {
                // 获取metadata
                let metadata = null;
                if (uri && uri !== "") {
                    try {
                        let fetchUrl = uri;
                        if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
                            fetchUrl = `https://ipfs.io/ipfs/${uri}`;
                        } else if (uri.startsWith("ipfs://")) {
                            fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
                        }

                        const response = await fetch(fetchUrl, {
                            headers: {
                                Accept: "application/json",
                            },
                        });

                        if (response.ok) {
                            metadata = await response.json();
                        }
                    } catch (error) {
                        console.warn(`获取metadata失败 ${address}:`, error);
                    }
                }

                // 处理BigInt转换，匹配list.ts的TokenInfo结构
                // tokensInfo返回的是数组，需要通过索引访问
                const tokenInfoArray = tokenInfo as any[];
                const processedInfo = {
                    base: tokenInfoArray[0] || "",
                    quote: tokenInfoArray[1] || "",
                    reserve0: tokenInfoArray[2] ? tokenInfoArray[2].toString() : "0",
                    reserve1: tokenInfoArray[3] ? tokenInfoArray[3].toString() : "0",
                    vReserve0: tokenInfoArray[4] ? tokenInfoArray[4].toString() : "0",
                    vReserve1: tokenInfoArray[5] ? tokenInfoArray[5].toString() : "0",
                    maxOffers: tokenInfoArray[6] ? tokenInfoArray[6].toString() : "0",
                    totalSupply: tokenInfoArray[7] ? tokenInfoArray[7].toString() : "0",
                    lastPrice: tokenInfoArray[8] ? tokenInfoArray[8].toString() : "0",
                    target: tokenInfoArray[9] ? tokenInfoArray[9].toString() : "0",
                    creator: tokenInfoArray[10] || "",
                    launched: Boolean(tokenInfoArray[11]),
                };

                // 计算进度，与list.ts保持一致
                let progress = 0;
                if (processedInfo && processedInfo.reserve1 && processedInfo.target) {
                    const reserve = _bignumber(processedInfo.reserve1);
                    const target = _bignumber(processedInfo.target);
                    if (!target.isZero()) {
                        progress = reserve.div(target).times(100).dp(18).toNumber();
                        progress = Math.min(progress, 100);
                    }
                }

                // 匹配list.ts的返回结构
                const token = {
                    id: address,
                    address: address,
                    uri: uri,
                    info: processedInfo,
                    launched: Boolean(tokenInfoArray[11]),
                    progress: progress.toString(),
                    progressPercent: progress,
                    metadata: metadata || {
                        name: `Token ${address.slice(0, 6)}...${address.slice(-4)}`,
                        symbol: "--",
                        description: "",
                    },
                };

                tokens.push(token);
            }
        }

        console.log(`返回 ${tokens.length} 个token详情`);

        res.status(200).json({
            success: true,
            data: tokens,
            count: tokens.length,
        });
    } catch (error: any) {
        console.error("地址搜索失败:", error);

        res.status(500).json({
            success: false,
            message: "地址搜索失败",
            error: error.message,
        });
    }
}
