import localFont from "next/font/local";

export const fontSans = localFont({
    src: [
        {
            path: "../public/fonts/HarmonyOS_Sans_SC_Regular.ttf",
            weight: "500",
        },
        {
            path: "../public/fonts/HarmonyOS_Sans_SC_Medium.ttf",
            weight: "600",
        },
        {
            path: "../public/fonts/HarmonyOS_Sans_SC_Bold.ttf",
            weight: "700",
        },
    ],
    variable: "--font-sans",
    display: "swap",
    adjustFontFallback: false,
    weight: "500",
});
