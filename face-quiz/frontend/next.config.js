/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
      {
        source: '/celebrities/:path*',
        destination: 'http://localhost:8001/celebrities/:path*',
      },
    ]
  },
}

module.exports = nextConfig
