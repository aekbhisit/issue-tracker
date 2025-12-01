/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/types', '@workspace/utils'],
  images: {
    domains: ['localhost'],
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
}

module.exports = nextConfig

