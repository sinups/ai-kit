import type { NextConfig } from 'next';

const devOrigins = (process.env.DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@anthropic-ai/claude-agent-sdk'],
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
