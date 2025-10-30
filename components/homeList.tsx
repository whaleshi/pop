import React, { useState, useEffect } from "react";
import { SearchIcon } from "./icons"
import { TokenItem } from "./tokenItem"
import { useRouter } from "next/router"
import { useQuery } from "@tanstack/react-query";
import { Image, Button } from "@heroui/react";
import { TokenListSkeleton } from "./skeleton";
import { useTranslation } from 'react-i18next';

type TabType = '1' | '2' | '3';

export const HomeList = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [activeTab, setActiveTab] = useState<TabType>('1');

	const tabs = [
		{ key: '1' as TabType, label: t('home.newCreated') },
		{ key: '2' as TabType, label: t('home.trending') },
		{ key: '3' as TabType, label: t('home.launched') }
	];

	const handleSearchClick = () => {
		router.push('/search');
	};

	const handleTabClick = (tab: TabType) => {
		setActiveTab(tab);
	};

	// 简化的获取基础代币数据函数
	const fetchTokenList = async (sort: string) => {
		const response = await fetch(`/api/tokens/list?sort=${sort}&limit=50`);
		const data = await response.json();
		return data.success ? data.data.tokens : [];
	};

	// New created data - 只获取基础数据
	const { data: newData, isLoading: newLoading, isFetching: newFetching } = useQuery({
		queryKey: ["tokenList", "newest"],
		queryFn: () => fetchTokenList("newest"),
		placeholderData: (prev) => prev,
		staleTime: 5000,
		gcTime: 300000,
		refetchInterval: 3000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Trending data - 只获取基础数据
	const { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching } = useQuery({
		queryKey: ["tokenList", "trending"],
		queryFn: () => fetchTokenList("trending"),
		placeholderData: (prev) => prev,
		staleTime: 5000,
		gcTime: 300000,
		refetchInterval: 3000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Launched data - 只获取基础数据
	const { data: listedData, isLoading: listedLoading, isFetching: listedFetching } = useQuery({
		queryKey: ["tokenList", "launched"],
		queryFn: () => fetchTokenList("launched"),
		placeholderData: (prev) => prev,
		staleTime: 5000,
		gcTime: 300000,
		refetchInterval: 3000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Get corresponding data based on currently selected tab
	const getCurrentData = () => {
		switch (activeTab) {
			case '1': return { data: newData, isLoading: newLoading, isFetching: newFetching };
			case '2': return { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching };
			case '3': return { data: listedData, isLoading: listedLoading, isFetching: listedFetching };
			default: return { data: newData, isLoading: newLoading, isFetching: newFetching };
		}
	};

	const { data: currentData, isLoading: currentLoading } = getCurrentData();

	// Optimize skeleton screen display logic - only show when actually loading and no data
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
									? 'text-[#FFFFFF] font-medium'
									: 'text-[#AAAAAA] font-medium hover:text-[#FFFFFF]'
									}`}
								onClick={() => handleTabClick(tab.key)}
							>
								{tab.label}
							</div>
						))}
					</div>
					<div className="w-[32px] h-[32px] bg-[#1A1A1A] border border-[#333] rounded-[8px] cursor-pointer flex items-center justify-center hover:bg-[#2A2A2A] transition-colors md:hidden" onClick={handleSearchClick}>
						<SearchIcon />
					</div>
				</div>
				<div className="">
					{showSkeleton ? (
						<TokenListSkeleton count={20} />
					) : (
						<div className="">
							{currentData && currentData.length > 0 ? (
								<div className="flex flex-col gap-[12px] md:grid md:grid-cols-3 md:gap-[12px]">
									{currentData.map((item: any, index: number) => (
										<TokenItem key={index} item={item} />
									))}
								</div>
							) : (
								<div className="flex flex-col items-center mt-[120px]">
									<Image src="/images/nothing.png" alt="nothing" className="w-[60px] h-auto" disableSkeleton />
									<div className="text-[14px] text-[#AAAAAA] mt-[12px]">{t('home.noResults')}</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)
}