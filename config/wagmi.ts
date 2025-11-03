import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, okxWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { CHAINS_CONFIG } from "./chains";

const connectors = connectorsForWallets(
    [
        {
            groupName: "Recommended",
            wallets: [metaMaskWallet, okxWallet, injectedWallet],
        },
    ],
    {
        appName: "popme.fun",
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
    }
);

// 动态构建 transports 对象
const transports = CHAINS_CONFIG.SUPPORTED_CHAINS.reduce((acc, chain) => {
    const chainConfig = CHAINS_CONFIG.CHAIN_CONFIG[chain.id as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG];
    acc[chain.id] = http(chainConfig?.rpcUrl);
    return acc;
}, {} as Record<number, ReturnType<typeof http>>);

export const config = createConfig({
    chains: CHAINS_CONFIG.SUPPORTED_CHAINS,
    connectors,
    transports,
    ssr: false,
    multiInjectedProviderDiscovery: false,
});
