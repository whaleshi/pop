import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
    isLoggedIn: boolean;
    address: string | null;
    loginMethod: string | null;
    loginAccount: any;
    timestamp: number | null;

    // Actions
    saveLoginState: (address: string, loginMethod: string, loginAccount?: any) => void;
    clearAuthState: () => void;
    isValidLogin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            address: null,
            loginMethod: null,
            loginAccount: null,
            timestamp: null,

            saveLoginState: (address: string, loginMethod: string, loginAccount?: any) => {
                set({
                    isLoggedIn: true,
                    address,
                    loginMethod,
                    loginAccount: loginMethod === "twitter" ? loginAccount || null : null,
                    timestamp: Date.now(),
                });
            },

            clearAuthState: () => {
                set({
                    isLoggedIn: false,
                    address: null,
                    loginMethod: null,
                    loginAccount: null,
                    timestamp: null,
                });
            },

            isValidLogin: () => {
                const state = get();
                return !!(state.isLoggedIn && state.address && state.timestamp);
            },
        }),
        {
            name: "auth-storage",
        }
    )
);
