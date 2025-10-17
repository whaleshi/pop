import { bsc, bscTestnet } from "wagmi/chains";
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
export const CHAINS_CONFIG = {
    // 默认链 - 修改这里即可切换整个应用的默认网络
    DEFAULT_CHAIN: isProd ? bsc : bsc,

    // 支持的链列表 - 按优先级排序
    SUPPORTED_CHAINS: [bsc, bscTestnet, bsc],

    // 链相关配置
    CHAIN_CONFIG: {
        [97]: {
            name: "BNB Smart Chain Testnet",
            symbol: "tBNB",
            explorerUrl: "https://testnet.bscscan.com",
            rpcUrl: "https://delicate-old-breeze.bsc-testnet.quiknode.pro/4e8edc72f64856f8e8fa3377a81c9f3a1f6b5dee/",
            factoryContract: "0xc855D67921359dc2852656A264f07F86c39320d1",
        },
        [56]: {
            name: "BNB Smart Chain",
            symbol: "BNB",
            explorerUrl: "https://bscscan.com",
            rpcUrl: "https://silent-few-meme.bsc.quiknode.pro/ee75800d48bd6244538a996a18a836a986e0add9/",
            factoryContract: "0x2e611CCBc67B007a894b4276De89663df442fE56",
        },
        [196]: {
            name: "X Layer Mainnet",
            symbol: "OKB",
            explorerUrl: "https://www.oklink.com/xlayer",
            rpcUrl: "https://rpc.xlayer.tech",
            factoryContract: "0x3c609DACA9867309b3170d109486f37EBaE0B6a6",
        },
    },
} as const;

// 导出常用的配置
export const DEFAULT_CHAIN_ID = CHAINS_CONFIG.DEFAULT_CHAIN.id;
export const DEFAULT_CHAIN_CONFIG = CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG];

// 合约地址配置
export const CONTRACT_CONFIG = {
    // 工厂合约地址 - 用于创建新代币
    FACTORY_CONTRACT: CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG].factoryContract,
} as const;

// Mint/Refund 相关配置
export const TRANSACTION_CONFIG = {
    MINT_FEE: "0.12", // ETH/BNB/OKB 等
    REFUND_FEE: "0.02",
    MINT_TARGET: 800, // 目标mint次数
} as const;

// Multicall3 合约地址 (通用地址，大多数链都支持)
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI
export const MULTICALL3_ABI = [
    {
        inputs: [
            {
                components: [
                    { internalType: "address", name: "target", type: "address" },
                    { internalType: "bool", name: "allowFailure", type: "bool" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Call3[]",
                name: "calls",
                type: "tuple[]",
            },
        ],
        name: "aggregate3",
        outputs: [
            {
                components: [
                    { internalType: "bool", name: "success", type: "bool" },
                    { internalType: "bytes", name: "returnData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Result[]",
                name: "returnData",
                type: "tuple[]",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
];
