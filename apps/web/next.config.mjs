import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isStandalone = process.env.DOCKER_BUILD === "1" || process.env.OUTPUT_STANDALONE === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: isStandalone ? "standalone" : undefined,
  outputFileTracingRoot: path.resolve(__dirname),
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
