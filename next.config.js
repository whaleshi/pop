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

  // 修复 CommonJS 模块兼容性问题
  transpilePackages: ['@vanilla-extract/sprinkles'],

  // 将这些包标记为外部包，避免打包
  serverComponentsExternalPackages: ['@vanilla-extract/sprinkles'],

  // 使用 webpack 配置强制 ESM 兼容
  webpack: (config, { isServer }) => {
    // 处理 CommonJS 模块
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };

    return config;
  },
}

module.exports = nextConfig
