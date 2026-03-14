import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@recipe-tracker/ui', '@recipe-tracker/types'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
