/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['avatars.githubusercontent.com', 'logo.clearbit.com'],
  },
}

module.exports = nextConfig
