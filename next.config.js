/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ Remove or comment this out
  // output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
