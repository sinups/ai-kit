import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

// Vite marks CSS modules side-effect free in production builds, so the global token sheet
// (`styles/vars.module.css`, imported only for its `:root` rules) was dropped from `storybook build`
// and every component rendered without `--ae-*` variables.
function keepGlobalCssModules(): Plugin {
  return {
    name: 'ai-kit:keep-global-css-modules',
    enforce: 'post',
    transform(code, id) {
      if (/[\\/]styles[\\/][^\\/]+\.module\.css($|\?)/.test(id)) {
        return { code, map: null, moduleSideEffects: 'no-treeshake' };
      }
      return null;
    },
  };
}

const config: StorybookConfig = {
  stories: ['../package/src/**/*.story.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {
    autodocs: false,
  },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), keepGlobalCssModules()],
  }),
};

export default config;
