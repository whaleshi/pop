import { createConfig, http } from "wagmi";
import { CHAINS_CONFIG } from "@/config/chains";

export const config = createConfig({
    chains: CHAINS_CONFIG.SUPPORTED_CHAINS,
    transports: CHAINS_CONFIG.SUPPORTED_CHAINS.reduce((acc, chain) => {
        const chainConfig = CHAINS_CONFIG.CHAIN_CONFIG[chain.id as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG];
        const rpcUrl = chainConfig?.rpcUrl;
        acc[chain.id] = rpcUrl ? http(rpcUrl) : http();
        return acc;
    }, {} as Record<number, ReturnType<typeof http>>),
});
