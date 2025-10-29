import React from "react";
import NextHead from "next/head";
import { useRouter } from "next/router";
import { siteConfig } from "@/config/site";
import { TokenHead } from "@/components/TokenHead";

interface HeadProps {
	tokenMetadata?: {
		name?: string;
		symbol?: string;
		image?: string;
	};
}

export const Head = ({ tokenMetadata }: HeadProps = {}) => {
	const router = useRouter();

	// 等待路由准备完毕
	if (!router.isReady) {
		return (
			<NextHead>
				<title>{siteConfig.name}</title>
				<meta key="title" content={siteConfig.name} property="og:title" />
				<meta content={siteConfig.description} name="description" />
				<meta
					key="viewport"
					content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
					name="viewport"
				/>
				<link href="/favicon.ico" rel="icon" />
			</NextHead>
		);
	}

	// 如果是 token 页面，使用 TokenHead 组件
	console.log(router.pathname.startsWith('/token/'))
	if (router.pathname.startsWith('/token/')) {
		return <TokenHead serverMetadata={tokenMetadata} />;
	}

	// 默认的 Head 组件
	return (
		<NextHead>
			<title>{siteConfig.name}</title>
			<meta key="title" content={siteConfig.name} property="og:title" />
			<meta content={siteConfig.description} name="description" />
			<meta
				key="viewport"
				content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
				name="viewport"
			/>
			<link href="/favicon.ico" rel="icon" />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content="website" />
			<meta property="og:title" content={siteConfig.name} />
			<meta property="og:description" content={siteConfig.description} />
			<meta
				property="og:image"
				content="https://popme.mypinata.cloud/ipfs/bafkreigpmkeqa6o4xcd4eiwewuceedfr55h7a5kpacy3bcyo6alaxpdm6a"
			/>
			<meta property="og:url" content="https://popme.fun" />
			<meta property="og:site_name" content={siteConfig.name} />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={siteConfig.name} />
			<meta name="twitter:description" content={siteConfig.description} />
			<meta
				name="twitter:image"
				content="https://popme.mypinata.cloud/ipfs/bafkreigpmkeqa6o4xcd4eiwewuceedfr55h7a5kpacy3bcyo6alaxpdm6a"
			/>
			<meta name="twitter:site" content="@popmefun" />
			<meta name="twitter:creator" content="@popmefun" />
		</NextHead>
	);
};
