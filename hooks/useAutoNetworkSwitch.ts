import { useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN_ID } from '@/config/chains';

interface UseAutoNetworkSwitchProps {
    enabled?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export const useAutoNetworkSwitch = ({
    enabled = true,
    onSuccess,
    onError
}: UseAutoNetworkSwitchProps = {}) => {
    const { chain, isConnected } = useAccount();
    const { switchChain, isPending } = useSwitchChain();

    useEffect(() => {
        if (!enabled || !isConnected || !chain || !switchChain) return;

        const isWrongNetwork = chain.id !== DEFAULT_CHAIN_ID;
        
        if (isWrongNetwork) {
            const switchNetwork = async () => {
                try {
                    await switchChain({ chainId: DEFAULT_CHAIN_ID });
                    onSuccess?.();
                } catch (error) {
                    console.error('Auto network switch failed:', error);
                    onError?.(error as Error);
                }
            };

            const timer = setTimeout(switchNetwork, 1000);
            return () => clearTimeout(timer);
        }
    }, [chain?.id, isConnected, enabled, switchChain, onSuccess, onError]);

    return {
        isPending,
        isWrongNetwork: isConnected && chain && chain.id !== DEFAULT_CHAIN_ID,
        currentChainId: chain?.id,
        expectedChainId: DEFAULT_CHAIN_ID,
    };
};