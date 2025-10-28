import { Navbar as HeroUINavbar, NavbarContent, Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@heroui/react";
import NextLink from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router"
import { Image, Input } from "@heroui/react"
import NextImage from "next/image"
import { shortenAddress, useIsMobile } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { TokenListSkeleton } from "./skeleton";

import { CloseIcon, LogoIcon, MenuCloseIcon, MenuIcon, SearchInputIcon, WalletIcon } from "@/components/icons";
import { TokenItem } from "./tokenItem";
import CreateForm from "./form";
import { WalletBox } from "./wallet";
import { siteConfig } from "@/config/site";
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';


export const Navbar = () => {
	const router = useRouter();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const { isOpen: isSecondModalOpen, onOpen: onSecondModalOpen, onOpenChange: onSecondModalOpenChange } = useDisclosure();

	const [searchValue, setSearchValue] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);

	const isMobile = useIsMobile();

	const [mounted, setMounted] = useState(false);
	const { openConnectModal } = useConnectModal();
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();


	const toLogout = async () => {
		try {
			// Disconnect wallet
			disconnect();
			// Close modal
			onSecondModalOpenChange();
			// Delay to ensure state update
			setTimeout(() => {
				router.replace('/');
			}, 100);
		} catch (error) {
			console.error('Logout error:', error);
			onSecondModalOpenChange();
			router.replace('/');
		}
	}

	// Listen to route changes, close modals
	useEffect(() => {
		const handleRouteChange = () => {
			// Close create token modal on route change
			if (isOpen) {
				onOpenChange();
			}
			// Also close wallet modal
			if (isSecondModalOpen) {
				onSecondModalOpenChange();
			}
		};

		router.events.on('routeChangeStart', handleRouteChange);

		return () => {
			router.events.off('routeChangeStart', handleRouteChange);
		};
	}, [router.events, isOpen, isSecondModalOpen, onOpenChange, onSecondModalOpenChange]);


	// Debounce search keywords
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchValue);
		}, 300); // 300ms debounce delay (shorter than search page for faster response)

		return () => clearTimeout(timer);
	}, [searchValue]);

	// Search token addresses and get details
	const { data: searchResults, isLoading: searchLoading } = useQuery({
		queryKey: ["navbarAddressSearch", debouncedSearch],
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

	// Handle clicking outside to close dropdown
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
		// Show dropdown when there's input, hide when empty
		setIsSearchDropdownOpen(value.length > 0);
	};

	const handleSearchFocus = () => {
		// Show dropdown on focus if there's content
		if (searchValue.length > 0) {
			setIsSearchDropdownOpen(true);
		}
	};

	// Handle search result click, close dropdown and clear search
	const handleSearchResultClick = () => {
		setIsSearchDropdownOpen(false);
		setSearchValue("");
		setDebouncedSearch("");
	};

	const handleWalletClick = () => {
		// Use hook to check screen size, open modal on PC, navigate to page on H5
		if (isMobile) {
			router.push('/user');
		} else {
			onSecondModalOpen();
		}
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<>
			<HeroUINavbar maxWidth="xl" position="static" className="fixed top-0 left-0 right-0 z-50 bg-[#000000]" classNames={{ wrapper: "px-4 h-[56px] md:h-[64px] bg-[#000000]" }}>
				<NextLink className="flex justify-start items-center logo-container" href="/">
					<LogoIcon className="w-[97] h-[28px]" />
				</NextLink>
				<div className="text-[14px] text-[#fff] hidden md:flex items-center gap-[16px] pl-[24px]">
					<NextLink href="/" className="hover:opacity-80 transition-opacity">Home</NextLink>
					<NextLink href="/create" className="hover:opacity-80 transition-opacity">
						Create Token
					</NextLink>
					<NextLink href={siteConfig.links.work} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">How It Works</NextLink>
					<NextLink href={siteConfig.links.x} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">X</NextLink>
					<NextLink href={siteConfig.links.tg} className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">Telegram</NextLink>
				</div>

				<NavbarContent justify="end" className="gap-[12px]">
					<div className="hidden md:block relative" ref={searchRef}>
						<Input
							classNames={{
								inputWrapper: "w-[300px] h-[40px] border-[#333] bg-[#1A1A1A] border-1",
								input: "text-[13px] text-[#fff] placeholder:text-[#666] tracking-[-0.07px]",
							}}
							name="amount"
							placeholder="Search for token addresses"
							variant="bordered"
							value={searchValue}
							onValueChange={handleSearchChange}
							onFocus={handleSearchFocus}
							startContent={<SearchInputIcon className="shrink-0" />}
						/>
						{isSearchDropdownOpen && (
							<div className="absolute top-[48px] w-[375px] h-[320px] bg-[#1A1A1A] rounded-[16px] border-[1px] border-[#333] p-[16px] pt-[8px] z-50 overflow-y-auto"
								style={{ boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.3)" }}
							>
								{searchLoading && debouncedSearch ? (
									<TokenListSkeleton count={5} className="!flex !flex-col md:!flex md:!flex-col md:!grid-cols-none" />
								) : searchResults && searchResults.length > 0 ? (
									<div>
										{searchResults.map((item: any, index: number) => (
											<div key={`navbar-search-${index}`} onClick={handleSearchResultClick} className="mb-[10px]">
												<TokenItem item={item} border />
											</div>
										))}
									</div>
								) : debouncedSearch && (
									<div className="h-full flex flex-col items-center justify-center">
										<Image src="/images/nothing.png" alt="nothing" className="w-[80px] h-auto" disableSkeleton />
										<div className="text-[14px] text-[#AAAAAA] mt-[12px]">No search results</div>
									</div>
								)}
							</div>
						)}
					</div>
					{!mounted ? (
						<div className="w-[96px] h-[36px] rounded-[12px] bg-[#2E2A55] animate-pulse" />
					) : isConnected ? (
						<button
							type="button"
							className="px-3 h-[36px] rounded-[12px] bg-[#1A1A1A] text-[13px] text-white flex items-center justify-center gap-[6px] border border-[#333] hover:border-[#abf909] hover:bg-[#2A2A2A] transition-colors max-w-[160px] cursor-pointer"
							title={address || ''}
							onClick={handleWalletClick}
						>
							<WalletIcon className="shrink-0" />
							<span className="truncate">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
						</button>
					) : (
						<button
							type="button"
							className="w-[96px] h-[36px] rounded-[12px] bg-[#abf909] active:scale-[0.97] text-[13px] font-medium text-[#000] hover:bg-[#9AED2D] flex items-center justify-center transition-colors"
							onClick={() => openConnectModal && openConnectModal()}
						>
							Connect
						</button>
					)}

					{router.pathname === '/user' ? (
						<MenuCloseIcon className="cursor-pointer block md:hidden" onClick={() => { router.back(); }} />
					) : (
						<MenuIcon className="cursor-pointer block md:hidden" onClick={() => { router.push('/user'); }} />
					)}
				</NavbarContent>
			</HeroUINavbar>
			<Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton isDismissable={false}>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{(onClose) => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">Create Now</div>
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
					border: "2px solid #333",
					background: "#1A1A1A"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{(onClose) => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">My Wallet</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[20px]">
								<WalletBox />
								<Button fullWidth className="h-[44px] bg-[#333] text-[15px] text-[#fff] rounded-[16px] mt-[6px] hover:bg-[#444] transition-colors" onPress={toLogout}>Disconnect</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
};
