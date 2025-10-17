import React from "react";
import NextHead from "next/head";
import { useRouter } from "next/router";
import { siteConfig } from "@/config/site";

export const Head = () => {
	const router = useRouter();
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
			{
				!router.pathname.startsWith('/token/') && <>
					{/* Open Graph / Facebook */}
					<meta property="og:type" content="website" />
					<meta property="og:title" content={siteConfig.name} />
					<meta property="og:description" content={siteConfig.description} />
					<meta
						property="og:image"
						content="https://newgame.mypinata.cloud/ipfs/bafkreif63azrbr62habc3yb4ra2udp25zpcv5cesu654r3zxtfrwberjde"
					/>
					<meta property="og:url" content="https://nihao.com" />
					<meta property="og:site_name" content={siteConfig.name} />

					{/* Twitter */}
					<meta name="twitter:card" content="summary_large_image" />
					<meta name="twitter:title" content={siteConfig.name} />
					<meta name="twitter:description" content={siteConfig.description} />
					<meta
						name="twitter:image"
						content="https://newgame.mypinata.cloud/ipfs/bafkreif63azrbr62habc3yb4ra2udp25zpcv5cesu654r3zxtfrwberjde"
					/>
					<meta name="twitter:site" content="@nihaocrypto" />
					<meta name="twitter:creator" content="@nihaocrypto" />
				</>
			}

		</NextHead>
	);
};
