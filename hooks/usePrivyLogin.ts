import { useLogin } from "@privy-io/react-auth";
import { switchChain } from "wagmi/actions";
import { bsc, bscTestnet } from "wagmi/chains";
import { config } from "@/wagmiConfig";
import { useAuthStore } from "@/stores/auth";

export default function usePrivyLogin() {
    const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
    const net = isProd ? bsc : bscTestnet;
    const { saveLoginState, address } = useAuthStore();

    const { login: loginCore } = useLogin({
        onComplete: ({ user, isNewUser, wasAlreadyAuthenticated, loginMethod, loginAccount }) => {
            console.log(user, isNewUser, wasAlreadyAuthenticated, loginMethod, loginAccount);
            // 保存登录状态到本地存储
            if (!address) {
                const accountAddress = (loginAccount as any)?.address || user.wallet?.address;
                saveLoginState(accountAddress, loginMethod || "unknown", loginAccount);
            }

            try {
                switchChain(config, { chainId: net.id }).catch(() => {});
            } catch {}
        },
        onError: (error) => {
            console.error("[Privy Login] ❌ Failed:", error);
        },
    });

    // 登录前：尽量将外部钱包切到 xLayer，以确保 SIWE 使用 xLayer 的 chainId
    const toLogin = async () => {
        const eth: any = typeof window !== "undefined" && (window as any).ethereum ? (window as any).ethereum : null;
        const hexChainId = `0x${net.id.toString(16)}`;
        if (eth?.request) {
            try {
                await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexChainId }] });
            } catch (err: any) {
                // 4902: 未添加该链，尝试添加
                if (err?.code === 4902 || (typeof err?.message === "string" && err.message.includes("4902"))) {
                    try {
                        const rpcUrls = (net as any).rpcUrls?.default?.http ?? [];
                        const blockExplorerUrls = [(net as any).blockExplorers?.default?.url].filter(Boolean);
                        await eth.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: hexChainId,
                                    chainName: (net as any).name ?? "BSC",
                                    nativeCurrency: (net as any).nativeCurrency ?? {
                                        name: "BNB",
                                        symbol: "BNB",
                                        decimals: 18,
                                    },
                                    rpcUrls,
                                    blockExplorerUrls,
                                },
                            ],
                        });
                    } catch {}
                }
            }
        }
        // 兜底再尝试一次通过 wagmi/actions 切链（若未连接会失败，忽略即可）
        try {
            await switchChain(config, { chainId: net.id });
        } catch {}

        return loginCore();
    };

    return { toLogin };
}
