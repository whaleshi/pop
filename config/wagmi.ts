import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { popchainTestnet, popchainMainnet, localNetwork } from "./net";

export const config = createConfig({
    chains: [localNetwork, popchainMainnet, popchainTestnet],
    connectors: [injected({ shimDisconnect: true })],
    transports: {
        [localNetwork.id]: http(),
        [popchainMainnet.id]: http(),
        [popchainTestnet.id]: http(),
    },
    ssr: false,
});
