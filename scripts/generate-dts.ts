import fs from 'fs-extra';
import signale from 'signale';
import { $ } from 'zx';
import path from 'node:path';

const typesDir = path.join(process.cwd(), 'package/dist/types');

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)'(\.[^']*)'/gm;

function listDeclarations(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listDeclarations(full);
    }
    return entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

function resolveSpecifier(file: string, specifier: string) {
  const target = path.resolve(path.dirname(file), specifier);
  if (fs.existsSync(`${target}.d.ts`)) {
    return `${specifier}.mjs`;
  }
  if (fs.existsSync(path.join(target, 'index.d.ts'))) {
    return `${specifier}/index.mjs`;
  }
  return null;
}

function writeEsmDeclarations() {
  const unresolved: string[] = [];
  for (const file of listDeclarations(typesDir)) {
    const source = fs.readFileSync(file, 'utf-8');
    const rewritten = source.replace(SPECIFIER, (match, prefix: string, specifier: string) => {
      const resolved = resolveSpecifier(file, specifier);
      if (!resolved) {
        unresolved.push(`${path.relative(typesDir, file)} -> ${specifier}`);
        return match;
      }
      return `${prefix}'${resolved}'`;
    });
    fs.writeFileSync(file.replace(/\.d\.ts$/, '.d.mts'), rewritten);
  }
  if (unresolved.length > 0) {
    throw new Error(`Unresolved relative imports in .d.ts files:\n${unresolved.join('\n')}`);
  }
}

async function generateDts() {
  try {
    await $`yarn tsc --project tsconfig.build.json`;
    const indexPath = path.join(typesDir, 'index.d.ts');
    const index = await fs.readFile(indexPath, 'utf-8');
    await fs.writeFile(indexPath, index.replace(/^import '[^']+\.css';\n/gm, ''));
    writeEsmDeclarations();
  } catch (err) {
    signale.error('Failed to generate d.ts files');
    signale.error(err);
    process.exit(1);
  }
}

generateDts();
