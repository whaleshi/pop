import { BackIcon, ShareIcon } from "@/components/icons";
import Share from "@/components/share";
import { TokenAbout } from "@/components/tokenAbout";
import { TokenEnd } from "@/components/tokenEnd";
import { TokenTradeBox } from "@/components/tradeBox";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { GetServerSideProps } from "next";
import { ethers } from "ethers";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import contractABI from "@/constant/TokenFactory.abi.json";


interface TokenPageProps {
	tokenMetadata?: {
		name?: string;
		symbol?: string;
		image?: string;
	};
}

export default function TokenPage({ tokenMetadata }: TokenPageProps) {
	const router = useRouter();
	const { addr } = router.query;
	const [isShareOpen, setIsShareOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["token-details", addr],
		queryFn: async () => {
			const response = await fetch(`/api/tokens/${addr}`);
			const result = await response.json();
			return result.success ? result.data : null;
		},
		enabled: !!addr,
		staleTime: 2000, // 2秒内认为数据是新鲜的
		gcTime: 300000, // 5分钟缓存时间
		refetchInterval: 3000, // 3秒刷新一次
		refetchOnWindowFocus: true, // 窗口聚焦时刷新（详情页特性）
		refetchOnMount: false, // 组件挂载时不自动重新获取
		retry: 2, // 失败时重试2次
		retryDelay: 1000, // 重试延迟1秒
	});

	// 获取代币元数据 - 永久缓存
	const { data: metadata } = useQuery({
		queryKey: ["tokenMetadata", data?.address],
		queryFn: async () => {
			// 如果没有 URI，直接使用基础数据
			if (!data?.uri || data?.uri === "") {
				return {
					name: data?.name || `Token ${data?.address?.slice(0, 6)}...${data?.address?.slice(-4)}`,
					symbol: data?.symbol || "--",
					description: "",
					image: '/images/default.png',
				};
			}

			try {
				const response = await fetch('/api/tokens/metadata', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						addresses: [data.address],
						uris: [data.uri]
					})
				});

				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data[data.address]) {
						// 合并基础数据和元数据，优先使用合约的 name/symbol
						return {
							name: data?.name || result.data[data.address].name,
							symbol: data?.symbol || result.data[data.address].symbol,
							description: result.data[data.address].description || "",
							image: result.data[data.address].image || '/images/default.png',
							website: result.data[data.address].website || "",
							x: result.data[data.address].x || "",
							telegram: result.data[data.address].telegram || "",
						};
					}
				}
			} catch (error) {
				console.warn(`Failed to fetch metadata for ${data?.address}:`, error);
			}

			// 降级方案
			return {
				name: data?.name || `Token ${data?.address?.slice(0, 6)}...${data?.address?.slice(-4)}`,
				symbol: data?.symbol || "--",
				description: "",
				image: '/images/default.png',
			};
		},
		enabled: !!data?.address,
		staleTime: Infinity, // 永久缓存，元数据不会变
		gcTime: Infinity, // 永不清理缓存
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	if (isLoading || !data) {
		return (
			<DefaultLayout>
				<div className="w-full h-full flex flex-col items-center justify-center">
					<Image src="/images/loading.png" width={90} height={90} alt="Loading..." />
				</div>
			</DefaultLayout>
		);
	}

	return (
		<DefaultLayout>
			<section className="h-full flex flex-col items-center justify-center w-full relative">
				<div className="h-[48px] w-full flex items-center justify-between md:hidden px-[16px] relative z-1">
					<BackIcon className="cursor-pointer" onClick={() => router.push('/')} />
					<ShareIcon className="cursor-pointer" onClick={() => setIsShareOpen(true)} />
				</div>
				<div className="w-full flex-1 flex flex-col md:flex-row md:max-w-[800px] md:gap-[24px] relative md:pt-[80px]">
					{
						data?.progressPercent === 100 ? <TokenEnd info={data} metadata={metadata} /> : <>
							<TokenAbout info={data} metadata={metadata} />
							<TokenTradeBox info={data} metadata={metadata} />
						</>
					}
				</div>
			</section>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={data} metadata={metadata} />
		</DefaultLayout>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { addr } = context.params!;
	
	if (!addr || typeof addr !== "string") {
		return {
			props: {},
		};
	}

	try {
		// 创建 provider
		const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
		
		// 创建合约实例
		const contract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, contractABI, provider);
		
		// 获取 URI
		const uri = await contract.uri(addr);
		
		if (uri && uri !== "") {
			// 从 URI 获取 JSON 元数据
			const response = await fetch(uri);
			if (response.ok) {
				const metadata = await response.json();
				return {
					props: {
						tokenMetadata: {
							name: metadata.name,
							symbol: metadata.symbol,
							image: metadata.image,
						},
					},
				};
			}
		}
	} catch (error) {
		console.error("Error fetching token metadata in getServerSideProps:", error);
	}

	return {
		props: {},
	};
};