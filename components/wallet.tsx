import { formatBigNumber } from "@/utils/formatBigNumber";
import { CopyIcon, LogoutIcon } from "./icons"
import { useBalanceContext } from "@/providers/balanceProvider";
import { useAccount, useDisconnect } from 'wagmi';
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import router from "next/router";


export const WalletBox = () => {
	const { balance, symbol } = useBalanceContext();
	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { copy } = useClipboard();

	const toLogout = async () => {
		try {
			// 断开钱包连接
			disconnect();
			
			// 延迟一下确保状态更新
			setTimeout(() => {
				router.replace('/');
			}, 100);
		} catch (error) {
			console.error('Logout error:', error);
			// 即使出错也要跳转到首页
			router.replace('/');
		}
	}

	return (
		<div className="w-full relative border-[1.5px] border-[#333] rounded-[16px] bg-[#1A1A1A] overflow-hidden">
			<div className="w-full p-[16px]">
				<div className="text-[13px] text-[#AAAAAA]">余额</div>
				<div className="text-[24px] text-[#fff] mt-[6px]">{formatBigNumber(balance)} {symbol}</div>
			</div>
			<div className="h-[44px] flex items-center justify-between px-[16px] border-t border-[#333]">
				<div className="text-[13px] text-[#AAAAAA] flex items-center gap-[4px]">
					钱包地址
					<span className="text-[#fff]">{shortenAddress(address!)}</span>
					<CopyIcon className="cursor-pointer block md:hidden hover:text-[#fff] transition-colors" onClick={() => copy(address!)} />
				</div>
				<LogoutIcon className="cursor-pointer block md:hidden hover:text-[#fff] transition-colors" onClick={() => { toLogout() }} />
				<CopyIcon className="cursor-pointer hidden md:block hover:text-[#fff] transition-colors" onClick={() => copy(address!)} />
			</div>
		</div>
	)
}