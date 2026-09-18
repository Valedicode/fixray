import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone testing goes through `cloudflared tunnel --url http://localhost:3000` (camera needs HTTPS).
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
