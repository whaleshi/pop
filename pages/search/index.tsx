import { BackIcon, SearchCloseIcon, SearchInputIcon } from "@/components/icons";
import { TokenItem } from "@/components/tokenItem";
import DefaultLayout from "@/layouts/default";
import { Input, Image, Button } from "@heroui/react";
import { useRouter } from "next/router"
import { useQuery } from "@tanstack/react-query";
import { TokenListSkeleton } from "@/components/skeleton";

import React, { useState, useEffect } from "react";

export default function Search() {
	const router = useRouter();
	const [searchValue, setSearchValue] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [isMdOrLarger, setIsMdOrLarger] = useState(true);

	// 防抖处理搜索关键词
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchValue);
		}, 500); // 500ms 防抖延迟

		return () => clearTimeout(timer);
	}, [searchValue]);

	// 获取所有token数据用于本地搜索
	const { data: allTokens, isLoading: tokensLoading } = useQuery({
		queryKey: ["allTokens"],
		queryFn: async () => {
			const response = await fetch('/api/tokens/list?limit=1000'); // 获取大量数据用于搜索
			const data = await response.json();
			return data.success ? data.data.tokens : [];
		},
		staleTime: 60000, // 1分钟缓存
		gcTime: 300000, // 5分钟垃圾回收
	});

	// 本地搜索过滤
	const searchResults = React.useMemo(() => {
		if (!debouncedSearch.trim() || !allTokens) {
			return [];
		}
		
		const searchLower = debouncedSearch.trim().toLowerCase();
		return allTokens.filter((token: any) => 
			token.address.toLowerCase().includes(searchLower)
		).slice(0, 50); // 限制显示50条结果
	}, [debouncedSearch, allTokens]);

	const searchLoading = tokensLoading;

	// 检测屏幕尺寸是否为 md 或更大
	useEffect(() => {
		const checkScreenSize = () => {
			const isMd = window.matchMedia('(min-width: 768px)').matches;
			setIsMdOrLarger(isMd);

			if (isMd) {
				router.replace('/');
			}
		};

		// 初始检查
		checkScreenSize();

		// 监听屏幕尺寸变化
		const mediaQuery = window.matchMedia('(min-width: 768px)');
		mediaQuery.addEventListener('change', checkScreenSize);

		return () => {
			mediaQuery.removeEventListener('change', checkScreenSize);
		};
	}, [router]);

	// 如果屏幕尺寸小于 md，不渲染页面内容
	if (isMdOrLarger) {
		return null;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center w-full px-[16px] h-full pt-[8px]">
				<div className="w-full flex items-center gap-[12px]">
					<Input
						classNames={{
							inputWrapper: "flex-1 h-[40px] border-[#EBEBEF] bg-[#F5F6F9] border-1",
							input: "text-[13px] text-[#24232A] placeholder:text-[#94989F] uppercase tracking-[-0.07px]",
						}}
						name="amount"
						placeholder="搜索代币地址"
						variant="bordered"
						value={searchValue}
						onValueChange={(value) => setSearchValue(value)}
						startContent={<SearchInputIcon className="shrink-0" />}
					/>
					<SearchCloseIcon className="shrink-0 cursor-pointer" onClick={() => router.push("/")} />
				</div>
				<div className="w-full mt-[10px] overflow-y-auto flex-1 max-h-[calc(100vh-124px)] pb-[20px]">
					{searchLoading && debouncedSearch ? (
						<TokenListSkeleton count={10} />
					) : searchResults && searchResults.length > 0 ? (
						<div className="pb-[20px]">
							{searchResults.map((item: any, index: number) => (
								<TokenItem key={`search-${index}`} item={item} border />
							))}
						</div>
					) : debouncedSearch && (
						<div className="flex flex-col items-center mt-[120px]">
							<Image src="/images/nothing.png" alt="nothing" className="w-[80px] h-auto" disableSkeleton />
							<div className="text-[14px] text-[#717075]">暂无搜索结果</div>
							<div className="text-[12px] text-[#94989F] mt-[8px]">立即创建 抢占引领全球流行的先机</div>
							<Button className="w-[100px] h-[36px] rounded-[18px] bg-[#24232A] text-[13px] text-[#fff] mt-[16px]" onPress={() => router.push("/create")}>创建代币</Button>
						</div>
					)}
				</div>
			</section>
		</DefaultLayout>
	);
}
