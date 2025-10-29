import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button, useDisclosure } from "@heroui/react"
import { Trade } from "./trade"
import { CloseIcon } from "./icons";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import { useAccount } from 'wagmi';
import { useState } from "react";
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface TokenProps {
	info?: any;
	metadata?: any;
}

export const TokenTradeBox = ({ info, metadata }: TokenProps) => {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const { address, isConnected } = useAccount();
	const { openConnectModal } = useConnectModal();
	const [initialTab, setInitialTab] = useState<'buy' | 'sell'>('buy');

	const handleOpenTrade = (tab: 'buy' | 'sell') => {
		if (!isConnected || !address) {
			openConnectModal?.();
			return;
		}
		setInitialTab(tab);
		onOpen();
	};

	// Get token balance
	const { data: tokenBalance } = useQuery({
		queryKey: ['tokenBalance', info?.address, address],
		queryFn: async () => {
			if (!info?.address || !address) {
				return '0';
			}

			try {
				const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
				const balanceOfABI = [{
					inputs: [{ internalType: "address", name: "account", type: "address" }],
					name: "balanceOf",
					outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
					stateMutability: "view",
					type: "function",
				}];
				const contract = new ethers.Contract(info?.address, balanceOfABI, provider);
				const tokenBal = await contract.balanceOf(address);
				return ethers.formatEther(tokenBal);
			} catch (error) {
				console.error('Failed to get token balance:', error);
				return '0';
			}
		},
		enabled: !!(info?.address && address),
		refetchInterval: 3000, // Refresh every 3 seconds
		staleTime: 2000,
		retry: 1,
	});

	return (
		<div className="flex-1 w-full px-[16px] md:px-[0px]">
			<div className="w-full h-full flex items-end md:hidden">
				<div className="flex gap-[12px] w-full">
					{
						parseFloat(tokenBalance!) > 0 && <Button fullWidth className="bg-[#FF4C4C] h-[48px] rounded-[16px] text-[15px] text-[#fff]" onPress={() => handleOpenTrade('sell')}>Sell</Button>
					}
					<Button fullWidth className="bg-[#9AED2D] h-[48px] rounded-[16px] text-[15px] text-[#000]" onPress={() => handleOpenTrade('buy')}>Buy</Button>
				</div>
			</div>
			<div className="hidden md:block border-[2px] border-[#333] p-[16px] pt-[8px] bg-[#1A1A1A] rounded-[24px]">
				<div className="h-[48px] text-[17px] text-[#fff] flex items-center justify-center">Trade</div>
				<Trade info={info} metadata={metadata} tokenBalance={tokenBalance} initialTab={initialTab} />
			</div>
			<Drawer isOpen={isOpen} placement="bottom" onOpenChange={onOpenChange} hideCloseButton>
				<DrawerContent
					style={{
						borderRadius: "24px 24px 0 0",
						border: "2px solid #333",
						background: "#1A1A1A"
					}}
				>
					{(onClose) => (
						<>
							<DrawerHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">Trade</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</DrawerHeader>
							<DrawerBody className="px-[16px] pb-[30px]">
								<Trade info={info} metadata={metadata} tokenBalance={tokenBalance} initialTab={initialTab} />
							</DrawerBody>
						</>
					)}
				</DrawerContent>
			</Drawer>
		</div>
	)
}