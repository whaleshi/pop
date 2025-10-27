import router from "next/router";
import MyAvatar from "@/components/avatarImage";
import { formatBigNumber } from "@/utils/formatBigNumber";

interface TokenItemProps {
	border?: boolean;
	item?: any;
}

export const TokenItem = ({ border = false, item }: TokenItemProps) => {

	const formatPriceChange = (change: number | undefined) => {
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

	const priceChangeDisplay = formatPriceChange(item?.price_change_24h_f);

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
					<div className="text-[15px] text-[#FFFFFF]"><span className="text-[#FFFFFF]">MC</span> ${formatBigNumber(item?.price_usd_f * 1e9)}</div>
					<div className="text-[13px] text-[#8C8C8C]">24H <span className={`${priceChangeDisplay.color}`}>{priceChangeDisplay.text}</span></div>
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