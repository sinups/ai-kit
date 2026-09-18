import '@mantine/core/styles.css';
import '@sinups/ai-kit/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { AiKitProvider } from '@sinups/ai-kit';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LocaleProvider } from './i18n/locale';
import { requestLocale } from './i18n/server';

export const metadata: Metadata = {
  title: 'ai-kit · chat over MCP',
  description: 'Chat with an MCP server rendered with @sinups/ai-kit',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await requestLocale();
  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <AiKitProvider>
            <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
          </AiKitProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
