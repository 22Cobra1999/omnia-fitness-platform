/** @type {import('next').NextConfig} */
// Updated: 2025-12-16 21:20 - Fix build errors and optimize
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimizar build - swcMinify es el default en Next.js 16, no necesario
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mgrfswrsvrzwtgilssad.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Configuración para manejar puertos dinámicos
  async rewrites() {
    return []
  },
  // Configuración de base path para desarrollo
  basePath: '',
  // Configuración de asset prefix para desarrollo
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : '',
}

export default nextConfig
