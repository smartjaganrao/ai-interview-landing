/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Exposed to both server and client. Update LATEST_RELEASE_TAG in Vercel
    // env vars on each release — no code deploy needed.
    NEXT_PUBLIC_APP_VERSION: process.env.LATEST_RELEASE_TAG ?? 'v1.3.4',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
