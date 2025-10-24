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
			return { text: `+${change.toFixed(2)}%`, color: 'text-[##9AED2D]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#ED2D2D]' };
		} else {
			return { text: '0.00%', color: 'text-[#94989F]' };
		}
	};

	const priceChangeDisplay = formatPriceChange(item?.price_change_24h_f);

	return (
		<div className={`w-full h-[72px] rounded-[10px] px-[12px] flex items-center gap-[8px] cursor-pointer bg-[#0E0E0E]`}
			onClick={() => router.push(`/token/${item?.address}`)}
		>
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
	)
}