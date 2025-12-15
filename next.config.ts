import type { NextConfig } from "next";

console.log("----------------------------------------------------------------");
console.log("BUILD DEBUG: Checking Environment Variables");
console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists?", !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY length:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length);
  console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY start:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 5));
} else {
  console.log("CRITICAL: Key is MISSING in process.env");
}
console.log("----------------------------------------------------------------");

const nextConfig: NextConfig = {
  /* config options here */
  // output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // Force Webpack instead of Turbopack for better compatibility
  // webpack: (config, { isServer }) => {
  //   return config;
  // },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increased for document and FIT file uploads
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
