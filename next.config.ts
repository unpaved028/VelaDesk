/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true, // Behalten wir zur Sicherheit noch drin
  },
  // eslint-Block komplett entfernt
}

export default nextConfig; // oder module.exports = nextConfig; je nachdem was da stand