/** @type {import('next').NextConfig} */
// Updated: 2025-12-16 - Force Vercel deployment
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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