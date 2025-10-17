import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { HomeList } from "@/components/homeList";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site";
import { useQuery } from "@tanstack/react-query";

export default function IndexPage() {
	const router = useRouter();
	const [currentBanner, setCurrentBanner] = useState(0);

	// 获取缓存状态
	const { data: cacheStats } = useQuery({
		queryKey: ["cache-stats"],
		queryFn: async () => {
			const response = await fetch('/api/cache/stats');
			const result = await response.json();
			return result.success ? result.data : null;
		},
		refetchInterval: 10000, // 每10秒刷新一次
		staleTime: 5000, // 5秒内认为数据是新鲜的
	});

	// 3秒切换banner图片
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentBanner(prev => prev === 0 ? 1 : 0);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	// 开发环境下显示缓存状态
	useEffect(() => {
		if (process.env.NODE_ENV === 'development' && cacheStats) {
			console.log('=== 缓存状态 ===');
			console.log('缓存项数量:', cacheStats.totalItems);
			console.log('过期项数量:', cacheStats.expiredItems);
			console.log('内存使用:', cacheStats.memoryUsage);
			console.log('运行时间:', cacheStats.uptime);
			console.log('================');
		}
	}, [cacheStats]);


	return (
		<DefaultLayout>
			<div className="flex flex-col h-full">
				<section className="flex flex-col items-center justify-center gap-4 py-[0px] md:py-[20px] pb-[24px]"
					style={{ background: "linear-gradient(180deg, #FFF 30%, #F5F6F9 100%)" }}
				>
					<div className="h-[120px] hidden md:block">
						<NextImage
							src={currentBanner === 0 ? "/images/banner.png" : "/images/banner1.png"}
							alt="banner"
							width={480}
							height={120}
							priority
							unoptimized
							className="select-none"
							style={{
								width: '480px',
								height: '120px',
								objectFit: 'contain',
								imageRendering: 'auto'
							}}
						/>
					</div>
					<div className="h-[160px] block md:hidden">
						<NextImage
							src={currentBanner === 0 ? "/images/bannerH5.png" : "/images/banner1H5.png"}
							alt="banner"
							width={360}
							height={160}
							priority
							unoptimized
							className="select-none"
							style={{
								width: '360px',
								height: '160px',
								objectFit: 'contain',
								imageRendering: 'auto'
							}}
						/>
					</div>
					<div className="w-full flex gap-[8px] md:hidden px-[16px]">
						<Button fullWidth variant="faded" className="h-[48px] border-[#EBEBEF] bg-[#fff] rounded-[16px] text-[15px] text-[#101010]" onPress={() => { window.open(siteConfig.links.work, '_blank') }}>运行机制</Button>
						<Button fullWidth className="h-[48px] bg-[#24232A] rounded-[16px] text-[15px] text-[#fff]" onPress={() => router.push("/create")}>创建代币</Button>
					</div>
				</section>
				<HomeList />
			</div>
		</DefaultLayout>
	);
}