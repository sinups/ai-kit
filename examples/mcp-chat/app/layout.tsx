import '@mantine/core/styles.css';
import '@sinups/ai-kit/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { AiKitProvider } from '@sinups/ai-kit';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ai-kit · chat over MCP',
  description: 'Chat with an MCP server rendered with @sinups/ai-kit',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <AiKitProvider>{children}</AiKitProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
