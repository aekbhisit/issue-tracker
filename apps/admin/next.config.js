/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use basePath to ensure both routes and static assets use /admin prefix
  // This is required because Next.js generates static assets relative to basePath
  // Without basePath, assets are generated as /_next/static/... instead of /admin/_next/static/...
  basePath: process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin',
  // assetPrefix is deprecated when using basePath - basePath handles both routes and assets
  // Keep assetPrefix for backward compatibility if needed, but basePath takes precedence
  assetPrefix: process.env.NEXT_PUBLIC_ADMIN_ASSET_PREFIX || process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin',
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
    
    return [
      {
        source: '/storage/:path*',
        destination: apiUrl ? `${apiUrl}/storage/:path*` : '/storage/:path*'
      }
    ]
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
