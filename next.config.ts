/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Zwingend erforderlich für unser Dockerfile
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}
module.exports = nextConfig