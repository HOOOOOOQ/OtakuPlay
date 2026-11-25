import type { NextConfig } from 'next';

const backendOrigin = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
