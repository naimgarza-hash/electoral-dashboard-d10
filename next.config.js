/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet needs to be transpiled
  transpilePackages: ['leaflet', 'react-leaflet'],
}

module.exports = nextConfig
