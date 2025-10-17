'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { ethers } from "ethers";

interface BalanceContextType {
	balance: number;
	price: number;
	symbol: string;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
	const { ready, authenticated, user } = usePrivy()
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const [balance, setBalance] = useState<any>(0);
	const [price, setPrice] = useState<any>(0);
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

	// 使用自定义认证状态的地址，并找到对应的钱包对象用于获取 provider
	const wallet = address ? wallets.find(w => w.address?.toLowerCase() === address.toLowerCase()) : null;
	const currentAddress = address;
	const isConnected = ready && isLoggedIn && !!currentAddress;

	// 初始化 provider
	useEffect(() => {
		const initializeProvider = async () => {
			if (wallet) {
				try {
					const ethereumProvider = await wallet.getEthereumProvider();
					const ethersProvider = new ethers.BrowserProvider(ethereumProvider);
					setProvider(ethersProvider);
				} catch (error) {
					console.error('Failed to initialize provider:', error);
				}
			}
		};

		if (isConnected && wallet) {
			initializeProvider();
		}
	}, [wallet, isConnected]);

	// 获取余额
	useEffect(() => {
		const fetchBalance = async () => {
			if (!provider || !currentAddress) {
				setBalance(0);
				return;
			}

			try {
				const ethBalance = await provider.getBalance(currentAddress);
				console.log(ethBalance)
				const formatted = ethers.formatEther(ethBalance);
				setBalance(formatted);
			} catch (error) {
				console.error('Failed to fetch balance:', error);
				setBalance(0);
			}
		};

		if (provider && currentAddress) {
			fetchBalance();
			// 每 10 秒更新一次余额
			const interval = setInterval(fetchBalance, 10000);
			return () => clearInterval(interval);
		} else {
			setBalance(0);
		}
	}, [provider, currentAddress]);

	return (
		<BalanceContext.Provider
			value={{
				balance,
				price,
				symbol: 'BNB',
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
