import { formatBigNumber } from "@/utils/formatBigNumber";
import { CopyIcon, LogoutIcon } from "./icons"
import { useBalanceContext } from "@/providers/balanceProvider";
import { useAuthStore } from "@/stores/auth";
import { usePrivy } from "@privy-io/react-auth";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import router from "next/router";


export const WalletBox = () => {
	const { balance, symbol } = useBalanceContext();
	const { logout } = usePrivy();
	const { address, clearAuthState } = useAuthStore();
	const { copy } = useClipboard();

	const toLogout = async () => {
		clearAuthState();
		try { await logout(); } catch { }
		router.replace('/');
	}

	return (
		<div className="w-full relative border-[1.5px] border-[#F5F6F9] rounded-[16px]">
			<div className="w-full p-[16px] bg-[#24232A] rounded-[16px]">
				<div className="text-[13px] text-[#717075]">余额</div>
				<div className="text-[24px] text-[#fff] mt-[6px]">{formatBigNumber(balance)} {symbol}</div>
			</div>
			<div className="h-[44px] flex items-center justify-between px-[16px]">
				<div className="text-[13px] text-[#94989F] flex items-center gap-[4px]">
					钱包地址
					<span className="text-[#24232A]">{shortenAddress(address!)}</span>
					<CopyIcon className="cursor-pointer block md:hidden" onClick={() => copy(address!)} />
				</div>
				<LogoutIcon className="cursor-pointer block md:hidden" onClick={() => { toLogout() }} />
				<CopyIcon className="cursor-pointer hidden md:block" onClick={() => copy(address!)} />
			</div>
		</div>
	)
}