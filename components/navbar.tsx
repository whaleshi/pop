import { Navbar as HeroUINavbar, NavbarContent, Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@heroui/react";
import NextLink from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router"
import { Image, Input } from "@heroui/react"
import NextImage from "next/image"
import { usePrivy } from "@privy-io/react-auth";
// import usePrivyLogin from "@/hooks/usePrivyLogin";
import { useAuthStore } from "@/stores/auth";
import { shortenAddress, useIsMobile } from "@/utils";
import { getCoinList } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { TokenListSkeleton } from "./skeleton";

import { CloseIcon, LogoIcon, MenuCloseIcon, MenuIcon, SearchInputIcon, WalletIcon } from "@/components/icons";
import { TokenItem } from "./tokenItem";
import CreateForm from "./form";
import { WalletBox } from "./wallet";
import { siteConfig } from "@/config/site";


export const Navbar = () => {
	const router = useRouter();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const { isOpen: isSecondModalOpen, onOpen: onSecondModalOpen, onOpenChange: onSecondModalOpenChange } = useDisclosure();

	const [searchValue, setSearchValue] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);

	const { authenticated, logout } = usePrivy();
	// const { toLogin } = usePrivyLogin();
	const { isLoggedIn, address, clearAuthState, loginAccount } = useAuthStore();
	const isMobile = useIsMobile();

	const newLogin = async () => {
		if (authenticated) {
			clearAuthState();
			await logout();
		}
		// toLogin();
	}

	const toLogout = async () => {
		clearAuthState();
		try { await logout(); } catch { }
		onSecondModalOpenChange();
		router.replace('/');
	}

	// 监听路由变化，关闭弹窗
	useEffect(() => {
		const handleRouteChange = () => {
			// 路由变化时关闭创建代币弹窗
			if (isOpen) {
				onOpenChange();
			}
			// 同时关闭钱包弹窗
			if (isSecondModalOpen) {
				onSecondModalOpenChange();
			}
		};

		router.events.on('routeChangeStart', handleRouteChange);

		return () => {
			router.events.off('routeChangeStart', handleRouteChange);
		};
	}, [router.events, isOpen, isSecondModalOpen, onOpenChange, onSecondModalOpenChange]);


	// 防抖处理搜索关键词
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchValue);
		}, 300); // 300ms 防抖延迟 (比搜索页面短一些，提供更快响应)

		return () => clearTimeout(timer);
	}, [searchValue]);

	// 搜索API调用
	const { data: searchResults, isLoading: searchLoading } = useQuery({
		queryKey: ["navbarSearchCoinList", debouncedSearch],
		queryFn: async () => {
			if (!debouncedSearch.trim()) {
				return [];
			}
			const res: any = await getCoinList({
				keyword: debouncedSearch.trim(),
				page: 1,
				page_size: 10 // 下拉框显示少一些结果
			});
			return res?.data?.list ?? [];
		},
		enabled: !!debouncedSearch.trim(),
		staleTime: 30000, // 30秒内认为数据是新鲜的
		gcTime: 300000, // 5分钟垃圾回收时间
		retry: 1,
	});

	// 处理点击外部关闭下拉框
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setIsSearchDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleSearchChange = (value: string) => {
		setSearchValue(value);
		// 有输入内容时显示下拉框，无内容时隐藏
		setIsSearchDropdownOpen(value.length > 0);
	};

	const handleSearchFocus = () => {
		// 聚焦时如果有内容就显示下拉框
		if (searchValue.length > 0) {
			setIsSearchDropdownOpen(true);
		}
	};

	// 处理搜索结果点击，关闭下拉框并清空搜索
	const handleSearchResultClick = () => {
		setIsSearchDropdownOpen(false);
		setSearchValue("");
		setDebouncedSearch("");
	};

	const handleWalletClick = () => {
		// 使用hook检查屏幕尺寸，PC上打开弹窗，H5上跳转页面
		if (isMobile) {
			router.push('/user');
		} else {
			onSecondModalOpen();
		}
	};

	return (
		<>
			<HeroUINavbar maxWidth="xl" position="static" className="fixed top-0 left-0 right-0 z-50 bg-[#000000]" classNames={{ wrapper: "px-4 h-[56px] md:h-[64px] bg-[#000000]" }}>
				<NextLink className="flex justify-start items-center logo-container" href="/">
					<NextImage src='/images/logo.png' alt='logo' width={97} height={28} />
				</NextLink>
				{/* <div className="text-[14px] text-[#141414] hidden md:flex items-center gap-[16px] pl-[24px]">
					<NextLink href="/" className="hover:opacity-80 transition-opacity">首页</NextLink>
					<button
						className="hover:opacity-80 transition-opacity cursor-pointer"
						onClick={onOpen}
					>
						创建代币
					</button>
					<NextLink href={siteConfig.links.work} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">运行机制</NextLink>
					<NextLink href={siteConfig.links.x} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">X</NextLink>
					<NextLink href={siteConfig.links.tg} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">Telegram</NextLink>
				</div> */}

				<NavbarContent justify="end" className="gap-[12px]">
					<NextLink href={siteConfig.links.x} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
						<NextImage src='/images/x.png' alt='x' width={32} height={32} />
					</NextLink>
					<NextLink href={siteConfig.links.tg} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
						<NextImage src='/images/tg.png' alt='tg' width={32} height={32} />
					</NextLink>
					{/* {
						isLoggedIn ? <Button className="h-[36px] md:h-[40px] bg-[#F5F6F9] text-[13px] text-[#24232A] rounded-[12px]" variant="flat" onPress={handleWalletClick}>
							<WalletIcon />{shortenAddress(address!)}
						</Button> : <Button className="h-[36px] md:h-[40px] bg-[#F5F6F9] text-[13px] text-[#24232A] rounded-[12px]" variant="flat" onPress={newLogin}>
							连接钱包
						</Button>
					}

					{router.pathname === '/user' ? (
						<MenuCloseIcon className="cursor-pointer block md:hidden" onClick={() => { router.back(); }} />
					) : (
						<MenuIcon className="cursor-pointer block md:hidden" onClick={() => { router.push('/user'); }} />
					)} */}
				</NavbarContent>
			</HeroUINavbar>
			<Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton isDismissable={false}>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{(onClose) => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">立即创建</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[0px] pb-[0px]">
								<CreateForm />
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
			<Modal isOpen={isSecondModalOpen} onOpenChange={onSecondModalOpenChange} hideCloseButton placement="center"
				style={{
					borderRadius: "24px",
					border: "2px solid #FFF",
					background: "linear-gradient(180deg, #FFFDEB 0%, #FFF 70%)"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{(onClose) => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">我的钱包</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[20px]">
								<WalletBox />
								<Button fullWidth className="h-[44px] bg-[#EBEBEF] text-[15px] text-[#24232A] rounded-[16px] mt-[6px]" onPress={toLogout}>断开连接</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
};
