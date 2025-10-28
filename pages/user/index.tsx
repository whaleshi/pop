import { WalletBox } from "@/components/wallet";
import DefaultLayout from "@/layouts/default";
import { Image, Button } from "@heroui/react";
import { useRouter } from "next/router";
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

export default function User() {
	const router = useRouter();
	const { address, isConnected } = useAccount();
	const { openConnectModal } = useConnectModal();
	const [isMdOrLarger, setIsMdOrLarger] = useState(true);

	const handleConnect = () => {
		openConnectModal?.();
	}

	// 打开外部链接
	const openExternalLink = (url: string) => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	};

	// 检测屏幕尺寸是否为 md 或更大
	useEffect(() => {
		const checkScreenSize = () => {
			const isMd = window.matchMedia('(min-width: 768px)').matches;
			setIsMdOrLarger(isMd);

			if (isMd) {
				router.replace('/');
			}
		};

		// 初始检查
		checkScreenSize();

		// 监听屏幕尺寸变化
		const mediaQuery = window.matchMedia('(min-width: 768px)');
		mediaQuery.addEventListener('change', checkScreenSize);

		return () => {
			mediaQuery.removeEventListener('change', checkScreenSize);
		};
	}, [router]);

	// 如果屏幕尺寸小于 md，不渲染页面内容
	if (isMdOrLarger) {
		return null;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center w-full px-[16px] h-full pt-[16px]">
				{
					address && <WalletBox />
				}
				<div className="border-[1.5px] border-[#333] rounded-[16px] h-[52px] w-full px-[16px] text-[16px] text-[#fff] mt-[16px] flex items-center cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors" onClick={() => router.push("/create")}>创建代币</div>
				<div className="border-[1.5px] border-[#333] rounded-[16px] h-[52px] w-full px-[16px] text-[16px] text-[#fff] mt-[12px] flex items-center cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors" onClick={() => openExternalLink(siteConfig.links.work)}>运行机制</div>
				<div className="border-[1.5px] border-[#333] rounded-[16px] h-[52px] w-full px-[16px] text-[16px] text-[#fff] mt-[12px] flex items-center justify-between cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors">
					加入社区
					<div className="flex items-center gap-[8px]">
						<Image
							src="/images/joinX.png"
							alt="x"
							className="w-[28px] h-[28px] cursor-pointer"
							disableSkeleton
							radius="none"
							onClick={(e) => {
								e.stopPropagation();
								openExternalLink(siteConfig.links.x);
							}}
						/>
						<Image
							src="/images/joinTg.png"
							alt="tg"
							className="w-[28px] h-[28px] cursor-pointer"
							disableSkeleton
							radius="none"
							onClick={(e) => {
								e.stopPropagation();
								openExternalLink(siteConfig.links.tg);
							}}
						/>
					</div>
				</div>
				<div className="flex-1"></div>
				<div className="w-full">
					{
						!isConnected && <Button fullWidth className="h-[52px] w-full rounded-[16px] bg-[#abf909] text-[15px] text-[#000] hover:bg-[#9AED2D] transition-colors" onPress={handleConnect}>连接钱包</Button>
					}
				</div>
			</section>
		</DefaultLayout>
	);
}
