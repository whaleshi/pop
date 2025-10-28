import router from "next/router";
import MyAvatar from "@/components/avatarImage";
import { formatBigNumber } from "@/utils/formatBigNumber";
import { TRANSACTION_CONFIG } from "@/config/chains";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";

interface TokenItemProps {
	border?: boolean;
	item?: any;
}

export const TokenItem = ({ border = false, item }: TokenItemProps) => {
	const { price: popPrice } = useBalanceContext();

	// 计算市值
	const calculateMarketCap = () => {
		try {
			// 使用公式: BigNumber(lastPrice).div(1e18).times(1000000000).times(popPrice).dp(2)
			const lastPrice = item?.info?.lastPrice || 0;
			const tokenSupply = 1000000000; // 10亿代币总量
			
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

	// 计算价格变化百分比
	const calculatePriceChange = () => {
		const currentPrice = item?.info?.lastPrice;
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

	const formatPriceChange = (change: number | null) => {
		if (change === undefined || change === null) {
			return { text: '--', color: 'text-[#94989F]' };
		}

		if (change > 0) {
			return { text: `+${change.toFixed(2)}%`, color: 'text-[#9AED2D]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#ED2D2D]' };
		} else {
			return { text: '0.00%', color: 'text-[#94989F]' };
		}
	};

	const priceChangePercent = calculatePriceChange();
	const priceChangeDisplay = formatPriceChange(priceChangePercent);
	const marketCap = calculateMarketCap();

	return (
		<div className={`w-full rounded-[10px] px-[12px] py-[12px] cursor-pointer bg-[#0E0E0E] relative overflow-hidden`}
			onClick={() => router.push(`/token/${item?.address}`)}
		>
			<div className="flex items-center gap-[8px]">
				<MyAvatar src={item?.metadata?.image || '/images/default.png'} alt="icon" className="w-[48px] h-[48px] rounded-full" />
				<div className="flex flex-col gap-[2px] flex-1">
					<div className="text-[15px] text-[#FFFFFF]">{item?.metadata?.symbol}</div>
					<div className="text-[13px] text-[#8C8C8C]">{item?.metadata?.name}</div>
				</div>
				<div className="flex flex-col gap-[2px] text-right">
					<div className="text-[15px] text-[#FFFFFF]"><span className="text-[#FFFFFF]">MC</span> ${formatBigNumber(marketCap)}</div>
					<div className="text-[13px] text-[#8C8C8C]">涨幅 <span className={`${priceChangeDisplay.color}`}>{priceChangeDisplay.text}</span></div>
				</div>
			</div>
			
			{/* 底部进度条 */}
			<div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ffffff08]">
				<div 
					className="h-full bg-gradient-to-r from-[#9AED2D] to-[#7ED321] transition-all duration-1000 ease-out"
					style={{ width: `${item?.progress}%` }}
				/>
			</div>
		</div>
	)
}