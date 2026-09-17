import fs from 'node:fs';
import path from 'node:path';
import nodeExternals from 'rollup-plugin-node-externals';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';
import banner from 'rollup-plugin-banner2';
import { createGenerateScopedName } from 'hash-css-selector';

const outputDir = path.join(process.cwd(), './package/dist');
const srcDir = path.join(process.cwd(), './package/src');
export const cssModulesManifest = path.join(
  process.cwd(),
  'node_modules/.cache/ai-kit/css-modules.json'
);

const cssByModule = new Map();

const recordCssModule = {
  postcssPlugin: 'record-css-module',
  OnceExit(root, { result }) {
    cssByModule.set(path.relative(srcDir, result.opts.from), root.toString());
  },
};

const writeCssModulesManifest = {
  name: 'write-css-modules-manifest',
  writeBundle() {
    fs.mkdirSync(path.dirname(cssModulesManifest), { recursive: true });
    fs.writeFileSync(cssModulesManifest, JSON.stringify(Object.fromEntries(cssByModule)));
  },
};

export default {
  input: path.join(process.cwd(), './package/src/index.ts'),
  output: [
    {
      format: 'es',
      entryFileNames: '[name].mjs',
      dir: path.join(outputDir, 'esm'),
      preserveModules: true,
      sourcemap: false,
    },
    {
      format: 'cjs',
      entryFileNames: '[name].cjs',
      dir: path.join(outputDir, 'cjs'),
      preserveModules: true,
      sourcemap: false,
    },
  ],
  plugins: [
    nodeExternals({
      packagePath: path.join(process.cwd(), 'package/package.json'),
    }),
    nodeResolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
    esbuild({
      sourceMap: false,
      tsconfig: path.resolve(process.cwd(), 'tsconfig.build.json'),
    }),
    replace({ preventAssignment: true }),
    postcss({
      extract: true,
      modules: { generateScopedName: createGenerateScopedName('me') },
      minimize: true,
      plugins: [recordCssModule],
    }),
    writeCssModulesManifest,
    banner((chunk) => {
      if (chunk.fileName !== 'index.js' && chunk.fileName !== 'index.mjs') {
        return "'use client';\n";
      }

      return undefined;
    }),
  ],
};
