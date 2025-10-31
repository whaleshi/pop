import type { AppProps } from "next/app";
import { Head } from "@/layouts/head";
import { useEffect, useState } from "react";
import '@rainbow-me/rainbowkit/styles.css';

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import QueryProvider from '@/providers/queryProvider'
import { BalanceProvider } from '@/providers/balanceProvider'
import { Toaster } from 'sonner';
import NProgress from 'nprogress';
import { RainbowKitProvider, darkTheme, Locale } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import '@/lib/i18n';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { useTranslation } from 'react-i18next';

import { fontSans } from "@/config/fonts";
import "nprogress/nprogress.css";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();
	const [isMounted, setIsMounted] = useState(false);
	const { i18n } = useTranslation();

	// Map i18n language codes to RainbowKit locales
	const getRainbowKitLocale = (lang: string): Locale => {
		const localeMap: Record<string, Locale> = {
			'en': 'en-US',
			'zh': 'zh-CN',
			'ko': 'ko-KR',
			'ja': 'ja-JP',
			'vi': 'vi-VN'
		};
		return localeMap[lang] || 'en-US';
	};

	// 客户端挂载检查
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// 配置nprogress
	useEffect(() => {
		NProgress.configure({
			showSpinner: false, // 隐藏加载圆圈
			minimum: 0.3, // 最小进度
			easing: 'ease', // 动画效果
			speed: 200 // 动画速度
		});
	}, []);

	// 监听路由变化
	useEffect(() => {
		const handleStart = () => {
			NProgress.start();
		};

		const handleStop = () => {
			NProgress.done();
		};

		router.events.on('routeChangeStart', handleStart);
		router.events.on('routeChangeComplete', handleStop);
		router.events.on('routeChangeError', handleStop);

		return () => {
			router.events.off('routeChangeStart', handleStart);
			router.events.off('routeChangeComplete', handleStop);
			router.events.off('routeChangeError', handleStop);
		};
	}, [router]);


	return (
		<>
			<Head tokenMetadata={pageProps.tokenMetadata} />
			{isMounted ? (
				<WagmiProvider config={config}>
					<QueryProvider>
						<RainbowKitProvider
							theme={darkTheme({
								accentColor: '#9AED2D',
								accentColorForeground: 'black',
								borderRadius: 'medium',
								fontStack: 'system',
								overlayBlur: 'small',
							})}
							locale={getRainbowKitLocale(i18n.language)}
						>
							<BalanceProvider>
								<HeroUIProvider navigate={router.push}>
									<Toaster richColors position="top-center" />
									<NetworkSwitcher />
									<NextThemesProvider attribute="class" defaultTheme="dark">
										<div className="page-transition bg-[#000000] min-h-screen">
											<Component {...pageProps} />
										</div>
									</NextThemesProvider>
								</HeroUIProvider>
							</BalanceProvider>
						</RainbowKitProvider>
					</QueryProvider>
				</WagmiProvider>
			) : (
				<div className="page-transition bg-[#000000] min-h-screen">
					{/* 加载占位符，等待客户端挂载 */}
				</div>
			)}
		</>
	);
}

export const fonts = {
	sans: fontSans.style.fontFamily
};
