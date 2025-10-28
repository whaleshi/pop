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

	// 使用新的地址搜索API
	const { data: searchResults, isLoading: searchLoading } = useQuery({
		queryKey: ["searchTokens", debouncedSearch],
		queryFn: async () => {
			if (!debouncedSearch.trim()) {
				return [];
			}
			const response = await fetch(`/api/tokens/addresses?keyword=${encodeURIComponent(debouncedSearch.trim())}`);
			const data = await response.json();
			return data.success ? data.data : [];
		},
		enabled: !!debouncedSearch.trim(),
		staleTime: 30000,
		gcTime: 300000,
		retry: 1,
	});

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
							inputWrapper: "flex-1 h-[40px] border-[#333] bg-[#1A1A1A] border-1",
							input: "text-[13px] text-[#fff] placeholder:text-[#666] uppercase tracking-[-0.07px]",
						}}
						name="amount"
						placeholder="Search for token addresses"
						variant="bordered"
						value={searchValue}
						onValueChange={(value) => setSearchValue(value)}
						startContent={<SearchInputIcon className="shrink-0" />}
					/>
					<SearchCloseIcon className="shrink-0 cursor-pointer" onClick={() => router.push("/")} />
				</div>
				<div className="w-full mt-[10px] overflow-y-auto flex-1 max-h-[calc(100vh-124px)] pb-[20px]">
					{searchLoading && debouncedSearch ? (
						<TokenListSkeleton count={10} className="!flex !flex-col md:!flex md:!flex-col md:!grid-cols-none" />
					) : searchResults && searchResults.length > 0 ? (
						<div className="pb-[20px]">
							{searchResults.map((item: any, index: number) => (
								<div key={`search-${index}`} className="mb-[10px]"><TokenItem item={item} border /></div>
							))}
						</div>
					) : debouncedSearch && (
						<div className="flex flex-col items-center mt-[120px]">
							<Image src="/images/nothing.png" alt="nothing" className="w-[80px] h-auto" disableSkeleton />
							<div className="text-[14px] text-[#AAAAAA]">No search results</div>
							<Button className="w-[100px] h-[36px] rounded-[18px] bg-[#ABF909] hover:bg-[#9AED2D] text-[13px] text-[#000] font-medium mt-[16px]" onPress={() => router.push("/create")}>Create Token</Button>
						</div>
					)}
				</div>
			</section>
		</DefaultLayout>
	);
}
