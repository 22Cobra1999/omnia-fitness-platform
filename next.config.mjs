/** @type {import('next').NextConfig} */
// Updated: 2025-12-16 21:15 - Optimize build performance
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimizar build
  swcMinify: true,
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
