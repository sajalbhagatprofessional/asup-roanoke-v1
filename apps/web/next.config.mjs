/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const apiBase = process.env.FASTAPI_URL || (process.env.NODE_ENV === "production" ? "http://argus-api:8000" : "http://127.0.0.1:8000");
    return [
      {
        source: "/v1/:path*",
        destination: `${apiBase}/v1/:path*`,
      },
      {
        source: "/v2/:path*",
        destination: `${apiBase}/v2/:path*`,
      },
    ];
  },
};

export default nextConfig;
