import fs from 'fs-extra';
import signale from 'signale';
import path from 'node:path';
import postcss from 'postcss';
import cssnano from 'cssnano';

const distDir = path.join(process.cwd(), 'package/dist');
const esmDir = path.join(distDir, 'esm');
const stylesDir = path.join(distDir, 'styles');
const rollupCssFilePath = path.join(esmDir, 'index.css');
const cssModulesManifest = path.join(process.cwd(), 'node_modules/.cache/ai-kit/css-modules.json');
const BASE_MODULE = 'styles/vars.module.css';

const importPattern =
  /(?:^|\n)\s*(?:import|export)\s(?:[^'";]*?\sfrom\s)?['"](\.{1,2}\/[^'"]+)['"]/g;
const reexportPattern = /export\s*(\*|\{([^}]*)\})\s*from\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const localExportPattern = /export\s*\{([^}]*)\}\s*;/g;

function readModule(file: string) {
  return fs.readFileSync(path.join(esmDir, file), 'utf-8');
}

function resolveImport(from: string, specifier: string) {
  return path.normalize(path.join(path.dirname(from), specifier));
}

function importsOf(file: string) {
  return [...readModule(file).matchAll(importPattern)].map((match) =>
    resolveImport(file, match[1])
  );
}

function exportedNames(list: string) {
  return list
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) =>
      item
        .split(/\s+as\s+/)
        .pop()!
        .trim()
    );
}

function localExports(file: string) {
  const source = readModule(file);
  const names = new Set<string>();
  for (const match of source.matchAll(localExportPattern)) {
    exportedNames(match[1]).forEach((name) => names.add(name));
  }
  for (const match of source.matchAll(reexportPattern)) {
    if (match[2]) {
      exportedNames(match[2]).forEach((name) => names.add(name));
    }
  }
  return names;
}

function publicModules() {
  const modules = new Map<string, string>();
  for (const match of readModule('index.mjs').matchAll(reexportPattern)) {
    const file = resolveImport('index.mjs', match[3]);
    const names = match[1] === '*' ? [...localExports(file)] : exportedNames(match[2]);
    names.forEach((name) => modules.set(name, file));
  }
  return modules;
}

function cssModulesOf(file: string, visited = new Set<string>(), order: string[] = []) {
  if (visited.has(file)) {
    return order;
  }
  visited.add(file);
  for (const dependency of importsOf(file)) {
    cssModulesOf(dependency, visited, order);
  }
  if (file.endsWith('.module.css.mjs')) {
    order.push(file.replace(/\.mjs$/, ''));
  }
  return order;
}

async function minify(css: string) {
  const result = await postcss([cssnano()]).process(css, { from: undefined });
  return result.css;
}

function writeStylesheet(name: string, css: string, { withLayer = false } = {}) {
  fs.writeFileSync(path.join(stylesDir, `${name}.css`), css);
  if (withLayer) {
    fs.writeFileSync(path.join(stylesDir, `${name}.layer.css`), `@layer mantine {${css}}`);
  }
}

async function prepareCss() {
  if (!fs.existsSync(rollupCssFilePath) || !fs.existsSync(cssModulesManifest)) {
    signale.error('CSS file not found. Please run `yarn build` first.');
    process.exit(1);
  }

  const content = fs.readFileSync(rollupCssFilePath, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'styles.css'), content);
  fs.writeFileSync(path.join(distDir, 'styles.layer.css'), `@layer mantine {${content}}`);
  fs.removeSync(rollupCssFilePath);
  fs.removeSync(path.join(distDir, 'cjs/index.css'));

  const cssByModule: Record<string, string> = fs.readJsonSync(cssModulesManifest);
  fs.emptyDirSync(stylesDir);
  writeStylesheet('base', await minify(cssByModule[BASE_MODULE]), { withLayer: true });

  let count = 0;
  for (const [name, file] of publicModules()) {
    if (!/^[A-Z]/.test(name) || !/[a-z]/.test(name)) {
      continue;
    }
    const modules = cssModulesOf(file).filter((module) => module !== BASE_MODULE);
    const missing = modules.filter((module) => !(module in cssByModule));
    if (missing.length > 0) {
      signale.error(`${name}: compiled CSS is missing for ${missing.join(', ')}`);
      process.exit(1);
    }
    writeStylesheet(name, await minify(modules.map((module) => cssByModule[module]).join('\n')));
    count += 1;
  }

  signale.success(`Wrote styles.css, base.css and ${count} per-component stylesheets`);
}

prepareCss();
