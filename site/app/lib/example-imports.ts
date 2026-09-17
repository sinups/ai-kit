import fs from 'node:fs';
import path from 'node:path';

export const KIT_PACKAGE = '@sinups/ai-kit';
export const MANTINE_PACKAGE = '@mantine/core';
export const ICONS_PACKAGE = '@tabler/icons-react';

function firstExisting(candidates: string[]): string {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not locate any of: ${candidates.join(', ')} (cwd: ${process.cwd()})`);
}

function readKitIndex(): string {
  return fs.readFileSync(
    firstExisting([
      path.join(process.cwd(), '../package/src/index.ts'),
      path.join(process.cwd(), 'package/src/index.ts'),
    ]),
    'utf8'
  );
}

function readMantineIndex(): string {
  return fs.readFileSync(
    firstExisting([
      path.join(process.cwd(), 'node_modules/@mantine/core/esm/index.mjs'),
      path.join(process.cwd(), '../node_modules/@mantine/core/esm/index.mjs'),
    ]),
    'utf8'
  );
}

/**
 * Value names (not types) re-exported from a barrel file — `export { A, B as C } from "…"`
 * and the single trailing `export { … }` of a bundled barrel.
 */
function parseValueExports(source: string): Set<string> {
  const names = new Set<string>();
  const blockRe = /\bexport\s+(type\s+)?\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(source)) !== null) {
    if (match[1]) continue;
    for (const entry of match[2].split(',')) {
      const parts = entry.trim().split(/\s+as\s+/);
      const exported = (parts[1] ?? parts[0]).trim();
      if (!exported || exported.startsWith('type ')) continue;
      if (/^[A-Za-z_$][\w$]*$/.test(exported)) names.add(exported);
    }
  }
  return names;
}

let kitExports: Set<string> | null = null;
let mantineExports: Set<string> | null = null;

export function getKitExports(): Set<string> {
  kitExports ??= parseValueExports(readKitIndex());
  return kitExports;
}

export function getMantineExports(): Set<string> {
  mantineExports ??= parseValueExports(readMantineIndex());
  return mantineExports;
}

/**
 * Where a capitalised identifier used in a docs example comes from.
 * `null` means "declared in the example itself or not importable" — no import is emitted,
 * because a wrong import is worse than a missing one: it does not compile.
 */
export function resolveExampleImport(name: string): string | null {
  if (getKitExports().has(name)) return KIT_PACKAGE;
  if (name.startsWith('Icon')) return ICONS_PACKAGE;
  if (getMantineExports().has(name)) return MANTINE_PACKAGE;
  return null;
}
