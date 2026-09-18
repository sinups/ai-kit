import type { NextConfig } from 'next';

const devOrigins = (process.env.DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@anthropic-ai/claude-agent-sdk'],
  allowedDevOrigins: devOrigins,
  turbopack: {
    resolveAlias: {
      react: './node_modules/react',
      'react-dom': './node_modules/react-dom',
      '@mantine/core': './node_modules/@mantine/core',
      '@mantine/hooks': './node_modules/@mantine/hooks',
      '@tabler/icons-react': './node_modules/@tabler/icons-react',
    },
  },
};

export default nextConfig;
