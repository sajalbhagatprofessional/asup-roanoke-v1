/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const apiBase = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/v1/:path*",
        destination: `${apiBase}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
