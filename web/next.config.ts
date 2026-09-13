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
};

export default nextConfig;