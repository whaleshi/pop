import { formatBigNumber } from "@/utils/formatBigNumber";
import { CopyIcon, LogoutIcon } from "./icons"
import { useBalanceContext } from "@/providers/balanceProvider";
import { useAccount, useDisconnect, useReadContracts, usePublicClient } from 'wagmi';
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import router from "next/router";
import { useTranslation } from "react-i18next";
import { useWalletClient } from 'wagmi';
import { CONTRACT_CONFIG, DEFAULT_CHAIN_ID } from "@/config/chains";
import { useState, useEffect } from 'react';
import ReferralABI from '@/constant/Referral.abi.json';
import { formatUnits } from 'viem';
import { ethers } from 'ethers';
import { toast } from 'sonner';


export const WalletBox = () => {
	const { t } = useTranslation('common');
	const { balance, symbol } = useBalanceContext();
	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const [isSigningInvite, setIsSigningInvite] = useState(false);
	const [inviteLink, setInviteLink] = useState<string>('');
	const [isClaiming, setIsClaiming] = useState(false);
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
	const { copy } = useClipboard({
		successMessage: t('messages.copySuccessful'),
		errorMessage: t('messages.copyFailed')
	});

	const { data: referralData, refetch: refetchReferralData } = useReadContracts({
		contracts: [
			{
				address: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
				abi: ReferralABI,
				functionName: 'directReferralCount',
				args: [address],
				chainId: DEFAULT_CHAIN_ID,
			},
			{
				address: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
				abi: ReferralABI,
				functionName: 'indirectReferralCount',
				args: [address],
				chainId: DEFAULT_CHAIN_ID,
			},
			{
				address: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
				abi: ReferralABI,
				functionName: 'inviterDirectVolume',
				args: [address],
				chainId: DEFAULT_CHAIN_ID,
			},
			{
				address: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
				abi: ReferralABI,
				functionName: 'inviterIndirectVolume',
				args: [address],
				chainId: DEFAULT_CHAIN_ID,
			},
			{
				address: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
				abi: ReferralABI,
				functionName: 'getCommissionRecord',
				args: [address],
				chainId: DEFAULT_CHAIN_ID,
			},
		],
		query: {
			enabled: !!address && !!CONTRACT_CONFIG.REFERRAL_CONTRACT,
			refetchInterval: 10000, // Refetch every 10 seconds
		},
	});

	const directReferralCount = referralData?.[0]?.status === 'success' ? Number(referralData[0].result) : 0;
	const indirectReferralCount = referralData?.[1]?.status === 'success' ? Number(referralData[1].result) : 0;
	const directVolume = referralData?.[2]?.status === 'success' ? referralData[2].result as bigint : BigInt(0);
	const indirectVolume = referralData?.[3]?.status === 'success' ? referralData[3].result as bigint : BigInt(0);
	
	const commissionData = referralData?.[4]?.status === 'success' ? referralData[4].result as [bigint, bigint, bigint, bigint] : [BigInt(0), BigInt(0), BigInt(0), BigInt(0)];
	const directCommission = commissionData[0];
	const indirectCommission = commissionData[1];
	const claimedCommission = commissionData[2];
	
	const totalCommission = directCommission + indirectCommission;
	const pendingCommission = totalCommission - claimedCommission;

	const toLogout = async () => {
		try {
			// Disconnect wallet
			disconnect();

			// Delay to ensure state update
			setTimeout(() => {
				router.replace('/');
			}, 100);
		} catch (error) {
			console.error('Logout error:', error);
			// Navigate to home page even if error occurs
			router.replace('/');
		}
	}

	const generateInviteLink = async () => {
		if (!address || !walletClient) {
			console.error('No wallet connected');
			return;
		}

		setIsSigningInvite(true);

		try {
			const domain = {
				name: "InviteSystem",
				version: "1",
				chainId: DEFAULT_CHAIN_ID,
				verifyingContract: CONTRACT_CONFIG.REFERRAL_CONTRACT as `0x${string}`,
			};

			const types = {
				Invite: [
					{ name: "inviter", type: "address" },
				],
			};

			const value = {
				inviter: address,
			};

			const signature = await walletClient.signTypedData({
				domain,
				types,
				primaryType: 'Invite',
				message: value,
			});

			const link = `https://popme.fun/?inviter=${address}&signature=${signature}`;
			setInviteLink(link);
		} catch (error) {
			console.error('Failed to sign invite:', error);
		} finally {
			setIsSigningInvite(false);
		}
	};

	// Initialize provider and signer
	useEffect(() => {
		const initializeProvider = async () => {
			if (walletClient && publicClient) {
				try {
					const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
					const ethersSigner = await ethersProvider.getSigner();
					setProvider(ethersProvider);
					setSigner(ethersSigner);
				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (address && walletClient) {
			initializeProvider();
		}
	}, [walletClient, publicClient, address]);

	const handleClaimCommission = async () => {
		if (!signer || !provider || !address) {
			toast.error(t('trade.walletNotConnected'));
			return;
		}

		if (!pendingCommission || pendingCommission === BigInt(0)) {
			toast.error(t('wallet.noPendingCommission') || 'No commission to claim');
			return;
		}

		setIsClaiming(true);
		try {
			const contract = new ethers.Contract(CONTRACT_CONFIG.REFERRAL_CONTRACT, ReferralABI, signer);

			// Estimate gas
			let gasLimit;
			try {
				const estimatedGas = await contract.claimCommission.estimateGas();
				gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
			} catch (e) {
				console.warn("Gas estimation failed:", e);
			}

			// Get gas price
			const gasPrice = (await provider.getFeeData()).gasPrice;
			const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

			const txOptions = {} as any;
			if (gasLimit) txOptions.gasLimit = gasLimit;
			if (newGasPrice) txOptions.gasPrice = newGasPrice;

			console.log("claimCommission params:", { txOptions });

			const claimResult = await contract.claimCommission(txOptions);
			console.log("claimCommission transaction sent:", claimResult.hash);

			toast.success(t('messages.transactionSubmitted'), {
				description: `${t('messages.transactionHash')}: ${claimResult.hash.slice(0, 10)}...${claimResult.hash.slice(-6)}`
			});

			// Wait for confirmation
			claimResult.wait().then((receipt: any) => {
				console.log("claimCommission transaction confirmed:", receipt);
				toast.success(t('wallet.claimSuccess'));
				// Refetch referral data to update UI
				if (refetchReferralData) {
					refetchReferralData();
				}
			}).catch((error: any) => {
				console.error("Claim transaction confirmation failed:", error);
			});

		} catch (error: any) {
			console.error('Claim commission failed:', error);

			let errorMessage = t('wallet.claimFailed');
			if (error.code === 'ACTION_REJECTED') {
				errorMessage = t('messages.userRejectedTransaction');
			} else if (error.code === 'INSUFFICIENT_FUNDS') {
				errorMessage = t('messages.insufficientBalance');
			} else if (error.message?.includes('no commission to claim')) {
				errorMessage = t('wallet.noPendingCommission');
			}

			toast.error(errorMessage);
		} finally {
			setIsClaiming(false);
		}
	};

	return (
		<div className="w-full flex flex-col gap-[16px]">
			{/* Balance module */}
			<div className="w-full relative border-[1.5px] border-[#333] rounded-[16px] bg-[#1A1A1A] overflow-hidden">
				<div className="w-full p-[16px]">
					<div className="text-[13px] text-[#AAAAAA] flex items-center gap-[8px]">
						<span className="text-[#9AED2D]">💰</span>
						{t('wallet.balance')}
					</div>
					<div className="text-[24px] text-[#fff] mt-[6px]">{formatBigNumber(balance)} {symbol}</div>
				</div>
				<div className="h-[44px] flex items-center justify-between px-[16px] border-t border-[#333]">
					<div className="text-[13px] text-[#AAAAAA] flex items-center gap-[4px]">
						{t('wallet.address')}
						<span className="text-[#fff]">{shortenAddress(address!)}</span>
						<CopyIcon className="cursor-pointer block md:hidden hover:text-[#fff] transition-colors" onClick={() => copy(address!)} />
					</div>
					<LogoutIcon className="cursor-pointer block md:hidden hover:text-[#fff] transition-colors" onClick={() => { toLogout() }} />
					<CopyIcon className="cursor-pointer hidden md:block hover:text-[#fff] transition-colors" onClick={() => copy(address!)} />
				</div>
			</div>

			{/* Invite code module */}
			<div className="w-full relative border-[1.5px] border-[#333] rounded-[16px] bg-[#1A1A1A] overflow-hidden">
				<div className="w-full p-[16px]">
					<div className="text-[13px] text-[#AAAAAA] flex items-center gap-[8px]">
						<span className="text-[#9AED2D]">🔗</span>
						{t('wallet.code')}
					</div>
					{!inviteLink ? (
						<button
							onClick={generateInviteLink}
							disabled={isSigningInvite}
							className="mt-[6px] px-[16px] py-[8px] bg-[#9AED2D] text-[#000] rounded-[8px] text-[14px] font-medium hover:bg-[#8BD91A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSigningInvite ? t('wallet.signing') || 'Signing...' : t('wallet.generateInvite') || 'Generate Invite Link'}
						</button>
					) : (
						<div className="text-[14px] text-[#fff] mt-[6px] flex items-center justify-between gap-[8px]">
							<span className="flex-1 truncate">{inviteLink}</span>
							<CopyIcon
								className="cursor-pointer hover:text-[#9AED2D] transition-colors flex-shrink-0"
								onClick={() => copy(inviteLink)}
							/>
						</div>
					)}
				</div>

				{/* Referral Statistics */}
				<div className="w-full border-t border-[#333] p-[16px]">
					<div className="text-[13px] text-[#AAAAAA] mb-[16px]">{t('wallet.referralData')}</div>

					<div className="grid grid-cols-2 gap-[16px] mb-[16px]">
						<div>
							<div className="text-[20px] text-[#fff]">{directReferralCount}</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{t('wallet.level1Invites')}</div>
						</div>
						<div>
							<div className="text-[20px] text-[#fff]">{indirectReferralCount}</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{t('wallet.level2Invites')}</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-[16px] mb-[16px]">
						<div>
							<div className="text-[20px] text-[#fff] font-medium">{formatBigNumber(formatUnits(directVolume, 18))} POP</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{t('wallet.level1Volume')}</div>
						</div>
						<div>
							<div className="text-[20px] text-[#fff] font-medium">{formatBigNumber(formatUnits(indirectVolume, 18))} POP</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{t('wallet.level2Volume')}</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-[16px]">
						<div>
							<div className="text-[20px] text-[#fff] font-medium">{formatBigNumber(formatUnits(totalCommission, 18))} POP</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{t('wallet.accumulatedRewards')}</div>
						</div>
						<div>
							<div className="text-[20px] text-[#fff] font-medium">{formatBigNumber(formatUnits(pendingCommission, 18))} POP</div>
							<div className="text-[13px] text-[#AAAAAA] mt-[4px]">
								{t('wallet.claimableRewards')} <span 
									className={`cursor-pointer transition-colors ${
										isClaiming || !pendingCommission || pendingCommission === BigInt(0) 
											? 'text-[#666] cursor-not-allowed' 
											: 'text-[#9AED2D] hover:text-[#8BD91A]'
									}`}
									onClick={() => {
										if (!isClaiming && pendingCommission && pendingCommission > BigInt(0)) {
											handleClaimCommission();
										}
									}}
								>
									{isClaiming ? (t('wallet.claiming') || 'Claiming...') : (t('wallet.claim') || 'Claim')}
								</span>
							</div>
						</div>
					</div>

					<div className="mt-[16px] pt-[16px] border-t border-[#333] text-[12px] text-[#AAAAAA]">
						{t('wallet.referralNote')} <span className="text-[#9AED2D]">10%</span> {t('wallet.tradingFee')} {t('wallet.level2Note')} <span className="text-[#9AED2D]">5%</span> {t('wallet.tradingFee')}
					</div>
				</div>
			</div>
		</div>
	)
}
