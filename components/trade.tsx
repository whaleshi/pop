import { Button, Input } from "@heroui/react"
import React, { useEffect, useState } from "react";
import MyAvatar from "@/components/avatarImage";
import { SetIcon } from "./icons";
import Slippage from "./slippage";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from 'sonner';
import FactoryABI from "@/constant/TokenManager.abi.json";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { formatBigNumber } from "@/utils/formatBigNumber";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
import { useSlippageStore } from "@/stores/slippage";

type TradeType = 'buy' | 'sell';

interface TokenProps {
	info?: any;
	tokenBalance?: string;
	initialTab?: 'buy' | 'sell';
}

export const Trade = ({ info, tokenBalance, initialTab = 'buy' }: TokenProps) => {
	const [isBuy, setIsBuy] = useState(initialTab === 'buy');
	const [selectedTab, setSelectedTab] = useState<TradeType>(initialTab);
	const [isSlippageOpen, setIsSlippageOpen] = useState(false);
	const [inputAmount, setInputAmount] = useState('');
	const [outputAmount, setOutputAmount] = useState("");
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { balance } = useBalanceContext();
	const { slippage } = useSlippageStore();
	const queryClient = useQueryClient();

	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;

	const handleTabClick = (tab: TradeType) => {
		setSelectedTab(tab);
		setIsBuy(tab === 'buy');
		setInputAmount('');
		setSelectedAmount(null);
		setError(null);
	};

	// 验证输入
	const validateInput = (): string | null => {
		if (!isConnected) {
			return '请先连接钱包';
		}

		if (!inputAmount || inputAmount.trim() === '') {
			return '请输入交易金额';
		}

		const amount = parseFloat(inputAmount);
		if (isNaN(amount) || amount <= 0) {
			return '请输入有效的数字金额';
		}

		if (selectedTab === 'buy') {
			// 买入验证
			if (!balance || balance === 0) {
				return 'BNB余额不足';
			}

			if (_bignumber(inputAmount).gt(balance)) {
				return `BNB余额不足，当前余额: ${formatBigNumber(balance)} BNB`;
			}

			// 预留gas费用检查
			const gasReserve = 0.001;
			if (_bignumber(inputAmount).plus(gasReserve).gt(balance)) {
				return '请预留足够的BNB作为手续费';
			}
		} else {
			// 卖出验证
			if (!tokenBalance || parseFloat(tokenBalance) === 0) {
				return '代币余额不足';
			}

			if (_bignumber(inputAmount).gt(tokenBalance)) {
				return `代币余额不足，当前余额: ${formatBigNumber(tokenBalance)} ${info?.symbol?.toUpperCase() || 'Token'}`;
			}
		}

		return null;
	};

	const buyAmounts = [
		{ label: "0.1", value: 0.1 },
		{ label: "0.2", value: 0.2 },
		{ label: "0.5", value: 0.5 },
		{ label: "1", value: 1 }
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
					console.log('用户余额:', userBalance.toString());
					// 格式化结果，正确处理小数点后的尾随零
					const formattedAmount = sellAmount.dp(18, _bignumber.ROUND_DOWN).toFixed();
					console.log('计算卖出金额:', formattedAmount);

					// 只有当包含小数点时才去除尾随零，避免删除整数末尾的有意义零
					const finalAmount = formattedAmount.includes('.') ?
						formattedAmount.replace(/\.?0+$/, '') :
						formattedAmount;

					setInputAmount(finalAmount);
				} catch (error) {
					console.error('計算賣出金額失敗:', error);
					setInputAmount('0');
				}
			} else {
				// 如果没有余额，设置为0
				setInputAmount('0');
			}
		}
	};

	const { data: estimatedOutput } = useQuery({
		queryKey: ['estimateOutput', info?.mint, inputAmount, isBuy],
		queryFn: async () => {
			if (!inputAmount || !info?.mint || parseFloat(inputAmount) <= 0) {
				return '0';
			}

			try {
				const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
				const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);

				if (isBuy) {
					// 调用 tryBuy 获取预期代币输出
					const result = await readOnlyContract.tryBuy(info?.mint, ethers.parseEther(inputAmount));
					const tokenAmountOut = result[0];
					return ethers.formatEther(tokenAmountOut);
				} else {
					// 调用 trySell 获取预期ETH输出
					const sellAmount = ethers.parseEther(inputAmount);
					const result = await readOnlyContract.trySell(info?.mint, sellAmount);
					return ethers.formatEther(result);
				}
			} catch (error) {
				console.error('预估输出失败:', error);
				return '0';
			}
		},
		enabled: !!(inputAmount && info?.mint && parseFloat(inputAmount) > 0),
		refetchInterval: 3000, // 每3秒刷新一次
		staleTime: 2000,
		retry: 1,
	});

	useEffect(() => {
		setInputAmount("");
		setOutputAmount("");
	}, [isBuy]);

	// 当initialTab改变时，更新选中的tab
	useEffect(() => {
		if (initialTab) {
			setSelectedTab(initialTab);
			setIsBuy(initialTab === 'buy');
		}
	}, [initialTab]);

	useEffect(() => {
		if (estimatedOutput) {
			// 格式化输出，去除多余的小数位
			const formatted = formatBigNumber(estimatedOutput);
			setOutputAmount(formatted);
		} else {
			setOutputAmount("");
		}
	}, [estimatedOutput]);

	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

	// 初始化 provider 和 signer
	useEffect(() => {
		const initializeProvider = async () => {
			if (wallet) {
				try {
					const ethereumProvider = await wallet.getEthereumProvider();
					const ethersProvider = new ethers.BrowserProvider(ethereumProvider);
					const ethersSigner = await ethersProvider.getSigner();

					setProvider(ethersProvider);
					setSigner(ethersSigner);
				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && wallet) {
			initializeProvider();
		}
	}, [wallet, isConnected]);

	const handleClick = async (tokenAddress: string, amount: string) => {
		// 验证输入
		const validationError = validateInput();
		if (validationError) {
			toast.error(validationError);
			return;
		}

		if (!signer || !provider) {
			toast.error("钱包未连接");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const contract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, signer);
			const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);
			const slippagePercentage = slippage;

			if (selectedTab === 'buy') {
				// 买入逻辑
				console.log("Calling tryBuy with parameters:");
				console.log("Token address:", tokenAddress);
				console.log("Amount:", ethers.parseEther(amount));

				// 1. 调用 tryBuy 获取预期输出
				const result = await readOnlyContract.tryBuy(tokenAddress, ethers.parseEther(amount));
				console.log("tryBuy 返回值:", result);

				// 2. 计算滑点保护
				const tokenAmountOut = result[0];
				const minAmountOut = (tokenAmountOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

				console.log("调用 buyToken 参数:");
				console.log(`MinAmountOut (with ${slippagePercentage}% slippage):`, minAmountOut.toString());

				// 3. 估算 gas 和执行买入交易
				let gasLimit;
				try {
					const estimatedGas = await contract.buyToken.estimateGas(tokenAddress, ethers.parseEther(amount), minAmountOut, {
						value: ethers.parseEther(amount),
					});
					gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
				} catch (e) {
					console.warn("Gas 估算失败:", e);
				}

				const gasPrice = (await provider.getFeeData()).gasPrice;
				const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

				const txOptions = {
					value: ethers.parseEther(amount),
				} as any;

				if (gasLimit) txOptions.gasLimit = gasLimit;
				if (newGasPrice) txOptions.gasPrice = newGasPrice;

				const buyResult = await contract.buyToken(tokenAddress, ethers.parseEther(amount), minAmountOut, txOptions);
				console.log("buyToken 交易已发送:", buyResult.hash);

				toast.success('交易已提交', {
					description: `交易哈希: ${buyResult.hash.slice(0, 10)}...${buyResult.hash.slice(-6)}`
				});

				const receipt = await buyResult.wait();
				console.log("buyToken 交易已确认:", receipt, outputAmount);

				// 交易成功处理
				toast.success('买入成功！', {
					description: `成功买入 ${outputAmount} ${info?.symbol?.toUpperCase()}`
				});

				// 清空输入
				setInputAmount('');
				setSelectedAmount(null);

				// 刷新余额和代币列表
				queryClient.invalidateQueries({ queryKey: ['balance'] });
				queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
				queryClient.invalidateQueries({ queryKey: ['coinList'] });

			} else {
				// 卖出逻辑
				console.log("Calling trySell with parameters:");
				console.log("Token address:", tokenAddress);
				console.log("Token amount:", ethers.parseEther(amount));

				// ERC20 ABI for approval
				const erc20Abi = [
					"function allowance(address owner, address spender) view returns (uint256)",
					"function approve(address spender, uint256 amount) returns (bool)"
				];

				// 1. 检查授权额度
				const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
				const sellAmount = ethers.parseEther(amount);
				const currentAllowance = await tokenContract.allowance(address, CONTRACT_CONFIG.FACTORY_CONTRACT);

				console.log("当前授权额度:", currentAllowance.toString());
				console.log("需要卖出数量:", sellAmount.toString());

				// 2. 如果授权不足，先进行授权
				if (currentAllowance < sellAmount) {
					console.log("授权不足，开始授权...");

					// 授权最大值以避免频繁授权
					const maxApproval = ethers.MaxUint256;
					const approveResult = await tokenContract.approve(CONTRACT_CONFIG.FACTORY_CONTRACT, maxApproval);
					console.log("授权交易已发送:", approveResult.hash);
					await approveResult.wait();
					console.log("授权交易已确认");
				}

				// 3. 调用 trySell 获取预期ETH输出
				const ethOut = await readOnlyContract.trySell(tokenAddress, sellAmount);
				console.log("trySell 返回值:", ethOut.toString());

				// 4. 计算滑点保护
				const minEthOut = (ethOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

				console.log("调用 sellToken 参数:");
				console.log(`MinEthOut (with ${slippagePercentage}% slippage):`, minEthOut.toString());

				// 5. 估算 gas 和执行卖出交易
				let gasLimit;
				try {
					const estimatedGas = await contract.sellToken.estimateGas(tokenAddress, sellAmount, minEthOut);
					gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
				} catch (e) {
					console.warn("Gas 估算失败:", e);
				}

				const gasPrice = (await provider.getFeeData()).gasPrice;
				const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

				const txOptions = {} as any;
				if (gasLimit) txOptions.gasLimit = gasLimit;
				if (newGasPrice) txOptions.gasPrice = newGasPrice;

				const sellResult = await contract.sellToken(tokenAddress, sellAmount, minEthOut, txOptions);
				console.log("sellToken 交易已发送:", sellResult.hash);

				toast.success('交易已提交', {
					description: `交易哈希: ${sellResult.hash.slice(0, 10)}...${sellResult.hash.slice(-6)}`
				});

				const receipt = await sellResult.wait();
				console.log("sellToken 交易已确认:", receipt, outputAmount);

				// 交易成功处理
				toast.success('卖出成功！', {
					description: `成功卖出 ${formatBigNumber(amount)} ${info?.symbol?.toUpperCase()}，获得 ${outputAmount} BNB`
				});

				// 清空输入
				setInputAmount('');
				setSelectedAmount(null);

				// 刷新余额和代币列表
				queryClient.invalidateQueries({ queryKey: ['balance'] });
				queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
				queryClient.invalidateQueries({ queryKey: ['coinList'] });
			}
		} catch (error: any) {
			console.error('交易失败:', error);

			// 更详细的错误处理
			let errorMessage = '交易失败，请重试';
			if (error.code === 'ACTION_REJECTED') {
				errorMessage = '用户拒绝了交易';
			} else if (error.code === 'INSUFFICIENT_FUNDS') {
				errorMessage = '余额不足';
			} else if (error.message?.includes('slippage')) {
				errorMessage = '滑点过大，请调整滑点设置';
			} else if (error.message?.includes('deadline')) {
				errorMessage = '交易超时，请重试';
			} else if (error.message) {
				errorMessage = '交易超时，请重试';
			}

			setError(errorMessage);
			toast.error('交易失败', {
				description: errorMessage
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full">
			<div className="w-full">
				<div className="h-[40px] bg-[#EBEBEF] rounded-[16px] flex mb-[16px]">
					<div
						className={`flex-1 border-[3px] border-[#EBEBEF] rounded-[16px] text-[14px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'buy'
							? 'bg-[#24232A] text-[#fff]'
							: 'bg-[#EBEBEF] text-[#94989F] hover:bg-[#E0E0E0]'
							}`}
						onClick={() => handleTabClick('buy')}
					>
						买入
					</div>
					<div
						className={`flex-1 border-[3px] border-[#EBEBEF] rounded-[16px] text-[14px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'sell'
							? 'bg-[#24232A] text-[#fff]'
							: 'bg-[#EBEBEF] text-[#94989F] hover:bg-[#E0E0E0]'
							}`}
						onClick={() => handleTabClick('sell')}
					>
						卖出
					</div>
				</div>
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#F5F6F9] bg-[#F5F6F9] border-1",
						input: "text-[17px] text-[#24232A] placeholder:text-[#94989F] uppercase tracking-[-0.07px]",
					}}
					name="amount"
					placeholder="0"
					variant="bordered"
					value={inputAmount}
					onChange={(e) => {
						setInputAmount(e.target.value);
						setSelectedAmount(null);
					}}
					endContent={<div className="shrink-0 h-[32px] rounded-[20px] bg-[#FFF] flex items-center px-[4px] pr-[6px] gap-[4px]">
						{
							isBuy ? <MyAvatar src={'/images/bnb.png'} alt="icon" className="w-[24px] h-[24px] rounded-[16px]" /> :
								<MyAvatar src={info?.image_url || '/images/default.png'} alt="icon" className="w-[24px] h-[24px] rounded-[16px]" />
						}
						<div className="text-[15px] text-[#24232A]">{isBuy ? 'BNB' : info?.symbol?.toUpperCase() || '--'}</div>
					</div>}
				/>
				<div className="flex gap-[8px] mt-[12px]">
					{currentAmounts.map((amount) => (
						<div
							key={amount.label}
							className={`h-[24px] flex items-center justify-center cursor-pointer text-[12px] flex-1 rounded-[16px] transition-colors ${selectedAmount === amount.value
								? 'bg-[#24232A] text-[#fff]'
								: 'bg-[#EBEBEF] text-[#24232A] hover:bg-[#E0E0E0]'
								}`}
							onClick={() => handleAmountSelect(amount)}
						>
							{amount.label}
						</div>
					))}
				</div>
				<div className="text-[14px] text-[#24232A] flex items-center justify-end gap-[3px] mt-[12px]">
					<span className="text-[#94989F]">余额:</span>
					{
						isBuy ? <>{formatBigNumber(balance)} BNB</> : <>{formatBigNumber(tokenBalance!)} {info?.symbol?.toUpperCase() || '--'}</>
					}
					{
						isBuy && <span className="text-[#FFA600] cursor-pointer" onClick={() => {
							if (balance && _bignumber(balance).gt(0)) {
								// 预留一些gas费用，使用95%的余额
								const maxAmount = _bignumber(balance).times(0.95).toFixed(6);
								setInputAmount(maxAmount);
								setSelectedAmount(null);
							}
						}}>Max</span>
					}
				</div>
				<div className="border-dashed border-[1.5px] border-[#EBEBEF] rounded-[16px] p-[16px] mt-[16px] text-[14px] text-[#24232A]">
					<div className="flex items-center justify-between">
						预计收到
						<div>
							<span className="text-[#94989F] mr-[4px]">{outputAmount || '0.0'}</span>
							{selectedTab === 'buy' ? info?.symbol?.toUpperCase() : 'BNB'}
						</div>
					</div>
					<div className="flex items-center justify-between mt-[12px]">
						滑点
						<div className="flex items-center gap-[4px]">
							{slippage}%
							<SetIcon className="mb-[2px] cursor-pointer" onClick={() => setIsSlippageOpen(true)} />
						</div>
					</div>
				</div>
				<Button
					fullWidth
					className={`h-[48px] text-[15px] text-[#fff] mt-[24px] ${selectedTab === 'buy' ? 'bg-[#00D935]' : 'bg-[#FF4C4C]'}`}
					onPress={() => { handleClick(info?.mint, inputAmount) }}
					isLoading={isLoading}
					isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
				>
					{isLoading ? '处理中...' : (selectedTab === 'buy' ? '买入' : '卖出')}
				</Button>
			</div>
			<Slippage isOpen={isSlippageOpen} onClose={() => setIsSlippageOpen(false)} />
		</div>
	)
}