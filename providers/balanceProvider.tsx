'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { useQuery } from "@tanstack/react-query";
import { config } from "@/config/wagmi";
import { getBalance } from '@wagmi/core';
import { ethers } from "ethers";

interface BalanceContextType {
	balance: number;
	price: number;
	symbol: string;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
	const { address, isConnected } = useAccount();
	const [price, setPrice] = useState<any>(0);

	// 获取钱包余额
	const { data: walletBalance, isLoading: balanceLoading } = useQuery({
		queryKey: ['walletBalance', address],
		queryFn: async () => {
			if (!isConnected || !address) {
				return null;
			}
			try {
				const balance = await getBalance(config, {
					address: address as `0x${string}`,
				});
				return balance;
			} catch (error) {
				console.error('Failed to fetch wallet balance:', error);
				return null;
			}
		},
		enabled: !!(isConnected && address),
		refetchInterval: 3000, // 每3秒刷新一次余额
		staleTime: 2000,
		retry: 2,
	});

	// 格式化余额
	const balance = walletBalance ? Number(ethers.formatEther(walletBalance.value)) : 0;

	return (
		<BalanceContext.Provider
			value={{
				balance,
				price,
				symbol: 'POP',
			}}
		>
			{children}
		</BalanceContext.Provider>
	);
}

export function useBalanceContext() {
	const ctx = useContext(BalanceContext);
	if (!ctx) throw new Error("useBalanceContext must be used within BalanceProvider");
	return ctx;
}
