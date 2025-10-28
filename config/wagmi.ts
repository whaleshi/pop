import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, okxWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { popchainTestnet, popchainMainnet, localNetwork } from "./net";

const connectors = connectorsForWallets(
    [
        {
            groupName: "Recommended",
            wallets: [metaMaskWallet, okxWallet],
        },
    ],
    {
        appName: "popme.fun",
        projectId: "YOUR_PROJECT_ID",
    }
);

export const config = createConfig({
    chains: [popchainTestnet],
    connectors,
    transports: {
        // [localNetwork.id]: http(),
        // [popchainMainnet.id]: http(),
        [popchainTestnet.id]: http(),
    },
    ssr: false,
});
