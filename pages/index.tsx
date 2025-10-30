import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { HomeList } from "@/components/homeList";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site";
import { useQuery } from "@tanstack/react-query";
import RippleGrid from '@/components/rippleGrid';
import { Trans, useTranslation } from 'react-i18next';

export default function IndexPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	// const [currentBanner, setCurrentBanner] = useState(0);

	// // 获取缓存状态
	// const { data: cacheStats } = useQuery({
	// 	queryKey: ["cache-stats"],
	// 	queryFn: async () => {
	// 		const response = await fetch('/api/cache/stats');
	// 		const result = await response.json();
	// 		return result.success ? result.data : null;
	// 	},
	// 	refetchInterval: 10000, // 每10秒刷新一次
	// 	staleTime: 5000, // 5秒内认为数据是新鲜的
	// });

	// // 3秒切换banner图片
	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		setCurrentBanner(prev => prev === 0 ? 1 : 0);
	// 	}, 3000);
	// 	return () => clearInterval(interval);
	// }, []);

	// // 开发环境下显示缓存状态
	// useEffect(() => {
	// 	if (process.env.NODE_ENV === 'development' && cacheStats) {
	// 		console.log('=== 缓存状态 ===');
	// 		console.log('缓存项数量:', cacheStats.totalItems);
	// 		console.log('过期项数量:', cacheStats.expiredItems);
	// 		console.log('内存使用:', cacheStats.memoryUsage);
	// 		console.log('运行时间:', cacheStats.uptime);
	// 		console.log('================');
	// 	}
	// }, [cacheStats]);


	return (
		<DefaultLayout>
			<div className="flex flex-col h-full max-w-[1280px] mx-auto px-4 relative">
				{/* <div
					className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full blur-[60px] opacity-60 pointer-events-none z-0"
					style={{
						background: 'radial-gradient(circle, #9AED2D 0%, rgba(154, 237, 45, 0.8) 15%, rgba(154, 237, 45, 0.3) 35%, transparent 70%)'
					}}
				></div> */}
				<section className="flex items-center justify-center relative min-h-[350px] md:min-h-[420px] py-[30px] md:py-[40px]">
					<div className="absolute inset-0 w-full h-full overflow-hidden bg-[#000000]">
						<RippleGrid
							enableRainbow={false}
							gridColor="#abf909"
							rippleIntensity={0.08}
							gridSize={10}
							gridThickness={8}
							mouseInteraction={true}
							mouseInteractionRadius={2}
							opacity={0.35}
						/>
					</div>
					<div className="w-full relative z-10 flex flex-col items-center justify-center max-w-[800px] px-[20px]">
						<div className="text-[32px] md:text-[56px] text-[#fff] text-center font-bold leading-tight mb-[24px]">
							<Trans
								i18nKey="home.tagline"
								components={{
									br: <br />,
									highlight: <span className="text-[#ABF909]" />
								}}
							/>
						</div>
						<div className="text-[18px] md:text-[24px] text-[#AAAAAA] text-center max-w-[600px] mb-[48px]">
							{t('home.subtitle')}
						</div>
						<div className="flex flex-row gap-[12px] md:gap-[16px] items-center justify-center w-full max-w-[320px] md:max-w-none mx-auto">
							<Button
								className="bg-[#ABF909] hover:bg-[#C8FF1A] active:scale-[0.98] flex-1 md:flex-none md:w-[180px] h-[48px] rounded-[16px] text-[14px] md:text-[15px] font-semibold text-[#000000] transition-all duration-200 shadow-lg hover:shadow-xl"
								onPress={() => router.push('/create')}
							>
								{t('home.launchToken')}
							</Button>
							<Button className="bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-[1px] border-[rgba(171,249,9,0.2)] hover:border-[rgba(171,249,9,0.5)] hover:bg-[rgba(171,249,9,0.1)] flex-1 md:flex-none md:w-[180px] h-[48px] rounded-[16px] text-[14px] md:text-[15px] font-medium text-[#fff] transition-all duration-200">
								{t('home.learnMore')}
							</Button>
						</div>
					</div>
				</section>
				<HomeList />
			</div>
		</DefaultLayout>
	);
}