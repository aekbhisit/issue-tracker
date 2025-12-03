/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: basePath removed to avoid /admin/admin/ double prefix issue
  // With basePath='/admin' + app/admin/ folder structure, Next.js creates /admin/admin/ routes
  // Instead, we handle /admin prefix in Nginx and use assetPrefix for static assets
  // RSC requests are handled by Nginx referer-based routing
  // Images use rewrites to /admin/_next/image
  assetPrefix: process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin',
  transpilePackages: ['@workspace/types', '@workspace/utils'],
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
      // NOTE: Without basePath, Next.js generates root-relative URLs
      // RSC requests like /issues?_rsc=... are handled by Nginx (referer-based routing)
      // Images like /_next/image?url=... are handled by Nginx location blocks
      // For local dev, we rewrite /admin/images/ to /images/
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
