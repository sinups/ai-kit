"use client";

import { createTheme, MantineProvider } from "@mantine/core";
import { useTheme } from "next-themes";

const theme = createTheme({
  fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  fontFamilyMonospace:
    'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

/** Keeps the Mantine color scheme in sync with the next-themes `.dark` class used by the docs shell */
export function MantineThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const scheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <MantineProvider theme={theme} forceColorScheme={scheme}>
      {children}
    </MantineProvider>
  );
}
