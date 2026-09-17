import path from 'node:path';
import { gzipSync } from 'node:zlib';
import fs from 'fs-extra';
import signale from 'signale';
import { build, type Plugin } from 'esbuild';

const entry = path.join(process.cwd(), 'package/dist/esm/index.mjs');

const budgets: { name: string; source: string; gzipBudget: number }[] = [
  {
    name: 'AgentChat',
    source: "import { AgentChat } from '@sinups/ai-kit'; console.log(AgentChat);",
    gzipBudget: 73_500,
  },
  {
    name: 'Wizard',
    source: "import { Wizard } from '@sinups/ai-kit'; console.log(Wizard);",
    gzipBudget: 4_500,
  },
  {
    name: 'ChatLauncher',
    source: "import { ChatLauncher } from '@sinups/ai-kit'; console.log(ChatLauncher);",
    gzipBudget: 3_900,
  },
  {
    name: 'AiKitProvider',
    source: "import { AiKitProvider } from '@sinups/ai-kit'; console.log(AiKitProvider);",
    gzipBudget: 6_100,
  },
  {
    name: 'import *',
    source: "import * as kit from '@sinups/ai-kit'; console.log(kit);",
    gzipBudget: 197_500,
  },
];

const resolveKit: Plugin = {
  name: 'resolve-kit',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@sinups\/ai-kit$/ }, () => ({ path: entry }));
  },
};

async function measure(source: string) {
  const result = await build({
    stdin: { contents: source, resolveDir: process.cwd(), loader: 'js' },
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    logLevel: 'error',
    external: ['react', 'react/*', 'react-dom', 'react-dom/*', '@mantine/*'],
    plugins: [resolveKit],
  });
  const code = result.outputFiles[0].contents;
  return { minified: code.length, gzip: gzipSync(code, { level: 9 }).length };
}

const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} KB`;

async function main() {
  if (!fs.existsSync(entry)) {
    signale.error('package/dist not found. Run `yarn build` first.');
    process.exit(1);
  }

  let failed = false;

  for (const budget of budgets) {
    const { minified, gzip } = await measure(budget.source);
    const line = `${budget.name}: ${kb(minified)} minified, ${kb(gzip)} gzip (budget ${kb(budget.gzipBudget)})`;

    if (gzip > budget.gzipBudget) {
      failed = true;
      signale.error(line);
    } else {
      signale.success(line);
    }
  }

  if (failed) {
    signale.error(
      'Bundle size budget exceeded. Check what the entry pulls in, or raise the budget in scripts/check-size.ts if the growth is intended.'
    );
    process.exit(1);
  }
}

main();
