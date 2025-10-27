import { useState, useEffect } from "react";
import { Image } from "@heroui/react"
import MyAvatar from "@/components/avatarImage";
import { CopyIcon, GoldIcon, ShareIcon } from "./icons";
import Share from "./share";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import { formatBigNumber } from "@/utils/formatBigNumber";

interface TokenProps {
	info?: any;
}

export const TokenAbout = ({ info }: TokenProps) => {
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const { copy } = useClipboard();

	// 格式化价格变化显示
	const formatPriceChange = (change: number | undefined) => {
		if (change === undefined || change === null) {
			return { text: '--', color: 'text-[#fff]' };
		}

		if (change > 0) {
			return { text: `+${change.toFixed(2)}%`, color: 'text-[#00D935]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#FF4C4C]' };
		} else {
			return { text: '0.00%', color: 'text-[#fff]' };
		}
	};

	const priceChangeDisplay = formatPriceChange(info?.price_change_24h_f);

	// 计算市值进度条百分比
	const getMarketCapProgress = () => {
		const marketCap = info?.price_usd_f * 1e9;
		if (!marketCap) return 0;

		// 假设目标市值为1亿美元
		const targetMarketCap = 100000000;
		const percentage = Math.min((marketCap / targetMarketCap) * 100, 100);
		return percentage;
	};

	const marketCapProgress = getMarketCapProgress();
	console.log(info)
	return (
		<div className="flex-1 w-full px-[16px] md:px-[0px] flex flex-col items-center pt-[8px] relative mb-[50px]">
			<div className="flex md:flex-row flex-col items-center w-full md:gap-[12px]">
				<MyAvatar src={info?.metadata?.image || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
				<div className="md:flex md:flex-col md:gap-[2px]">
					<div className="text-[#fff] mt-[16px] md:mt-[0px] text-[20px] font-bold flex items-center justify-center gap-[4px] md:justify-start">{info?.metadata?.symbol?.toUpperCase() || '--'}</div>
					<div className="text-[#AAAAAA] mt-[2px] md:mt-[0px] text-[13px] text-center md:text-left">{info?.metadata?.name || '--'}</div>
				</div>
			</div>

			{/* 市值进度条 */}
			<div className="w-full mt-[20px] p-[16px] bg-[#1A1A1A] rounded-[16px] border border-[#333]">
				<div className="flex justify-between items-center mb-[12px]">
					<span className="text-[14px] text-[#AAAAAA] font-medium">Market Cap Progress</span>
					<span className="text-[14px] text-[#9AED2D] font-bold">{marketCapProgress.toFixed(1)}%</span>
				</div>
				<div className="w-full h-[12px] bg-[#ffffff08] rounded-full overflow-hidden relative">
					<div
						className="h-full bg-gradient-to-r from-[#9AED2D] via-[#7ED321] to-[#6BCF1F] rounded-full transition-all duration-1500 ease-out relative shadow-lg"
						style={{ width: `${marketCapProgress}%` }}
					>
						{/* 内部光泽效果 */}
						<div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-full"></div>
						{/* 流动效果 */}
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
					</div>
					{/* 进度条背景纹理 */}
					<div className="absolute inset-0 bg-gradient-to-r from-[#ffffff02] to-[#ffffff08] rounded-full"></div>
				</div>
			</div>
			<div className="w-full flex items-center justify-center md:justify-start gap-[8px] mt-[12px]">
				<div className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] text-[12px] px-[10px] text-[#fff] flex items-center gap-[6px] hover:bg-[#2A2A2A] transition-colors">
					{shortenAddress(info?.mint || '')}
					<CopyIcon className="cursor-pointer hover:text-[#9AED2D] transition-colors" onClick={() => copy(info?.mint || '')} />
				</div>
				{
					info?.metadata?.x && <div
						onClick={() => { window.open(info?.metadata?.x, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/x.png" alt="x" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				{
					info?.metadata?.telegram && <div
						onClick={() => { window.open(info?.metadata?.telegram, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/tg.png" alt="tg" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				{
					info?.metadata?.website && <div
						onClick={() => { window.open(info?.metadata?.website, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/web.png" alt="web" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				<div className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] md:flex items-center cursor-pointer hidden hover:bg-[#2A2A2A] transition-colors" onClick={() => setIsShareOpen(true)}>
					<ShareIcon className="w-[16px]" />
				</div>
			</div>
			<div className="text-[13px] text-[#AAAAAA] text-center md:text-left mt-[16px] w-full">{info?.description}</div>
			<div className="flex items-center gap-[12px] mt-[16px] w-full">
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">价格</div>
					<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(info?.price_usd_f)}</div>
				</div>
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">市值</div>
					<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(info?.price_usd_f * 1e9)}</div>
				</div>
			</div>
			<div className="flex items-center gap-[12px] mt-[12px] w-full">
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">24H 涨跌</div>
					<div className={`text-[20px] font-semibold ${priceChangeDisplay.color}`}>
						{priceChangeDisplay.text}
					</div>
				</div>
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">持有者</div>
					<div className="text-[20px] text-[#fff] font-semibold">{info?.holder_count || 0}</div>
				</div>
			</div>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={info} />
		</div>
	)
}