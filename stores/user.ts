import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
    commonUser: any;
    setCommonUser: (user: any) => void;
    logout: () => void;
    // 首选展示的钱包地址（全地址，不截断）
    primaryAddress: string | null;
    setPrimaryAddress: (addr: string | null) => void;
    // 首页列表的选择状态
    homeListActive: number; // 0: 新创建, 1: 飙升, 2: 已开盘
    homeListPage: number; // 当前页码
    setHomeListActive: (idx: number) => void;
    setHomeListPage: (page: number) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            commonUser: {}, // 登陆后存储 info
            setCommonUser: (user) => set({ commonUser: user }),
            logout: () => set({ commonUser: {}, primaryAddress: null }),

            primaryAddress: null,
            setPrimaryAddress: (addr) => set({ primaryAddress: addr }),

            homeListActive: 0,
            homeListPage: 1,
            setHomeListActive: (idx) => set({ homeListActive: idx }),
            setHomeListPage: (page) => set({ homeListPage: page }),
        }),
        {
            name: "user-storage",
        }
    )
);
