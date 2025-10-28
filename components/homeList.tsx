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
		{ key: '1' as TabType, label: 'New Created' },
		{ key: '2' as TabType, label: 'Trending' },
		{ key: '3' as TabType, label: 'Launched' }
	];

	const handleSearchClick = () => {
		router.push('/search');
	};

	const handleTabClick = (tab: TabType) => {
		setActiveTab(tab);
	};

	// New created data
	const { data: newData, isLoading: newLoading, isFetching: newFetching } = useQuery({
		queryKey: ["tokenList", "newest"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=newest&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // Consider data fresh for 5 seconds to avoid frequent requests
		gcTime: 300000, // 5 minute garbage collection time to keep cache longer
		refetchInterval: 3000, // Refresh every 3 seconds
		refetchOnWindowFocus: false,
		refetchOnMount: false, // Don't automatically refetch on component mount
	});

	// Trending data
	const { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching } = useQuery({
		queryKey: ["tokenList", "trending"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=trending&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // Consider data fresh for 5 seconds to avoid frequent requests
		gcTime: 300000, // 5 minute garbage collection time to keep cache longer
		refetchInterval: 3000, // Refresh every 3 seconds
		refetchOnWindowFocus: false,
		refetchOnMount: false, // Don't automatically refetch on component mount
	});

	// Launched data
	const { data: listedData, isLoading: listedLoading, isFetching: listedFetching } = useQuery({
		queryKey: ["tokenList", "launched"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?sort=launched&limit=50');
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		placeholderData: (prev) => prev,
		staleTime: 5000, // Consider data fresh for 5 seconds to avoid frequent requests
		gcTime: 300000, // 5 minute garbage collection time to keep cache longer
		refetchInterval: 3000, // Refresh every 3 seconds
		refetchOnWindowFocus: false,
		refetchOnMount: false, // Don't automatically refetch on component mount
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
									<Image src="/images/nothing.png" alt="nothing" className="w-[80px] h-auto" disableSkeleton />
									<div className="text-[14px] text-[#AAAAAA] mt-[12px]">No results</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)
}