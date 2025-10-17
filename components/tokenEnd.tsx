import { useState, useEffect } from "react";
import { Image, Button } from "@heroui/react"
import MyAvatar from "@/components/avatarImage";
import { CopyIcon, GoldIcon, ShareIcon } from "./icons";
import Share from "./share";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import { formatBigNumber } from "@/utils/formatBigNumber";
import Auth from "./auth";

interface TokenProps {
	info?: any;
}

export const TokenEnd = ({ info }: TokenProps) => {
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const { copy } = useClipboard();

	// 格式化价格变化显示
	const formatPriceChange = (change: number | undefined) => {
		if (change === undefined || change === null) {
			return { text: '--', color: 'text-[#94989F]' };
		}

		if (change > 0) {
			return { text: `+${change.toFixed(2)}%`, color: 'text-[#00D935]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#FF4C4C]' };
		} else {
			return { text: '0.00%', color: 'text-[#94989F]' };
		}
	};

	const priceChangeDisplay = formatPriceChange(info?.price_change_24h_f);

	return (
		<div className="flex-1 w-full px-[16px] md:px-[0px] flex flex-col items-center pt-[8px] relative">
			<div className="flex flex-col items-center w-full md:gap-[12px]">
				<MyAvatar src={info?.image_url || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
				<div className="md:flex md:flex-col md:gap-[2px]">
					<div className="text-[#101010] mt-[16px] md:mt-[0px] text-[20px] font-bold flex items-center justify-center gap-[4px] md:justify-start">{info?.symbol?.toUpperCase() || '--'} <GoldIcon className="cursor-pointer" onClick={() => setIsAuthOpen(true)} /></div>
					<div className="text-[#95989F] mt-[2px] md:mt-[0px] text-[13px] text-center">{info?.name || '--'}</div>
				</div>
			</div>
			<div className="w-full flex items-center justify-center gap-[4px] mt-[12px]">
				<div className="border-[1px] border-[rgba(255,233,0,0.35)] bg-[rgba(255,233,0,0.15)] rounded-[12px] h-[28px] text-[12px] px-[8px] text-[#24232A] flex items-center gap-[4px]">
					{shortenAddress(info?.mint || '')}
					<CopyIcon className="cursor-pointer" onClick={() => copy(info?.mint || '')} />
				</div>
				{
					info?.metadata?.x && <div
						onClick={() => { window.open(info?.metadata?.x, "_blank"); }}
						className="border-[1px] border-[rgba(255,233,0,0.35)] bg-[rgba(255,233,0,0.15)] rounded-[12px] h-[28px] px-[8px] flex items-center cursor-pointer">
						<Image src="/images/x.png" alt="x" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				{
					info?.metadata?.telegram && <div
						onClick={() => { window.open(info?.metadata?.telegram, "_blank"); }}
						className="border-[1px] border-[rgba(255,233,0,0.35)] bg-[rgba(255,233,0,0.15)] rounded-[12px] h-[28px] px-[8px] flex items-center cursor-pointer">
						<Image src="/images/tg.png" alt="tg" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				{
					info?.metadata?.website && <div
						onClick={() => { window.open(info?.metadata?.website, "_blank"); }}
						className="border-[1px] border-[rgba(255,233,0,0.35)] bg-[rgba(255,233,0,0.15)] rounded-[12px] h-[28px] px-[8px] flex items-center cursor-pointer">
						<Image src="/images/web.png" alt="web" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				<div className="border-[1px] border-[rgba(255,233,0,0.35)] bg-[rgba(255,233,0,0.15)] rounded-[12px] h-[28px] px-[8px] md:flex items-center cursor-pointer hidden" onClick={() => setIsShareOpen(true)}>
					<ShareIcon className="w-[16px]" />
				</div>
			</div>
			<div className="text-[13px] text-[#94989F] text-center mt-[16px] md:max-w-[600px]">{info?.description}</div>
			<div className="flex flex-col md:flex-row items-center gap-[12px] mt-[16px] w-full">
				<div className="flex items-center gap-[12px] w-full">
					<div className="w-full py-[12px] px-[16px] border-[#F5F6F9] border-[2px] rounded-[16px]">
						<div className="text-[13px] text-[#717075]">价格</div>
						<div className="text-[20px] text-[#141414] font-semibold">${formatBigNumber(info?.price_usd_f)}</div>
					</div>
					<div className="w-full py-[12px] px-[16px] border-[#F5F6F9] border-[2px] rounded-[16px]">
						<div className="text-[13px] text-[#717075]">市值</div>
						<div className="text-[20px] text-[#141414] font-semibold">${formatBigNumber(info?.price_usd_f * 1e9)}</div>
					</div>
				</div>
				<div className="flex items-center gap-[12px] w-full">
					<div className="w-full py-[12px] px-[16px] border-[#F5F6F9] border-[2px] rounded-[16px]">
						<div className="text-[13px] text-[#717075]">24H 涨跌</div>
						<div className={`text-[20px] font-semibold ${priceChangeDisplay.color}`}>
							{priceChangeDisplay.text}
						</div>
					</div>
					<div className="w-full py-[12px] px-[16px] border-[#F5F6F9] border-[2px] rounded-[16px]">
						<div className="text-[13px] text-[#717075]">持有者</div>
						<div className="text-[20px] text-[#141414] font-semibold">{info?.holder_count || 0}</div>
					</div>
				</div>
			</div>
			<div className="w-full mt-[16px] md:mt-[24px] flex flex-col md:grid md:grid-cols-2 gap-[12px]">
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#FFB218] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://web3.binance.com/zh-CN/token/bsc/${info?.mint}`, "_blank"); }}
				>
					<Image src="/images/bian.png" alt="Binance" width={16} height={16} disableSkeleton radius='none' />Binance Wallet
				</Button>
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#24232A] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://web3.okx.com/zh-hant/token/bsc/${info?.mint}`, "_blank"); }}
				>
					<Image src="/images/okx.png" alt="OKX" width={16} height={16} disableSkeleton radius='none' />OKX Wallet
				</Button>
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#64CB83] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://gmgn.ai/bsc/token/${info?.mint}`, "_blank"); }}
				>
					<Image src="/images/gmgn.png" alt="GMGN" width={16} height={16} disableSkeleton radius='none' />GMGN
				</Button>
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#3AC9D2] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://pancakeswap.finance/swap?outputCurrency=${info?.mint}&inputCurrency=BNB`, "_blank"); }}
				>
					<Image src="/images/pancake.png" alt="Pancake" width={16} height={16} disableSkeleton radius='none' />Pancake Swap
				</Button>
			</div>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={info} />
			<Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} info={info} />
		</div>
	)
}