/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: basePath removed to avoid /admin/admin/ double prefix issue
  // With app/admin/ folder structure, Next.js creates routes at /admin/* (from folder name)
  // If we add basePath='/admin', it creates /admin/admin/* routes (double prefix)
  // RSC requests will be root-relative, but Nginx smart routing handles them based on referer
  // assetPrefix is kept for static assets only (doesn't affect routes)
  assetPrefix: process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin',
  transpilePackages: ['@workspace/types', '@workspace/utils'],
  
  // Performance optimizations for dev mode
  // Use SWC compiler (faster than Babel)
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@workspace/types', '@workspace/utils', 'react-i18next'],
  },
  
  // Compiler options
  compiler: {
    // Remove console.log in production (optional, can help with bundle size)
    // removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4501',
        pathname: '/storage/**',
      },
    ],
  },
  async rewrites() {
    // Always rewrite storage paths to API server
    // In production, use relative URL (nginx will proxy)
    // In development, use environment variable or default to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4501')
    
    const rewrites = [
      {
        source: '/storage/:path*',
        destination: apiUrl ? `${apiUrl}/storage/:path*` : '/storage/:path*'
      },
      // NOTE: No rewrites needed for routes!
      // With app/admin/ folder structure, Next.js creates routes at /admin/* (from folder name)
      // All code uses explicit /admin paths, so routes match directly
      // 
      // Rewrite /admin/images/ to /images/ for local dev (Nginx handles this in production)
      {
        source: '/admin/images/:path*',
        destination: '/images/:path*'
      }
    ]
    
    // NOTE: Removed route rewrites that created /admin/admin/ paths
    // With basePath removed, Next.js serves routes directly from app/admin/ folder
    // Nginx handles /admin prefix, so /admin/dashboard works correctly
    
    return rewrites
  },
  async headers() {
    return [
      {
        source: '/storage/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  webpack: (config) => {
    // SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

module.exports = nextConfig
