/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/types', '@workspace/utils'],
  images: {
    domains: ['localhost'],
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
}

module.exports = nextConfig

