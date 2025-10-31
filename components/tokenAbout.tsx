import { useState, useEffect } from "react";
import { Image } from "@heroui/react"
import MyAvatar from "@/components/avatarImage";
import { CopyIcon, GoldIcon, ShareIcon } from "./icons";
import Share from "./share";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import { formatBigNumber } from "@/utils/formatBigNumber";
import { TRANSACTION_CONFIG } from "@/config/chains";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
import { useTranslation } from 'react-i18next';

interface TokenProps {
	info?: any;
	metadata?: any;
}

export const TokenAbout = ({ info, metadata }: TokenProps) => {
	const { t } = useTranslation('common');
	const [isShareOpen, setIsShareOpen] = useState(false);
	const { copy } = useClipboard({
		successMessage: t('messages.copySuccessful'),
		errorMessage: t('messages.copyFailed')
	});
	const { price: popPrice } = useBalanceContext();


	// 使用元数据或基础数据
	const displayName = metadata?.name || info?.name || `Token ${info?.address?.slice(0, 6)}...${info?.address?.slice(-4)}`;
	const displaySymbol = metadata?.symbol || info?.symbol || "--";
	const displayImage = metadata?.image || '/images/default.png';

	// Calculate token price
	const calculateTokenPrice = () => {
		try {
			// Calculate token USD price: BigNumber(lastPrice).div(1e18).times(popPrice)
			const lastPrice = info?.info?.lastPrice || 0;

			const tokenPrice = _bignumber(lastPrice)
				.div(1e18)
				.times(popPrice || 0)
				.toString();

			return parseFloat(tokenPrice);
		} catch (error) {
			console.error('Token price calculation error:', error);
			return 0;
		}
	};

	// Calculate market cap
	const calculateMarketCap = () => {
		try {
			// Use formula: BigNumber(lastPrice).div(1e18).times(1000000000).times(popPrice).dp(2)
			const lastPrice = info?.info?.lastPrice || 0;
			const tokenSupply = 1000000000; // 1 billion total token supply

			const marketCap = _bignumber(lastPrice)
				.div(1e18)
				.times(tokenSupply)
				.times(popPrice || 0)
				.dp(2)
				.toString();

			return parseFloat(marketCap);
		} catch (error) {
			console.error('Market cap calculation error:', error);
			return 0;
		}
	};

	// Calculate price change percentage
	const calculatePriceChange = () => {
		const currentPrice = info?.info?.lastPrice;
		const initialPrice = TRANSACTION_CONFIG.INITIAL_PRICE;

		if (!currentPrice || !initialPrice) {
			return null;
		}

		try {
			const current = parseFloat(currentPrice);
			const initial = parseFloat(initialPrice);

			if (initial === 0) return null;

			const changePercent = ((current - initial) / initial) * 100;
			return changePercent;
		} catch (error) {
			console.error('Price change calculation error:', error);
			return null;
		}
	};

	// Format price change display
	const formatPriceChange = (change: number | null) => {
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

	const priceChangePercent = calculatePriceChange();
	const priceChangeDisplay = formatPriceChange(priceChangePercent);
	const tokenPrice = calculateTokenPrice();
	const marketCap = calculateMarketCap();

	console.log(info)
	return (
		<div className="flex-1 w-full px-[16px] md:px-[0px] flex flex-col items-center pt-[8px] relative mb-[50px]">
			<div className="flex md:flex-row flex-col items-center w-full md:gap-[12px]">
				<MyAvatar src={displayImage} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
				<div className="md:flex md:flex-col md:gap-[2px]">
					<div className="text-[#fff] mt-[16px] md:mt-[0px] text-[20px] font-bold flex items-center justify-center gap-[4px] md:justify-start">{displaySymbol.toUpperCase()}</div>
					<div className="text-[#AAAAAA] mt-[2px] md:mt-[0px] text-[13px] text-center md:text-left">{displayName}</div>
				</div>
			</div>

			{/* Market cap progress bar */}
			<div className="w-full mt-[20px] p-[16px] bg-[#1A1A1A] rounded-[16px] border border-[#333]">
				<div className="flex justify-between items-center mb-[12px]">
					<span className="text-[14px] text-[#AAAAAA] font-medium">{t('token.progress')}</span>
					<span className="text-[14px] text-[#9AED2D] font-bold">{(Math.floor((info?.progressPercent || 0) * 100) / 100).toFixed(2)}%</span>
				</div>
				<div className="w-full h-[12px] bg-[#ffffff08] rounded-full overflow-hidden relative">
					<div
						className="h-full bg-gradient-to-r from-[#9AED2D] via-[#7ED321] to-[#6BCF1F] rounded-full transition-all duration-1500 ease-out relative shadow-lg"
						style={{ width: `${info?.progress}%` }}
					>
						{/* Inner glow effect */}
						<div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-full"></div>
						{/* Flow effect */}
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
					</div>
					{/* Progress bar background texture */}
					<div className="absolute inset-0 bg-gradient-to-r from-[#ffffff02] to-[#ffffff08] rounded-full"></div>
				</div>
			</div>
			<div className="w-full flex items-center justify-center md:justify-start gap-[8px] mt-[12px]">
				<div className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] text-[12px] px-[10px] text-[#fff] flex items-center gap-[6px] hover:bg-[#2A2A2A] transition-colors">
					{shortenAddress(info?.address || '')}
					<CopyIcon className="cursor-pointer hover:text-[#9AED2D] transition-colors" onClick={() => copy(info?.address || '')} />
				</div>
				{
					metadata?.x && <div
						onClick={() => { window.open(metadata?.x, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/x.png" alt="x" width={20} height={20} disableSkeleton radius='none' />
					</div>
				}
				{
					metadata?.telegram && <div
						onClick={() => { window.open(metadata?.telegram, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/tg.png" alt="tg" width={20} height={20} disableSkeleton radius='none' />
					</div>
				}
				{
					metadata?.website && <div
						onClick={() => { window.open(metadata?.website, "_blank"); }}
						className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] flex items-center cursor-pointer hover:bg-[#2A2A2A] transition-colors">
						<Image src="/images/web.png" alt="web" width={16} height={16} disableSkeleton radius='none' />
					</div>
				}
				<div className="border-[1px] border-[#333] bg-[#1A1A1A] rounded-[12px] h-[32px] px-[10px] md:flex items-center cursor-pointer hidden hover:bg-[#2A2A2A] transition-colors" onClick={() => setIsShareOpen(true)}>
					<ShareIcon className="w-[16px]" />
				</div>
			</div>
			<div className="text-[13px] text-[#AAAAAA] text-center md:text-left mt-[16px] w-full">{metadata?.description}</div>
			<div className="flex items-center gap-[12px] mt-[16px] w-full">
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">{t('token.price')}</div>
					<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(tokenPrice)}</div>
				</div>
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">{t('token.marketCap')}</div>
					<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(marketCap)}</div>
				</div>
			</div>
			<div className="flex items-center gap-[12px] mt-[12px] w-full">
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">{t('token.change')}</div>
					<div className={`text-[20px] font-semibold ${priceChangeDisplay.color}`}>
						{priceChangeDisplay.text}
					</div>
				</div>
				<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
					<div className="text-[13px] text-[#AAAAAA]">{t('token.holders')}</div>
					<div className="text-[20px] text-[#fff] font-semibold">--</div>
				</div>
			</div>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={info} />
		</div>
	)
}