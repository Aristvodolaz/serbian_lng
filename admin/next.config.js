/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/admin/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
