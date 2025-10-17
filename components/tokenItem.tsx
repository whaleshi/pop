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
			return { text: `+${change.toFixed(2)}%`, color: 'text-[#00D935]' };
		} else if (change < 0) {
			return { text: `${change.toFixed(2)}%`, color: 'text-[#FF4C4C]' };
		} else {
			return { text: '0.00%', color: 'text-[#94989F]' };
		}
	};

	const priceChangeDisplay = formatPriceChange(item?.price_change_24h_f);

	return (
		<div className={`w-full h-[72px] rounded-[16px] px-[12px] flex items-center gap-[8px] mt-[8px] cursor-pointer border-[1.5px] ${border ? 'border-[#FFE900]' : 'border-white hover:border-[#FFE900]'}`}
			style={{
				background: "linear-gradient(180deg, #FFFDEB 0%, #FFF 70%)"
			}}
			onClick={() => router.push(`/token/${item?.address}`)}
		>
			<MyAvatar src={item?.metadata?.image || '/images/default.png'} alt="icon" className="w-[48px] h-[48px] rounded-[12px]" />
			<div className="flex flex-col gap-[2px] flex-1">
				<div className="text-[15px] text-[#24232A]">{item?.metadata?.symbol}</div>
				<div className="text-[13px] text-[#94989F]">{item?.metadata?.name}</div>
			</div>
			<div className="flex flex-col gap-[2px] text-right">
				<div className="text-[15px] text-[#24232A]"><span className="text-[#94989F]">MC</span> ${formatBigNumber(item?.price_usd_f * 1e9)}</div>
				<div className="text-[13px] text-[#94989F]">24H <span className={`${priceChangeDisplay.color}`}>{priceChangeDisplay.text}</span></div>
			</div>
		</div>
	)
}