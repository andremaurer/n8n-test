/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the Mac-app bundle small (no full node_modules).
  // Harmless for normal `next start` / dev.
  output: "standalone",
};

module.exports = nextConfig;
