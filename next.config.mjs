import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // 只把裸导入 `three` 指到单文件；不要用目录别名，否则会破坏 package exports（如 `three/tsl` → three.webgpu）
    config.resolve.alias = {
      ...config.resolve.alias,
      three$: path.resolve(__dirname, "node_modules/three/build/three.module.js"),
    }
    return config
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '**.fal.ai',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'museaiwrite.eduhk.hk',
      },
      {
        protocol: 'https',
        hostname: 'museaiwrite.eduhk.hk',
      },
      {
        protocol: 'https',
        hostname: 'ark-acg-cn-beijing.tos-cn-beijing.volces.com',
      },
    ],
  },
}

export default nextConfig
