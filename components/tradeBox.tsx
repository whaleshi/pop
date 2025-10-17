import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button, useDisclosure } from "@heroui/react"
import { Trade } from "./trade"
import { CloseIcon } from "./icons";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import { useAuthStore } from "@/stores/auth";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
// import usePrivyLogin from "@/hooks/usePrivyLogin";

interface TokenProps {
	info?: any;
}

export const TokenTradeBox = ({ info }: TokenProps) => {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const { address, clearAuthState } = useAuthStore();
	const [initialTab, setInitialTab] = useState<'buy' | 'sell'>('buy');

	const { authenticated, logout } = usePrivy();
	// const { toLogin } = usePrivyLogin();

	const newLogin = async () => {
		if (authenticated) {
			clearAuthState();
			await logout();
		}
		// toLogin();
	}

	const handleOpenTrade = (tab: 'buy' | 'sell') => {
		if (!address) {
			newLogin();
			return;
		}
		setInitialTab(tab);
		onOpen();
	};

	const balanceOfABI = [{
		inputs: [{ internalType: "address", name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	}];

	// 获取代币余额
	const { data: tokenBalance } = useQuery({
		queryKey: ['tokenBalance', info?.mint, address],
		queryFn: async () => {
			if (!info?.mint || !address) {
				return '0';
			}

			try {
				const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
				const contract = new ethers.Contract(info.mint, balanceOfABI, provider);
				const tokenBal = await contract.balanceOf(address);
				return ethers.formatEther(tokenBal);
			} catch (error) {
				console.error('获取代币余额失败:', error);
				return '0';
			}
		},
		enabled: !!(info?.mint && address),
		refetchInterval: 3000, // 每3秒刷新一次
		staleTime: 2000,
		retry: 1,
	});

	return (
		<div className="flex-1 w-full px-[16px] md:px-[0px]">
			<div className="w-full h-full flex items-end pb-[30px] md:hidden">
				<div className="flex gap-[12px] w-full">
					{
						parseFloat(tokenBalance!) > 0 && <Button fullWidth className="bg-[#FF4C4C] h-[48px] rounded-[16px] text-[15px] text-[#fff]" onPress={() => handleOpenTrade('sell')}>卖出</Button>
					}
					<Button fullWidth className="bg-[#00D935] h-[48px] rounded-[16px] text-[15px] text-[#fff]" onPress={() => handleOpenTrade('buy')}>买入</Button>
				</div>
			</div>
			<div className="hidden md:block border-[2px] border-[#F5F6F9] p-[16px] pt-[8px] bg-[#fff] rounded-[24px]">
				<div className="h-[48px] text-[17px] text-[#24232A] flex items-center justify-center">交易</div>
				<Trade info={info} tokenBalance={tokenBalance} initialTab={initialTab} />
			</div>
			<Drawer isOpen={isOpen} placement="bottom" onOpenChange={onOpenChange} hideCloseButton>
				<DrawerContent>
					{(onClose) => (
						<>
							<DrawerHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">交易</div>
								<CloseIcon className="absolute right-[16px] top-[20px]" onClick={onClose} />
							</DrawerHeader>
							<DrawerBody className="px-[16px] pb-[30px]">
								<Trade info={info} tokenBalance={tokenBalance} initialTab={initialTab} />
							</DrawerBody>
						</>
					)}
				</DrawerContent>
			</Drawer>
		</div>
	)
}