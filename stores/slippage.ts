import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SlippageState {
    slippage: number;
    setSlippage: (slippage: number) => void;
    getSlippageMultiplier: () => number;
}

export const useSlippageStore = create<SlippageState>()(
    persist(
        (set, get) => ({
            slippage: 20, // 默认3%滑点
            setSlippage: (slippage: number) => set({ slippage }),
            getSlippageMultiplier: () => {
                const { slippage } = get();
                return (100 - slippage) / 100; // 用于计算最小输出
            },
        }),
        {
            name: "slippage-storage", // localStorage key
        }
    )
);
