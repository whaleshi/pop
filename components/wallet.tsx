import { formatBigNumber } from "@/utils/formatBigNumber";
import { CopyIcon, LogoutIcon } from "./icons"
import { useBalanceContext } from "@/providers/balanceProvider";
import { useAccount, useDisconnect } from 'wagmi';
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import router from "next/router";
import { useTranslation } from "react-i18next";


export const WalletBox = () => {
	const { t } = useTranslation('common');
	const { balance, symbol } = useBalanceContext();
	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { copy } = useClipboard({
		successMessage: t('messages.copySuccessful'),
		errorMessage: t('messages.copyFailed')
	});

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

	// Generate invite code (based on last 6 characters of address)
	const generateInviteCode = () => {
		if (!address) return "000000";
		return address.slice(-6).toUpperCase();
	};

	const inviteCode = generateInviteCode();
	const inviteLink = `popme.fun/${inviteCode}`;

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
					<div className="text-[16px] text-[#fff] mt-[6px] flex items-center justify-between">
						<span>--</span>
						{/* <CopyIcon className="cursor-pointer hover:text-[#9AED2D] transition-colors ml-[8px]" onClick={() => copy(inviteLink)} /> */}
					</div>
				</div>
			</div>
		</div>
	)
}