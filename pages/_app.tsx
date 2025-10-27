import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import '@rainbow-me/rainbowkit/styles.css';

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import QueryProvider from '@/providers/queryProvider'
import { BalanceProvider } from '@/providers/balanceProvider'
import { Toaster } from 'sonner';
import NProgress from 'nprogress';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';

import { fontSans } from "@/config/fonts";
import "@/styles/globals.css";
import "nprogress/nprogress.css";

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();

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
			<Head>
				<link rel="preload" href="/images/logo.png" as="image" />
				<link rel="preload" href="/images/nothing.png" as="image" />
				<link rel="preload" href="/images/default.png" as="image" />
				<link rel="preload" href="/images/banner.png" as="image" />
			</Head>
			<WagmiProvider config={config}>
				<QueryProvider>
					<RainbowKitProvider theme={darkTheme()}>
						<BalanceProvider>
							<HeroUIProvider navigate={router.push}>
								<Toaster richColors position="top-center" />
								<NextThemesProvider attribute="class" defaultTheme="light">
									<Component {...pageProps} />
								</NextThemesProvider>
							</HeroUIProvider>
						</BalanceProvider>
					</RainbowKitProvider>
				</QueryProvider>
			</WagmiProvider>
		</>
	);
}

export const fonts = {
	sans: fontSans.style.fontFamily
};
