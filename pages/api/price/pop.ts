import type { NextApiRequest, NextApiResponse } from 'next';

type PopPriceResponse = {
  success: boolean;
  price?: number;
  error?: string;
};

// 缓存变量
let cachedPrice: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 1分钟缓存

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PopPriceResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const now = Date.now();
  
  // 如果有缓存且未过期，直接返回缓存
  if (cachedPrice !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return res.status(200).json({
      success: true,
      price: cachedPrice,
    });
  }

  try {
    const response = await fetch('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/lite?id=38403', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const price = data?.data?.statistics?.price;

    if (typeof price !== 'number') {
      throw new Error('Invalid price data received');
    }

    // 更新缓存
    cachedPrice = price;
    lastFetchTime = now;

    res.status(200).json({
      success: true,
      price: price,
    });
  } catch (error) {
    console.error('Failed to fetch POP price:', error);
    
    // 如果有缓存价格，返回缓存价格而不是错误
    if (cachedPrice !== null) {
      return res.status(200).json({
        success: true,
        price: cachedPrice,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data',
    });
  }
}