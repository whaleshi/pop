import { useState, useEffect } from "react";
import { Image, Button } from "@heroui/react"
import MyAvatar from "@/components/avatarImage";
import { CopyIcon, GoldIcon, ShareIcon } from "./icons";
import Share from "./share";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import { formatBigNumber } from "@/utils/formatBigNumber";
import { TRANSACTION_CONFIG, DEFAULT_CHAIN_ID } from "@/config/chains";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
import { useTranslation } from 'react-i18next';

interface TokenProps {
	info?: any;
	metadata?: any;
}

export const TokenEnd = ({ info, metadata }: TokenProps) => {
	console.log(info?.aveData?.current_price_usd);
	const { t } = useTranslation('common');
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const { copy } = useClipboard({
		successMessage: t('messages.copySuccessful'),
		errorMessage: t('messages.copyFailed')
	});
	const { price: popPrice } = useBalanceContext();

	// Calculate token price
	const calculateTokenPrice = () => {
		try {
			// Calculate token USD price: BigNumber(lastPrice).div(1e18).times(popPrice)
			const lastPrice = info?.info?.lastPrice || 0;

			const tokenPrice = _bignumber(lastPrice)
				.div(1e18)
				.times(popPrice || 0)
				.toString();

			return parseFloat(info?.aveData?.current_price_usd || tokenPrice);
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

			return parseFloat(info?.aveData?.market_cap || marketCap);
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

	// Format 24h price change from Ave API
	const format24hPriceChange = () => {
		const priceChange24h = info?.aveData?.price_change_24h;
		if (!priceChange24h) {
			return { text: '--', color: 'text-[#fff]' };
		}

		const change = parseFloat(priceChange24h);
		if (change > 0) {
			return { text: `+${change.toFixed(2)}%`, color: 'text-[#00D935]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#FF4C4C]' };
		} else {
			return { text: '0.00%', color: 'text-[#fff]' };
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
		<div className="flex-1 w-full px-[16px] md:px-[0px] flex flex-col items-center pt-[8px] relative">
			<div className="flex flex-col items-center w-full md:gap-[12px]">
				<MyAvatar src={metadata?.image || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
				<div className="md:flex md:flex-col md:gap-[2px]">
					<div className="text-[#fff] mt-[16px] md:mt-[0px] text-[20px] font-bold flex items-center justify-center gap-[4px] md:justify-start">{metadata?.symbol?.toUpperCase() || '--'} </div>
					<div className="text-[#AAAAAA] mt-[2px] md:mt-[0px] text-[13px] text-center">{metadata?.name || '--'}</div>
				</div>
			</div>
			<div className="w-full flex items-center justify-center gap-[4px] mt-[12px]">
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
			<div className="text-[13px] text-[#AAAAAA] text-center mt-[16px] md:max-w-[600px]">{metadata?.description}</div>
			<div className="flex flex-col md:flex-row items-center gap-[12px] mt-[16px] w-full">
				<div className="flex items-center gap-[12px] w-full">
					<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
						<div className="text-[13px] text-[#AAAAAA]">{t('token.price')}</div>
						<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(tokenPrice)}</div>
					</div>
					<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
						<div className="text-[13px] text-[#AAAAAA]">{t('token.marketCap')}</div>
						<div className="text-[20px] text-[#fff] font-semibold">${formatBigNumber(marketCap)}</div>
					</div>
				</div>
				<div className="flex items-center gap-[12px] w-full">
					<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
						<div className="text-[13px] text-[#AAAAAA]">{t('token.change')}</div>
						<div className={`text-[20px] font-semibold ${format24hPriceChange().color}`}>
							{format24hPriceChange().text}
						</div>
					</div>
					<div className="w-full py-[12px] px-[16px] border-[#333] border-[1px] rounded-[16px] bg-[#1A1A1A]">
						<div className="text-[13px] text-[#AAAAAA]">{t('token.holders')}</div>
						<div className="text-[20px] text-[#fff] font-semibold">
							{info?.holdersData?.holders ? info.holdersData.holders.toLocaleString() : '--'}
						</div>
					</div>
				</div>
			</div>
			<div className="w-full mt-[16px] md:mt-[24px] flex flex-col md:grid md:grid-cols-2 gap-[12px]">
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#5A4CF3] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://swap.popchain.ai/swap?chainId=${DEFAULT_CHAIN_ID}&outputCurrency=${info?.address}`, "_blank"); }}
				>
					<Image src="/images/popSwap.png" alt="pop" width={16} height={18} disableSkeleton radius='none' />Pop Swap
				</Button>
				<Button fullWidth className="h-[48px] rounded-[16px] bg-[#24232A] text-[14px] text-[#fff]"
					onPress={() => { window.open(`https://ave.ai/token/${info?.address}-popchain`, "_blank"); }}
				>
					<Image src="/images/ave.png" alt="ave" width={16} height={16} disableSkeleton radius='none' />Ave
				</Button>
			</div>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={info} metadata={metadata} />
		</div>
	)
}