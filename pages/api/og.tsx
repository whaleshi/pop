import { ImageResponse } from '@vercel/og';
import type { NextRequest } from "next/server";

export const config = {
    runtime: 'edge',
};

// 缓存字体数据，避免重复加载
let fontCache: ArrayBuffer | null = null;

async function getFontData(fontUrl: string): Promise<ArrayBuffer> {
    if (fontCache) {
        return fontCache;
    }

    try {
        const response = await fetch(fontUrl);
        if (!response.ok) {
            throw new Error(`Failed to load font: ${response.status}`);
        }
        fontCache = await response.arrayBuffer();
        return fontCache;
    } catch (error) {
        console.error('Font loading error:', error);
        return new ArrayBuffer(0);
    }
}

export default async function handler(request: NextRequest) {
    // 通过缓存机制加载字体
    const fontBoldUrl = `${request.nextUrl.origin}/fonts/HarmonyOS_Sans_SC_Bold.ttf`;
    const fontBoldData = await getFontData(fontBoldUrl);
    const { searchParams } = request.nextUrl;
    const tokenImg = searchParams.get("imgUrl");
    const tokenSymbol = searchParams.get("symbol");
    const tokenName = searchParams.get("name");
    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'black',
                }}
            >
                <div tw="flex w-full h-full">
                    <div tw="h-[630px] w-[1200px] flex flex-col relative">
                        <img tw="absolute" src="https://newgame.mypinata.cloud/ipfs/bafkreihptlxdw3suqrdbbprhanm645z7p4u6pansso6en6xkyuvhgtklpu" width={1200} height={630} alt="bg" />
                        <div tw="text-[88px] text-[#24232A] font-extrabold pt-[228px] pl-[96px] relative" style={{ fontFamily: 'HarmonyOS Sans SC' }}>{tokenSymbol}</div>
                        <div tw="text-[44px] text-[#94989F] pt-[10px] pl-[96px] relative font-extralight" style={{ fontFamily: 'HarmonyOS Sans SC' }}>{tokenName}</div>
                        <img tw="absolute top-[156px] right-[96px] rounded-[72px]" src={tokenImg as string} width={320} height={320} alt="logo" />
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'HarmonyOS Sans SC',
                    data: fontBoldData,
                    style: 'normal',
                    weight: 700,
                },
            ],
        }
    );
}

