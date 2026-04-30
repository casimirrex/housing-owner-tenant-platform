/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.example.com"
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com"
      }
    ]
  },
  output: "standalone",
  reactStrictMode: true
};

export default nextConfig;
