import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import QueryProvider from '@/providers/queryProvider'
import PrivyProviders from '@/providers/privyProvider'
import { BalanceProvider } from '@/providers/balanceProvider'
import { Toaster } from 'sonner';
import NProgress from 'nprogress';

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

	// 路由保护 - 只允许访问首页
	useEffect(() => {
		if (router.pathname !== '/') {
			router.replace('/');
		}
	}, [router.pathname, router]);


	return (
		<>
			<Head>
				{/* 预加载关键图片 */}
				<link rel="preload" href="/images/logo.png" as="image" />
				<link rel="preload" href="/images/nothing.png" as="image" />
				<link rel="preload" href="/images/default.png" as="image" />
				<link rel="preload" href="/images/banner.png" as="image" />
			</Head>
			{/* <PrivyProviders> */}
			<QueryProvider>
				<BalanceProvider>
					<HeroUIProvider navigate={router.push}>
						<Toaster richColors position="top-center" />
						<NextThemesProvider attribute="class" defaultTheme="light">
							<Component {...pageProps} />
						</NextThemesProvider>
					</HeroUIProvider>
				</BalanceProvider>
			</QueryProvider>
			{/* </PrivyProviders> */}
		</>
	);
}

export const fonts = {
	sans: fontSans.style.fontFamily
};
