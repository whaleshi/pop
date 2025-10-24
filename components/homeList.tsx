import React, { useState } from "react";
import { SearchIcon } from "./icons"
import { TokenItem } from "./tokenItem"
import { useRouter } from "next/router"
import { useQuery } from "@tanstack/react-query";
import { Image, Button } from "@heroui/react";
import { TokenListSkeleton } from "./skeleton";

type TabType = '1' | '2' | '3';

export const HomeList = () => {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<TabType>('1');

	const tabs = [
		{ key: '1' as TabType, label: '新创建' },
		{ key: '2' as TabType, label: '飙升' },
		{ key: '3' as TabType, label: '已开盘' }
	];

	const handleSearchClick = () => {
		router.push('/search');
	};

	const handleTabClick = (tab: TabType) => {
		setActiveTab(tab);
	};

	// 新创建数据
	const { data: newData, isLoading: newLoading, isFetching: newFetching } = useQuery({
		queryKey: ["tokenList", "newest"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=newest&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // 5秒内认为数据是新鲜的，避免频繁请求
		gcTime: 300000, // 5分钟垃圾回收时间，保持缓存更久
		refetchInterval: 3000, // 3秒刷新一次
		refetchOnWindowFocus: false,
		refetchOnMount: false, // 组件挂载时不自动重新获取
	});

	// 飙升数据
	const { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching } = useQuery({
		queryKey: ["tokenList", "trending"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=trending&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // 5秒内认为数据是新鲜的，避免频繁请求
		gcTime: 300000, // 5分钟垃圾回收时间，保持缓存更久
		refetchInterval: 3000, // 3秒刷新一次
		refetchOnWindowFocus: false,
		refetchOnMount: false, // 组件挂载时不自动重新获取
	});

	// 已开盘数据
	const { data: listedData, isLoading: listedLoading, isFetching: listedFetching } = useQuery({
		queryKey: ["tokenList", "launched"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=launched&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // 5秒内认为数据是新鲜的，避免频繁请求
		gcTime: 300000, // 5分钟垃圾回收时间，保持缓存更久
		refetchInterval: 3000, // 3秒刷新一次
		refetchOnWindowFocus: false,
		refetchOnMount: false, // 组件挂载时不自动重新获取
	});

	// 根据当前选中的标签获取对应的数据
	const getCurrentData = () => {
		switch (activeTab) {
			case '1': return { data: newData, isLoading: newLoading, isFetching: newFetching };
			case '2': return { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching };
			case '3': return { data: listedData, isLoading: listedLoading, isFetching: listedFetching };
			default: return { data: newData, isLoading: newLoading, isFetching: newFetching };
		}
	};

	const { data: currentData, isLoading: currentLoading } = getCurrentData();

	// 优化骨架屏显示逻辑 - 只有在真正加载且无数据时才显示
	const showSkeleton = currentLoading && !currentData;

	return (
		<>
			<div className="bg-[#000000] h-full">
				<div className="h-[60px] flex items-center justify-between">
					<div className="text-[17px] flex gap-[16px] items-center">
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`cursor-pointer transition-all duration-200 ${activeTab === tab.key
									? 'text-[#FFFFFF] font-bold'
									: 'text-[#AAAAAA] font-medium hover:text-[#FFFFFF]'
									}`}
								onClick={() => handleTabClick(tab.key)}
							>
								{tab.label}
							</div>
						))}
					</div>
					{/* <div className="h-[28px] bg-[#EBEBEF] rounded-[12px] pl-[6px] pr-[8px] text-[13px] text-[#94989F] flex items-center gap-[4px] cursor-pointer" onClick={handleSearchClick}>
						<SearchIcon /><span className="pt-[2px]">搜索</span>
					</div> */}
					<div className="bg-[#0E0E0E] rounded-[10px] w-[200px] h-[40px] cursor-pointer flex items-center px-[12px] text-[16px] text-[#AAAAAA] gap-[10px]"><SearchIcon />Search</div>
				</div>
				<div className="">
					{showSkeleton ? (
						<TokenListSkeleton count={20} />
					) : (
						<div className="pb-[20px]">
							{currentData && currentData.length > 0 ? (
								<div className="flex flex-col gap-[12px] md:grid md:grid-cols-3 md:gap-[12px]">
									{currentData.map((item: any, index: number) => (
										<TokenItem key={index} item={item} />
									))}
								</div>
							) : (
								<div className="flex flex-col items-center mt-[120px]">
									<Image src="/images/nothing.png" alt="nothing" className="w-[80px] h-auto" disableSkeleton />
									<div className="text-[14px] text-[#717075]">暂无结果</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)
}