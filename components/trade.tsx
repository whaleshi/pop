import { Button, Input } from "@heroui/react"
import React, { useEffect, useState, useRef } from "react";
import MyAvatar from "@/components/avatarImage";
import { SetIcon } from "./icons";
import Slippage from "./slippage";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from 'sonner';
import FactoryABI from "@/constant/TokenFactory.abi.json";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { formatBigNumber } from "@/utils/formatBigNumber";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
import { useSlippageStore } from "@/stores/slippage";
import { useTranslation } from 'react-i18next';
import { useNetworkSwitcher } from '@/hooks/useNetworkSwitcher';
import { useReferral } from '@/providers/referralProvider';

type TradeType = 'buy' | 'sell';

interface TokenProps {
	info?: any;
	metadata?: any;
	tokenBalance?: string;
	initialTab?: 'buy' | 'sell';
}

export const Trade = ({ info, metadata, tokenBalance, initialTab = 'buy' }: TokenProps) => {
	const { t } = useTranslation('common');
	const [isBuy, setIsBuy] = useState(() => initialTab === 'buy');
	const [selectedTab, setSelectedTab] = useState<TradeType>(() => initialTab);
	const [isSlippageOpen, setIsSlippageOpen] = useState(false);
	const [inputAmount, setInputAmount] = useState('');
	const [outputAmount, setOutputAmount] = useState("");
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { balance } = useBalanceContext();
	const { slippage } = useSlippageStore();
	const queryClient = useQueryClient();
	const mountedRef = useRef(false);
	const { referralInviter, referralSignature, consumeReferralCode } = useReferral();

	const { address, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const { isCorrectNetwork } = useNetworkSwitcher();

	const handleTabClick = (tab: TradeType) => {
		setSelectedTab(tab);
		setIsBuy(tab === 'buy');
		setInputAmount('');
		setSelectedAmount(null);
		setError(null);
	};

	// Validate input
	const validateInput = (): string | null => {
		if (!isConnected) {
			return t('validation.pleaseConnectWallet');
		}

		if (!isCorrectNetwork) {
			return t('validation.wrongNetwork');
		}

		if (!inputAmount || inputAmount.trim() === '') {
			return t('validation.enterTradeAmount');
		}

		const amount = parseFloat(inputAmount);
		if (isNaN(amount) || amount <= 0) {
			return t('validation.enterValidAmount');
		}

		if (selectedTab === 'buy') {
			// Buy validation
			if (!balance || balance === 0) {
				return t('validation.insufficientPopBalance');
			}

			if (_bignumber(inputAmount).gt(balance)) {
				return t('validation.insufficientPopBalanceDetailed', {
					balance: formatBigNumber(balance)
				});
			}

			// Reserve gas fee check
			const gasReserve = 0.001;
			if (_bignumber(inputAmount).plus(gasReserve).gt(balance)) {
				return t('validation.reserveGasFees');
			}
		} else {
			// Sell validation
			if (!tokenBalance || parseFloat(tokenBalance) === 0) {
				return t('validation.insufficientTokenBalance');
			}

			if (_bignumber(inputAmount).gt(tokenBalance)) {
				return t('validation.insufficientTokenBalanceDetailed', {
					balance: formatBigNumber(tokenBalance),
					symbol: metadata?.symbol?.toUpperCase() || 'Token'
				});
			}
		}

		return null;
	};

	const buyAmounts = [
		{ label: "50", value: 50 },
		{ label: "100", value: 100 },
		{ label: "200", value: 200 },
		{ label: "500", value: 500 }
	];

	const sellAmounts = [
		{ label: "25%", value: 0.25 },
		{ label: "50%", value: 0.5 },
		{ label: "75%", value: 0.75 },
		{ label: "100%", value: 1.0 }
	];

	const currentAmounts = selectedTab === 'buy' ? buyAmounts : sellAmounts;

	const handleAmountSelect = (amount: { label: string; value: number }) => {
		setSelectedAmount(amount.value);
		if (selectedTab === 'buy') {
			setInputAmount(amount.value.toString());
		} else {
			if (tokenBalance && _bignumber(tokenBalance).gt(0)) {
				try {
					const userBalance = _bignumber(tokenBalance);
					const percentage = _bignumber(amount.value);
					const sellAmount = userBalance.times(percentage);
					console.log('User balance:', userBalance.toString());
					// Format result, properly handle trailing zeros after decimal point
					const formattedAmount = sellAmount.dp(18, _bignumber.ROUND_DOWN).toFixed();
					console.log('Calculated sell amount:', formattedAmount);

					// 只有当包含小数点时才去除尾随零，避免删除整数末尾的有意义零
					const finalAmount = formattedAmount.includes('.') ?
						formattedAmount.replace(/\.?0+$/, '') :
						formattedAmount;

					setInputAmount(finalAmount);
				} catch (error) {
					console.error('Failed to calculate sell amount:', error);
					setInputAmount('0');
				}
			} else {
				// If no balance, set to 0
				setInputAmount('0');
			}
		}
	};

	const { data: estimatedOutput } = useQuery({
		queryKey: ['estimateOutput', info?.address, inputAmount, isBuy],
		queryFn: async () => {
			if (!inputAmount || !info?.address || parseFloat(inputAmount) <= 0) {
				return '0';
			}

			try {
				const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
				const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);

				if (isBuy) {
					// 调用 tryBuy 获取预期代币输出
					const result = await readOnlyContract.tryBuy(info?.address, ethers.parseEther(inputAmount));
					const tokenAmountOut = result[0];
					return ethers.formatEther(tokenAmountOut);
				} else {
					// 调用 trySell 获取预期ETH输出
					const sellAmount = ethers.parseEther(inputAmount);
					const result = await readOnlyContract.trySell(info?.address, sellAmount);
					return ethers.formatEther(result);
				}
			} catch (error) {
				console.error('Failed to estimate output:', error);
				return '0';
			}
		},
		enabled: !!(inputAmount && info?.address && parseFloat(inputAmount) > 0),
		refetchInterval: 3000, // Refresh every 3 seconds
		staleTime: 2000,
		retry: 1,
	});

	useEffect(() => {
		setInputAmount("");
		setOutputAmount("");
	}, [isBuy]);

	// Set mounted flag
	useEffect(() => {
		mountedRef.current = true;
	}, []);

	// Only update state after component is mounted and initialTab actually changes, avoiding state updates during hydration
	useEffect(() => {
		if (mountedRef.current) {
			setSelectedTab(initialTab);
			setIsBuy(initialTab === 'buy');
		}
	}, [initialTab]);

	useEffect(() => {
		if (estimatedOutput) {
			// Format output, remove excess decimal places
			const formatted = formatBigNumber(estimatedOutput);
			setOutputAmount(formatted);
		} else {
			setOutputAmount("");
		}
	}, [estimatedOutput]);

	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

	// Initialize provider and signer
	useEffect(() => {
		const initializeProvider = async () => {
			if (walletClient && publicClient) {
				try {
					// Create provider using walletClient transport
					const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
					const ethersSigner = await ethersProvider.getSigner();

					setProvider(ethersProvider);
					setSigner(ethersSigner);
				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && walletClient) {
			initializeProvider();
		}
	}, [walletClient, publicClient, isConnected]);

	const handleClick = async (tokenAddress: string, amount: string) => {
		// Validate input
		const validationError = validateInput();
		if (validationError) {
			toast.error(validationError);
			return;
		}

		if (!signer || !provider) {
			toast.error(t('trade.walletNotConnected'));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const contract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, signer);
			const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);
			const slippagePercentage = slippage;

			if (selectedTab === 'buy') {
				// Buy logic
				console.log("Calling tryBuy with parameters:");
				console.log("Token address:", tokenAddress);
				console.log("Amount:", ethers.parseEther(amount));

				// 1. Call tryBuy to get expected output
				console.log(111)
				const result = await readOnlyContract.tryBuy(tokenAddress, ethers.parseEther(amount));
				console.log("tryBuy result:", result);

				// 2. Calculate slippage protection
				const tokenAmountOut = result[0];
				const minAmountOut = (tokenAmountOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

				console.log("buyToken parameters:");
				console.log(`MinAmountOut (with ${slippagePercentage}% slippage):`, minAmountOut.toString());

				// 3. Estimate gas and execute buy transaction
				let gasLimit;
				try {
					const tempInviter = referralInviter || ethers.ZeroAddress;
					const tempSignature = referralSignature || '0x';
					const tempInvite = { inviter: tempInviter };
					console.log(tokenAddress, ethers.parseEther(amount), minAmountOut, tempInvite, tempSignature)
					const estimatedGas = await contract.buyTokenWithReferral.estimateGas(tokenAddress, ethers.parseEther(amount), minAmountOut, tempInvite, tempSignature, {
						value: ethers.parseEther(amount),
					});
					console.log(2)
					gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
				} catch (e) {
					console.log(1)
					console.warn("Gas estimation failed:", e);
				}

				const gasPrice = (await provider.getFeeData()).gasPrice;
				const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

				const txOptions = {
					value: ethers.parseEther(amount),
				} as any;

				if (gasLimit) txOptions.gasLimit = gasLimit;
				if (newGasPrice) txOptions.gasPrice = newGasPrice;

				let buyResult;
				const referral = consumeReferralCode();

				let inviterAddress = ethers.ZeroAddress;
				let finalSignature = '0x';

				if (referral) {
					inviterAddress = referral.inviter;
					finalSignature = referral.signature;
					console.log("Using referral inviter:", inviterAddress);
				}

				const invite = { inviter: inviterAddress };
				console.log("buyTokenWithReferral params:", {
					tokenAddress,
					amount: ethers.parseEther(amount).toString(),
					minAmountOut: minAmountOut.toString(),
					invite,
					signature: finalSignature,
					txOptions
				});
				buyResult = await contract.buyTokenWithReferral(tokenAddress, ethers.parseEther(amount), minAmountOut, invite, finalSignature, txOptions);
				console.log("buyTokenWithReferral transaction sent:", buyResult.hash, "inviter:", inviterAddress);

				toast.success(t('messages.transactionSubmitted'), {
					description: `${t('messages.transactionHash')}: ${buyResult.hash.slice(0, 10)}...${buyResult.hash.slice(-6)}`
				});

				// Asynchronously wait for transaction confirmation in background (don't block execution)
				buyResult.wait().then((receipt: any) => {
					console.log("buyToken transaction confirmed:", receipt, outputAmount);
				}).catch((error: any) => {
					console.error("Buy transaction confirmation failed:", error);
				});



				// Clear input
				setInputAmount('');
				setSelectedAmount(null);

				// Refresh balance and token list
				queryClient.invalidateQueries({ queryKey: ['balance'] });
				queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
				queryClient.invalidateQueries({ queryKey: ['coinList'] });

			} else {
				// Sell logic
				console.log("Calling trySell with parameters:");
				console.log("Token address:", tokenAddress);
				console.log("Token amount:", ethers.parseEther(amount));

				// ERC20 ABI for approval
				const erc20Abi = [
					"function allowance(address owner, address spender) view returns (uint256)",
					"function approve(address spender, uint256 amount) returns (bool)"
				];

				// 1. Check allowance
				const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
				const sellAmount = ethers.parseEther(amount);
				const currentAllowance = await tokenContract.allowance(address, CONTRACT_CONFIG.FACTORY_CONTRACT);

				console.log("Current allowance:", currentAllowance.toString());
				console.log("Required sell amount:", sellAmount.toString());

				// 2. If allowance is insufficient, approve first
				if (currentAllowance < sellAmount) {
					console.log("Insufficient allowance, starting approval...");

					// Approve maximum value to avoid frequent approvals
					const maxApproval = ethers.MaxUint256;
					const approveResult = await tokenContract.approve(CONTRACT_CONFIG.FACTORY_CONTRACT, maxApproval);
					console.log("Approval transaction sent:", approveResult.hash);
					await approveResult.wait();
					console.log("Approval transaction confirmed");
				}

				// 3. Call trySell to get expected ETH output
				const ethOut = await readOnlyContract.trySell(tokenAddress, sellAmount);
				console.log("trySell result:", ethOut.toString());

				// 4. Calculate slippage protection
				const minEthOut = (ethOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

				console.log("sellToken parameters:");
				console.log(`MinEthOut (with ${slippagePercentage}% slippage):`, minEthOut.toString());

				// 5. Estimate gas and execute sell transaction
				let gasLimit;
				try {
					const tempInviter = referralInviter || ethers.ZeroAddress;
					const tempSignature = referralSignature || '0x';
					const tempInvite = { inviter: tempInviter };
					const estimatedGas = await contract.sellTokenWithReferral.estimateGas(tokenAddress, sellAmount, minEthOut, tempInvite, tempSignature);
					gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
				} catch (e) {
					console.warn("Gas estimation failed:", e);
				}

				const gasPrice = (await provider.getFeeData()).gasPrice;
				const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

				const txOptions = {} as any;
				if (gasLimit) txOptions.gasLimit = gasLimit;
				if (newGasPrice) txOptions.gasPrice = newGasPrice;

				let sellResult;
				const referral = consumeReferralCode();

				let inviterAddress = ethers.ZeroAddress;
				let finalSignature = '0x';

				if (referral) {
					inviterAddress = referral.inviter;
					finalSignature = referral.signature;
					console.log("Using referral inviter:", inviterAddress);
				}

				const invite = { inviter: inviterAddress };
				console.log("sellTokenWithReferral params:", {
					tokenAddress,
					sellAmount: sellAmount.toString(),
					minEthOut: minEthOut.toString(),
					invite,
					signature: finalSignature,
					txOptions
				});
				sellResult = await contract.sellTokenWithReferral(tokenAddress, sellAmount, minEthOut, invite, finalSignature, txOptions);
				console.log("sellTokenWithReferral transaction sent:", sellResult.hash, "inviter:", inviterAddress);

				toast.success(t('messages.transactionSubmitted'), {
					description: `${t('messages.transactionHash')}: ${sellResult.hash.slice(0, 10)}...${sellResult.hash.slice(-6)}`
				});

				// Asynchronously wait for transaction confirmation in background (don't block execution)
				sellResult.wait().then((receipt: any) => {
					console.log("sellToken transaction confirmed:", receipt, outputAmount);
				}).catch((error: any) => {
					console.error("Sell transaction confirmation failed:", error);
				});


				// Clear input
				setInputAmount('');
				setSelectedAmount(null);

				// Refresh balance and token list
				queryClient.invalidateQueries({ queryKey: ['balance'] });
				queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
				queryClient.invalidateQueries({ queryKey: ['coinList'] });
			}
		} catch (error: any) {
			console.error('Transaction failed:', error);

			// More detailed error handling
			let errorMessage = t('messages.transactionFailedRetry');
			if (error.code === 'ACTION_REJECTED') {
				errorMessage = t('messages.userRejectedTransaction');
			} else if (error.code === 'INSUFFICIENT_FUNDS') {
				errorMessage = t('messages.insufficientBalance');
			} else if (error.message?.includes('slippage')) {
				errorMessage = t('messages.slippageTooHigh');
			} else if (error.message?.includes('deadline')) {
				errorMessage = t('messages.transactionTimeout');
			} else if (error.message) {
				errorMessage = t('messages.transactionTimeout');
			}

			setError(errorMessage);
			toast.error(t('messages.transactionFailedGeneric'), {
				description: errorMessage
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full">
			<div className="w-full">
				<div className="h-[40px] bg-[#333] rounded-[16px] flex mb-[16px]">
					<div
						className={`flex-1 border-[3px] border-[#333] rounded-[16px] text-[14px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'buy'
							? 'bg-[#9AED2D] text-[#000]'
							: 'bg-[#333] text-[#AAAAAA] hover:bg-[#444]'
							}`}
						onClick={() => handleTabClick('buy')}
					>
						{t('trade.buy')}
					</div>
					<div
						className={`flex-1 border-[3px] border-[#333] rounded-[16px] text-[14px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'sell'
							? 'bg-[#FF4C4C] text-[#fff]'
							: 'bg-[#333] text-[#AAAAAA] hover:bg-[#444]'
							}`}
						onClick={() => handleTabClick('sell')}
					>
						{t('trade.sell')}
					</div>
				</div>
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "text-[17px] text-[#fff] placeholder:text-[#666] uppercase tracking-[-0.07px]",
					}}
					name="amount"
					placeholder="0"
					variant="bordered"
					value={inputAmount}
					onChange={(e) => {
						setInputAmount(e.target.value);
						setSelectedAmount(null);
					}}
					endContent={<div className="shrink-0 h-[32px] rounded-[20px] bg-[#333] flex items-center px-[4px] pr-[6px] gap-[4px]">
						{
							isBuy ? <MyAvatar src={'/images/pop.png'} alt="icon" className="w-[24px] h-[24px] rounded-[16px]" /> :
								<MyAvatar src={metadata?.image || '/images/default.png'} alt="icon" className="w-[24px] h-[24px] rounded-[16px]" />
						}
						<div className="text-[15px] text-[#fff]">{isBuy ? 'POP' : metadata?.symbol?.toUpperCase() || '--'}</div>
					</div>}
				/>
				<div className="flex gap-[8px] mt-[12px]">
					{currentAmounts.map((amount) => (
						<div
							key={amount.label}
							className={`h-[28px] flex items-center justify-center cursor-pointer text-[12px] flex-1 rounded-[12px] transition-colors ${selectedAmount === amount.value
								? 'bg-[#9AED2D] text-[#000] font-medium'
								: 'bg-[#333] text-[#AAAAAA] hover:bg-[#444]'
								}`}
							onClick={() => handleAmountSelect(amount)}
						>
							{amount.label}
						</div>
					))}
				</div>
				<div className="text-[14px] text-[#fff] flex items-center justify-end gap-[3px] mt-[12px]">
					<span className="text-[#AAAAAA]">{t('trade.balance')}:</span>
					{
						isBuy ? <>{formatBigNumber(balance)} POP</> : <>{formatBigNumber(tokenBalance!)} {metadata?.symbol?.toUpperCase() || '--'}</>
					}
					{
						isBuy && <span className="text-[#9AED2D] cursor-pointer hover:text-[#7ED321] transition-colors" onClick={() => {
							if (balance && _bignumber(balance).gt(0)) {
								// 预留一些gas费用，使用95%的余额
								const maxAmount = _bignumber(balance).times(0.95).toFixed(6);
								setInputAmount(maxAmount);
								setSelectedAmount(null);
							}
						}}>{t('trade.max')}</span>
					}
				</div>
				<div className="border-dashed border-[1.5px] border-[#333] rounded-[16px] p-[16px] mt-[16px] text-[14px] text-[#fff] bg-[#1A1A1A]">
					<div className="flex items-center justify-between">
						<span className="text-[#AAAAAA]">{t('trade.total')}</span>
						<div>
							<span className="text-[#fff] mr-[4px] font-medium">{outputAmount || '0.0'}</span>
							<span className="text-[#AAAAAA]">{selectedTab === 'buy' ? metadata?.symbol?.toUpperCase() : 'POP'}</span>
						</div>
					</div>
					<div className="flex items-center justify-between mt-[12px]">
						<span className="text-[#AAAAAA]">{t('trade.slippage')}</span>
						<div className="flex items-center gap-[4px]">
							<span className="text-[#fff] font-medium">{slippage}%</span>
							<SetIcon className="mb-[2px] cursor-pointer hover:text-[#9AED2D] transition-colors" onClick={() => setIsSlippageOpen(true)} />
						</div>
					</div>
				</div>
				<Button
					fullWidth
					className={`h-[52px] text-[16px] text-[#fff] mt-[24px] font-medium rounded-[16px] transition-all duration-200 ${selectedTab === 'buy' ? 'bg-[#9AED2D] hover:bg-[#7ED321] text-[#000]' : 'bg-[#FF4C4C] hover:bg-[#FF3333]'}`}
					onPress={() => { handleClick(info?.address, inputAmount) }}
					isLoading={isLoading}
					isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
				>
					{isLoading ? t('trade.processing') : (selectedTab === 'buy' ? t('trade.buy') : t('trade.sell'))}
				</Button>
			</div>
			<Slippage isOpen={isSlippageOpen} onClose={() => setIsSlippageOpen(false)} />
		</div>
	)
}