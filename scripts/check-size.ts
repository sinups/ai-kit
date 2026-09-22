import path from 'node:path';
import { gzipSync } from 'node:zlib';
import fs from 'fs-extra';
import signale from 'signale';
import { build, type Plugin } from 'esbuild';

const distDir = path.join(process.cwd(), 'package/dist');
const entry = path.join(distDir, 'esm/index.mjs');
const reportPath = path.join(process.cwd(), 'site/app/data/bundle-size.json');

const namedImportBudgets: Record<string, number> = {
  AgentChat: 96_000,
  MessageList: 79_500,
  InputBar: 36_000,
  Markdown: 16_000,
  BashTool: 14_600,
  DiffReview: 23_800,
  McpSettingsPanel: 27_500,
  SettingsLayout: 5_000,
  CommandPalette: 6_500,
  Wizard: 6_300,
  ChatLauncher: 8_400,
  LauncherActions: 3_300,
  AiKitProvider: 9_600,
  mountChatLauncher: 900,
  MessageActionButton: 2_000,
  MarkdownLinksProvider: 1_900,
  MediaPart: 8_900,
  ArtifactPanel: 4_000,
  ArtifactCard: 4_600,
  FileAttachment: 8_000,
  filterFiles: 450,
  useFileIntake: 850,
  ChatDropZone: 4_150,
  CommandToggles: 2_500,
  StarterCategories: 3_100,
  MicButton: 5_100,
  VoiceLevel: 2_600,
  SpeakingIndicator: 4_450,
};

type Entry = { name: string; source: string; stylesheets: string[]; gzipBudget: number };

function stylesheetsFor(name: string) {
  const file = path.join('styles', `${name}.css`);
  return fs.existsSync(path.join(distDir, file)) ? ['styles/base.css', file] : [];
}

const entries: Entry[] = [
  ...Object.entries(namedImportBudgets).map(([name, gzipBudget]) => ({
    name,
    source: `import { ${name} } from '@sinups/ai-kit'; console.log(${name});`,
    stylesheets: stylesheetsFor(name),
    gzipBudget,
  })),
  {
    name: 'import *',
    source: "import * as kit from '@sinups/ai-kit'; console.log(kit);",
    stylesheets: ['styles.css'],
    gzipBudget: 236_000,
  },
];

const resolveKit: Plugin = {
  name: 'resolve-kit',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@sinups\/ai-kit$/ }, () => ({ path: entry }));
  },
};

const gzipSize = (content: Uint8Array | Buffer) => gzipSync(content, { level: 9 }).length;

async function measureJs(source: string) {
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
  return { minified: code.length, gzip: gzipSize(code) };
}

function measureCss(stylesheets: string[]) {
  return stylesheets.reduce(
    (total, file) => {
      const content = fs.readFileSync(path.join(distDir, file));
      return { raw: total.raw + content.length, gzip: total.gzip + gzipSize(content) };
    },
    { raw: 0, gzip: 0 }
  );
}

const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} KB`;

const embedBundle = path.join(distDir, 'embed/widget.js');
const EMBED_BUDGET = 11_000;

function measureEmbed(): { gzip: number } | null {
  return fs.existsSync(embedBundle)
    ? { gzip: gzipSync(fs.readFileSync(embedBundle)).length }
    : null;
}

async function main() {
  if (!fs.existsSync(entry)) {
    signale.error('package/dist not found. Run `yarn build` first.');
    process.exit(1);
  }

  let failed = false;
  const report = [];

  for (const item of entries) {
    const js = await measureJs(item.source);
    const css = measureCss(item.stylesheets);
    const total = js.gzip + css.gzip;
    report.push({
      name: item.name,
      stylesheets: item.stylesheets,
      jsGzip: js.gzip,
      cssGzip: css.gzip,
      totalGzip: total,
    });

    const line = `${item.name}: JS ${kb(js.gzip)} + CSS ${kb(css.gzip)} = ${kb(total)} gzip (budget ${kb(item.gzipBudget)})`;
    if (total > item.gzipBudget) {
      failed = true;
      signale.error(line);
    } else {
      signale.success(line);
    }
  }

  const embed = measureEmbed();
  if (embed) {
    const line = `embed widget.js: ${kb(embed.gzip)} gzip (budget ${kb(EMBED_BUDGET)})`;
    report.push({
      name: 'embed widget.js',
      stylesheets: [],
      jsGzip: embed.gzip,
      cssGzip: 0,
      totalGzip: embed.gzip,
    });
    if (embed.gzip > EMBED_BUDGET) {
      failed = true;
      signale.error(line);
    } else {
      signale.success(line);
    }
  }

  if (process.argv.includes('--json')) {
    fs.writeJsonSync(reportPath, report, { spaces: 2 });
    signale.info(`Wrote ${path.relative(process.cwd(), reportPath)}`);
  }

  if (failed) {
    signale.error(
      'Bundle size budget exceeded. Check what the entry pulls in, or raise the budget in scripts/check-size.ts if the growth is intended.'
    );
    process.exit(1);
  }
}

main();
