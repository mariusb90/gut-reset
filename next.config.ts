import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  devIndicators: false,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.*.*',
    '*.local',
    '*.ts.net',
    '*.taile1bb54.ts.net',
  ],
};

export default nextConfig;
