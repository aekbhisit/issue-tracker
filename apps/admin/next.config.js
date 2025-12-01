/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Base path for serving the app at /admin subpath
  // This ensures all routes and static assets are prefixed with /admin
  basePath: process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin',
  // Asset prefix for static assets (CSS, JS, fonts, etc.)
  // This ensures _next/static files are served from /admin/_next/static
  assetPrefix: process.env.NEXT_PUBLIC_ADMIN_ASSET_PREFIX || '/admin',
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
    return [
      {
        source: '/storage/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4501'}/storage/:path*`
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
