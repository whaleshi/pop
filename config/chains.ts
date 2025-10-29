import { popchainTestnet, popchainMainnet, localNetwork } from "./net";
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
export const CHAINS_CONFIG = {
    // 默认链 - 修改这里即可切换整个应用的默认网络
    DEFAULT_CHAIN: popchainTestnet,

    // 支持的链列表 - 按优先级排序
    SUPPORTED_CHAINS: [popchainTestnet],

    // 链相关配置
    CHAIN_CONFIG: {
        // [7257]: {
        //     name: "Popchain",
        //     symbol: "POP",
        //     explorerUrl: "https://scan.popchain.ai/",
        //     rpcUrl: "https://rpc.popchain.ai",
        //     factoryContract: "0x86c64DA12DA5C7d1C4Ccd484A833ac32E675B2c2",
        // },
        [7257]: {
            name: "Popchain Testnet",
            symbol: "POP",
            explorerUrl: "https://popchaintest.cloud.blockscout.com/",
            rpcUrl: "https://testnet.popchain.ai/",
            factoryContract: "0x3dcFe3149c50DdC1E69358F4380512aC6e73D976",
        },
        // [31337]: {
        //     name: "Local Development",
        //     symbol: "ETH",
        //     explorerUrl: "http://localhost:3000", // 本地区块浏览器或占位符
        //     rpcUrl: "https://testnet.popchain.ai/",
        //     factoryContract: "0x86c64DA12DA5C7d1C4Ccd484A833ac32E675B2c2",
        // },
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

// Mint 相关配置
export const TRANSACTION_CONFIG = {
    INITIAL_PRICE: "1562500001464", // 初始价格
} as const;

// Multicall3 合约地址 (通用地址，大多数链都支持)
export const MULTICALL3_ADDRESS = "0xF743cAaE4A6Bdd248D99B0EEDA249a67F522Bbb5";
// 0xbd64A7c53c825655e83718805e8b747B3387ee95 pro 0xF743cAaE4A6Bdd248D99B0EEDA249a67F522Bbb5 dev
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
