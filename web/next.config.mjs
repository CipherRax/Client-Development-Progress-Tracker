// Next.js configuration for the Trackly web app.
//
// Plain .mjs (not TypeScript) so the production server (next start) can load
// it without requiring the typescript package at runtime.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The public dashboard runs entirely client-side once tokens are validated;
  // we keep all data fetching on the client and never send the client-access
  // token to any server component or external origin.
  images: {
    unoptimized: true,
  },
  // In production the Next.js server and the NestJS API run side by side in
  // the same container. The frontend talks to the API through the same origin
  // and Next proxies /api/* to the backend service (BACKEND_INTERNAL_URL).
  async rewrites() {
    const backend = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:3000';
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;