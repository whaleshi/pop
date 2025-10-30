import React, { useState, useEffect } from "react";
import NextHead from "next/head";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useTranslation } from 'react-i18next';
import { siteConfig } from "@/config/site";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import contractABI from "@/constant/TokenFactory.abi.json";

interface TokenHeadProps {
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  serverMetadata?: {
    name?: string;
    symbol?: string;
    image?: string;
  };
}

interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
}

export const TokenHead: React.FC<TokenHeadProps> = ({
  fallbackTitle = siteConfig.name,
  fallbackDescription = siteConfig.description,
  fallbackImage = "https://popme.mypinata.cloud/ipfs/bafkreigpmkeqa6o4xcd4eiwewuceedfr55h7a5kpacy3bcyo6alaxpdm6a",
  serverMetadata
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { addr } = router.query;
  const [metadata, setMetadata] = useState<TokenMetadata | null>(serverMetadata || null);

  useEffect(() => {
    // 如果已经有服务端数据，就必须使用服务端数据
    if (serverMetadata) {
      setMetadata(serverMetadata);
      return;
    }

    if (!addr || typeof addr !== "string") {
      return;
    }

    const fetchTokenData = async () => {
      try {
        // 创建 provider
        const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);

        // 创建合约实例
        const contract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, contractABI, provider);

        // 获取 URI
        const uri = await contract.uri(addr);

        if (uri && uri !== "") {
          // 从 URI 获取 JSON 元数据
          const response = await fetch(uri);
          if (response.ok) {
            const metadata = await response.json();
            setMetadata({
              name: metadata.name,
              symbol: metadata.symbol,
              image: metadata.image
            });
          } else {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
          }
        } else {
          throw new Error("No URI found");
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
        // 设置默认元数据
        setMetadata({
          name: `Token ${typeof addr === "string" ? addr.slice(0, 6) + "..." + addr.slice(-4) : ""}`,
          symbol: "--",
          image: fallbackImage,
        });
      }
    };

    fetchTokenData();
  }, [addr, fallbackImage, serverMetadata]);

  // 构建动态 meta 数据
  const title = metadata?.name ? `${metadata.name} (${metadata.symbol}) - ${siteConfig.name}` : fallbackTitle;
  const description = t('meta.tradeDescription', { 
    symbol: metadata?.symbol?.toUpperCase() || 'token', 
    siteName: siteConfig.name,
    description: fallbackDescription
  });

  // 使用 OG API 生成图片
  const ogImageUrl = metadata?.name && metadata?.symbol && metadata?.image
    ? `/api/og?name=${encodeURIComponent(metadata.name)}&symbol=${encodeURIComponent(metadata.symbol)}&imgUrl=${encodeURIComponent(metadata.image)}`
    : fallbackImage;

  const url = `https://popme.fun/token/${addr}`;

  return (
    <NextHead>
      <title>{title}</title>
      <meta key="title" content={title} property="og:title" />
      <meta content={description} name="description" />
      <meta
        key="viewport"
        content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        name="viewport"
      />
      <link href="/favicon.ico" rel="icon" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteConfig.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:site" content="@popmefun" />
      <meta name="twitter:creator" content="@popmefun" />
    </NextHead>
  );
};