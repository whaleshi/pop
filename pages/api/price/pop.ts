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
    // 尝试多个数据源，提高成功率
    const sources = [
      // 直接访问
      'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/lite?id=38403',
      // 通过公共代理访问
      'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/lite?id=38403'),
    ];

    let lastError: any = null;

    for (const url of sources) {
      try {
        const isProxy = url.includes('allorigins');
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5秒超时
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();

        // 如果使用了代理，需要解析 contents
        if (isProxy) {
          data = JSON.parse(data.contents);
        }

        const price = data?.data?.statistics?.price;

        if (typeof price === 'number') {
          // 更新缓存
          cachedPrice = price;
          lastFetchTime = now;

          return res.status(200).json({
            success: true,
            price: price,
          });
        }
      } catch (error) {
        lastError = error;
        console.error(`Failed to fetch from ${url}:`, error);
        continue; // 尝试下一个源
      }
    }

    // 所有源都失败了
    throw lastError || new Error('All sources failed');
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