import { useAccount, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN_ID } from '@/config/chains';

export const useNetworkSwitcher = () => {
    const { chain, isConnected } = useAccount();
    const { switchChain, isPending } = useSwitchChain();

    const switchToCorrectNetwork = async () => {
        if (!switchChain) return;

        try {
            await switchChain({ chainId: DEFAULT_CHAIN_ID });
        } catch (error) {
            console.error('Network switch failed:', error);
        }
    };

    return {
        isCorrectNetwork: isConnected && chain && chain.id === DEFAULT_CHAIN_ID,
        switchToCorrectNetwork,
        isPending,
        currentChainId: chain?.id,
        expectedChainId: DEFAULT_CHAIN_ID,
        isConnected,
    };
};