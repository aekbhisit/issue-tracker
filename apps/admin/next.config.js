/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: basePath removed - Nginx handles /admin prefix instead
  // This prevents /admin/admin/ double prefix issue
  // Next.js serves at root, Nginx proxies /admin/* to Next.js
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
      // Rewrite /admin/images/ to /images/ for local dev
      // In production, Nginx handles this routing
      // This allows the same code to work in both dev and prod
      {
        source: '/admin/images/:path*',
        destination: '/images/:path*'
      }
      // NOTE: No rewrites needed for collector.min.js
      // Without basePath, these files are served directly from public/ folder
      // Nginx handles /admin/collector.min.js routing in production
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
