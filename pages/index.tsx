import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { HomeList } from "@/components/homeList";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site";
import { useQuery } from "@tanstack/react-query";

export default function IndexPage() {
	// const router = useRouter();
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
				{/* 左上角绿色光晕 */}
				<div 
					className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full blur-[60px] opacity-60 pointer-events-none z-0"
					style={{
						background: 'radial-gradient(circle, #9AED2D 0%, rgba(154, 237, 45, 0.8) 15%, rgba(154, 237, 45, 0.3) 35%, transparent 70%)'
					}}
				></div>
				<section className="flex flex-row-reverse items-center justify-center relative z-10">
					<div className="pt-[20px] block md:hidden">
						<NextImage src="/images/banner.png" width={215} height={215} alt="banner" />
					</div>
					<div className="hidden md:block w-[464px] h-[464px] shrink-0">
						<NextImage src="/images/banner.png" width={464} height={464} alt="banner" />
					</div>
					<div className="w-full">
						<div className="text-[26px] md:text-[50px] text-[#fff] text-center md:text-left font-bold">An innovation launchpad<br /> built on <span className="text-[#ABF909]">Pop Chain</span></div>
						<div className="text-[16px] md:text-[26px] text-[#AAAAAA] mt-[20px] md:mt-[30px] text-center md:text-left">Everyone can deploy a token with one click</div>
						<div className="w-full px-[30px] md:px-[0] mt-[50px] flex gap-[20px]">
							<Button className="bg-[#fff] w-[200px] h-[50px] rounded-[8px] md:rounded-full text-[16px] text-[#000000]">Token Creation</Button>
							<Button className="bg-[transparent] border-[1px] border-[#1E1E1E] w-[200px] h-[50px] rounded-[8px] md:rounded-full text-[16px] text-[#fff]">Modus Operandi</Button>
						</div>
					</div>
				</section>
				<HomeList />
			</div>
		</DefaultLayout>
	);
}