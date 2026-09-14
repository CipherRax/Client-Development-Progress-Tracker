// Next.js 15 configuration for the Trackly web app.
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The public dashboard runs entirely client-side once tokens are validated;
  // we keep all data fetching on the client and never send the client-access
  // token to any server component or external origin.
  images: {
    unoptimized: true,
  },
  // Self-contained server so the whole app can ship in a single Docker image.
  output: 'standalone',
  // In production the Next.js server and the NestJS API run side by side in
  // the same container. The frontend talks to the API through the same origin
  // and Next proxies /api/* to the backend service (BACKEND_INTERNAL_URL).
  async rewrites() {
    const backend = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:3000';
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;