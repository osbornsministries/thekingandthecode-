/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  productionBrowserSourceMaps: false, // disable source maps in prod

  devIndicators: {
    buildActivity: false,
  },

  // Disable ESLint during build (⚠ deprecated)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
    domains: ['yourdomain.com', 'www.yourdomain.com'], // add your image domains if any
  },

  trailingSlash: true,

  async redirects() {
    return [
      {
        source: "/ticket",
        destination: "/tickets",
        permanent: true,
      },
      {
        source: "/ticket/:path*",
        destination: "/tickets/:path*",
        permanent: true,
      },
    ];
  },

  // Trust host headers for proxies (helps with NextAuth domain)
  experimental: {
    trustHostHeader: true,
  },

  // Optional: Headers for cookies or security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://thekingandthecode.com', 
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
