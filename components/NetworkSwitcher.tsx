import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN_ID, CHAINS_CONFIG } from '@/config/chains';
import { useTranslation } from 'react-i18next';

export const NetworkSwitcher = () => {
    const { t } = useTranslation('common');
    const { chain, isConnected } = useAccount();
    const { switchChain, isPending } = useSwitchChain();
    const [showModal, setShowModal] = useState(false);

    const expectedChain = CHAINS_CONFIG.SUPPORTED_CHAINS.find(c => c.id === DEFAULT_CHAIN_ID);
    const isWrongNetwork = isConnected && (!chain || chain.id !== DEFAULT_CHAIN_ID);

    const handleSwitchNetwork = async () => {
        if (!switchChain || !expectedChain) return;

        try {
            await switchChain({ chainId: DEFAULT_CHAIN_ID });
        } catch (error) {
            console.error('Network switch failed:', error);
        }
    };

    useEffect(() => {
        console.log('NetworkSwitcher - Chain changed:', {
            isConnected,
            chainId: chain?.id,
            expectedChainId: DEFAULT_CHAIN_ID,
            isWrongNetwork,
            chainName: chain?.name
        });

        if (isWrongNetwork) {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [chain?.id, isConnected, isWrongNetwork]);

    if (!showModal || !isWrongNetwork) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-[#1A1A1A] border border-[#333] rounded-[20px] p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                    {/* 图标 */}
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.118 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>

                    {/* 标题 */}
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {t('network.error')}
                    </h2>

                    {/* 描述 */}
                    <p className="text-[#AAAAAA] mb-6 leading-relaxed">
                        {chain?.name && (
                            <>
                                {t('network.currentNetwork')}: <span className="text-red-400">{chain.name}</span>
                                <br />
                            </>
                        )}
                        {t('network.switchTo', { networkName: expectedChain?.name })}
                    </p>

                    {/* 按钮 */}
                    <button
                        onClick={handleSwitchNetwork}
                        disabled={isPending}
                        className="w-full bg-[#9AED2D] hover:bg-[#7ED321] disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium py-3 px-6 rounded-[16px] transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                {t('network.switching')}
                            </>
                        ) : (
                            t('network.switchNetwork')
                        )}
                    </button>

                    {/* 提示文字 */}
                    <p className="text-xs text-[#666] mt-4">
                        {t('network.modalNote')}
                    </p>
                </div>
            </div>
        </div>
    );
};