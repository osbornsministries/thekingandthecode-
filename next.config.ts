/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint during build (⚠ deprecated)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
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
};

module.exports = nextConfig;
