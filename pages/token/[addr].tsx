import { BackIcon, ShareIcon } from "@/components/icons";
import Share from "@/components/share";
import { TokenAbout } from "@/components/tokenAbout";
import { TokenEnd } from "@/components/tokenEnd";
import { TokenTradeBox } from "@/components/tradeBox";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";


export default function TokenPage() {
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

	if (isLoading || !data) {
		return (
			<DefaultLayout>
				<div className="w-full h-full flex flex-col items-center justify-center">
					<Image src="/images/loading.gif" width={90} height={90} alt="Loading..." />
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
				<div className="w-full h-[200px] md:h-[500px] absolute top-0 left-0"
					style={{ background: "linear-gradient(180deg, rgba(255, 233, 0, 0.15) 0%, rgba(255, 233, 0, 0.00) 100%)" }}
				></div>
				<div className="w-full flex-1 flex flex-col md:flex-row md:max-w-[800px] md:gap-[24px] relative md:pt-[80px]">
					{
						data?.is_on_x === 1 ? <TokenEnd info={data} /> : <>
							<TokenAbout info={data} />
							<TokenTradeBox info={data} />
						</>
					}
				</div>
			</section>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={data} />
		</DefaultLayout>
	);
}