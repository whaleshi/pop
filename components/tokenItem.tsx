import router from "next/router";
import MyAvatar from "@/components/avatarImage";
import { formatBigNumber } from "@/utils/formatBigNumber";
import { TRANSACTION_CONFIG } from "@/config/chains";
import { useBalanceContext } from "@/providers/balanceProvider";
import { useQuery } from "@tanstack/react-query";
import _bignumber from "bignumber.js";

interface TokenItemProps {
	border?: boolean;
	item?: any;
}

export const TokenItem = ({ border = false, item }: TokenItemProps) => {
	const { price: popPrice } = useBalanceContext();

	// 获取代币元数据
	const { data: metadata } = useQuery({
		queryKey: ["tokenMetadata", item?.address],
		queryFn: async () => {
			// 如果没有 URI，直接使用基础数据
			if (!item?.uri || item?.uri === "") {
				return {
					name: item?.name || `Token ${item?.address?.slice(0, 6)}...${item?.address?.slice(-4)}`,
					symbol: item?.symbol || "--",
					description: "",
					image: '/images/default.png',
				};
			}

			try {
				const response = await fetch('/api/tokens/metadata', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						addresses: [item.address],
						uris: [item.uri]
					})
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success && data.data[item.address]) {
						// 合并基础数据和元数据，优先使用合约的 name/symbol
						return {
							name: item?.name || data.data[item.address].name,
							symbol: item?.symbol || data.data[item.address].symbol,
							description: data.data[item.address].description || "",
							image: data.data[item.address].image || '/images/default.png',
							website: data.data[item.address].website || "",
							x: data.data[item.address].x || "",
							telegram: data.data[item.address].telegram || "",
						};
					}
				}
			} catch (error) {
				console.warn(`Failed to fetch metadata for ${item?.address}:`, error);
			}

			// 降级方案
			return {
				name: item?.name || `Token ${item?.address?.slice(0, 6)}...${item?.address?.slice(-4)}`,
				symbol: item?.symbol || "--",
				description: "",
				image: '/images/default.png',
			};
		},
		enabled: !!item?.address,
		staleTime: Infinity, // 永久缓存，元数据不会变
		gcTime: Infinity, // 永不清理缓存
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	// 使用元数据或基础数据
	const displayName = metadata?.name || item?.name || `Token ${item?.address?.slice(0, 6)}...${item?.address?.slice(-4)}`;
	const displaySymbol = metadata?.symbol || item?.symbol || "--";
	const displayImage = metadata?.image || '/images/default.png';

	// Calculate market cap
	const calculateMarketCap = () => {
		try {
			// Use formula: BigNumber(lastPrice).div(1e18).times(1000000000).times(popPrice).dp(2)
			const lastPrice = item?.info?.lastPrice || 0;
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
				<MyAvatar src={displayImage} alt="icon" className="w-[48px] h-[48px] rounded-full" />
				<div className="flex flex-col gap-[2px] flex-1">
					<div className="text-[15px] text-[#FFFFFF]">{displaySymbol}</div>
					<div className="text-[13px] text-[#8C8C8C]">{displayName}</div>
				</div>
				<div className="flex flex-col gap-[2px] text-right">
					<div className="text-[15px] text-[#FFFFFF]"><span className="text-[#FFFFFF]">MC</span> ${formatBigNumber(marketCap)}</div>
					<div className="text-[13px] text-[#8C8C8C]">Change <span className={`${priceChangeDisplay.color}`}>{priceChangeDisplay.text}</span></div>
				</div>
			</div>

			{/* Bottom progress bar */}
			<div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ffffff08]">
				<div
					className="h-full bg-gradient-to-r from-[#9AED2D] to-[#7ED321] transition-all duration-1000 ease-out"
					style={{ width: `${item?.progress}%` }}
				/>
			</div>
		</div>
	)
}