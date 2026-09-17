/**
 * Type-check the code the docs site shows in the Code tab.
 *
 * Every `code` block and every generated example file (`buildExampleSource`)
 * is written to a temp folder and checked with one TypeScript program against
 * package/src. Docs snippets are excerpts, so identifiers that belong to the
 * reader's app (`handleSend`, `session`, …) are expected: the gate is about
 * code that cannot be parsed and imports that do not exist.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SITE = path.join(ROOT, 'site');

/** Syntax errors (TS1xxx) plus imports that do not resolve to a real export. */
const BLOCKING_CODES = new Set([2305, 2307, 2323, 2339, 2440, 2614, 2724]);

function isBlocking(diagnostic: ts.Diagnostic): boolean {
  if (diagnostic.category !== ts.DiagnosticCategory.Error) {
    return false;
  }
  if (diagnostic.code < 2000) {
    return true;
  }
  return BLOCKING_CODES.has(diagnostic.code);
}

function slug(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  process.chdir(SITE);
  const { COMPONENT_DOCS } = await import(path.join(SITE, 'app/data/component-docs.ts'));
  const { buildExampleSource } = await import(path.join(SITE, 'app/lib/wrap-example-code.ts'));

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-kit-examples-'));
  const ambient = path.join(outDir, 'ambient.d.ts');
  fs.writeFileSync(
    ambient,
    ['declare module "*.css";', 'declare module "*.css?inline";', ''].join('\n')
  );
  const files: string[] = [ambient];
  let index = 0;

  for (const doc of COMPONENT_DOCS) {
    for (const block of doc.blocks ?? []) {
      index += 1;
      const source =
        block.type === 'example'
          ? buildExampleSource(doc.name, block.code)
          : block.type === 'code'
            ? block.content
            : null;
      if (source === null) {
        continue;
      }
      const name = `${String(index).padStart(3, '0')}-${slug(doc.name)}-${slug(block.title)}.tsx`;
      const file = path.join(outDir, name);
      fs.writeFileSync(file, source.endsWith('\n') ? source : `${source}\n`);
      files.push(file);
    }
  }

  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2020,
    lib: ['lib.dom.d.ts', 'lib.esnext.d.ts'],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: false,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    baseUrl: ROOT,
    paths: {
      '@sinups/ai-kit': [path.join(ROOT, 'package/src/index.ts')],
      '*': [path.join(ROOT, 'node_modules/*'), path.join(ROOT, 'node_modules/@types/*')],
    },
  });

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName.startsWith(outDir) && isBlocking(d));
  const formatted = ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => outDir,
    getNewLine: () => '\n',
  });

  if (diagnostics.length > 0) {
    process.stderr.write(formatted);
    process.stderr.write(
      `\n${diagnostics.length} blocking error(s) in ${files.length} generated example file(s).\n` +
        `Sources kept in ${outDir}\n`
    );
    process.exitCode = 1;
    return;
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  process.stdout.write(`${files.length} docs code blocks type-check clean\n`);
}

main();
