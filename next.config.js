/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const nextConfig = {
  reactStrictMode: true,
  compiler: isProd
    ? {
      // 在生产构建时移除 console 调用（保留 error/warn）
      removeConsole: { exclude: ["error", "warn"] },
    }
    : undefined,

  // 修复 CommonJS 模块兼容性问题 - 转译这些包
  transpilePackages: [
    '@vanilla-extract/sprinkles',
    '@vanilla-extract/css',
    '@rainbow-me/rainbowkit',
    '@heroui/react',
    '@heroui/system',
    '@heroui/theme',
  ],

  // 使用 webpack 配置强制 ESM 兼容
  webpack: (config, { isServer }) => {
    // 处理 CommonJS 模块的命名导出问题
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };

    // 添加 fallback 配置处理服务端模块
    if (isServer) {
      config.externals = [...(config.externals || [])];
    }

    return config;
  },

  // Vercel 部署优化
  experimental: {
    // 优化打包
    optimizePackageImports: ['@heroui/react', '@rainbow-me/rainbowkit'],
  },
}

module.exports = nextConfig
