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
}

module.exports = nextConfig
