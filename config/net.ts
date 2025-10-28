import { defineChain } from "viem";

// Popchain 测试网配置
export const popchainTestnet = defineChain({
    id: 7257,
    name: "Popchain Testnet",
    nativeCurrency: {
        decimals: 18,
        name: "POP",
        symbol: "POP",
    },
    rpcUrls: {
        default: {
            http: ["http://47.76.179.249:8545"],
        },
    },
    blockExplorers: {
        default: {
            name: "Popchain Testnet Explorer",
            url: "https://popchaintest.cloud.blockscout.com/",
        },
    },
    testnet: true,
});

// Popchain 主网配置
export const popchainMainnet = defineChain({
    id: 7257,
    name: "Popchain",
    nativeCurrency: {
        decimals: 18,
        name: "POP",
        symbol: "POP",
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.popchain.ai", "https://r.popchain.ai"],
        },
    },
    blockExplorers: {
        default: {
            name: "Popchain Explorer",
            url: "https://scan.popchain.ai/",
        },
    },
    testnet: false,
});

// 本地开发网络配置
export const localNetwork = defineChain({
    id: 31337,
    name: "Local Development",
    nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["http://47.76.179.249:8545"],
        },
    },
    testnet: true,
});

// 导出网络配置
export const POPCHAIN_NETWORKS = {
    testnet: popchainTestnet,
    mainnet: popchainMainnet,
    local: localNetwork,
} as const;
