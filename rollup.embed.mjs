import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';

const outputDir = path.join(process.cwd(), './package/dist/embed');

const build = (input, output) => ({
  input: path.join(process.cwd(), input),
  output,
  plugins: [
    nodeResolve({ extensions: ['.ts'] }),
    esbuild({
      sourceMap: false,
      minify: true,
      target: 'es2020',
      tsconfig: path.resolve(process.cwd(), 'tsconfig.build.json'),
    }),
  ],
});

export default [
  build('./package/src/embed/global.ts', {
    format: 'iife',
    file: path.join(outputDir, 'widget.js'),
    name: 'AiKitChatWidget',
  }),
  build('./package/src/embed/index.ts', [
    { format: 'es', file: path.join(outputDir, 'index.mjs') },
    { format: 'cjs', file: path.join(outputDir, 'index.cjs') },
  ]),
];
