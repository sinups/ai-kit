import fs from 'fs-extra';
import signale from 'signale';
import { $ } from 'zx';
import path from 'node:path';

async function generateDts() {
  try {
    await $`yarn tsc --project tsconfig.build.json`;
    const indexPath = path.join(process.cwd(), 'package/dist/types/index.d.ts');
    const index = await fs.readFile(indexPath, 'utf-8');
    await fs.writeFile(indexPath, index.replace(/^import '[^']+\.css';\n/gm, ''));
  } catch (err) {
    signale.error('Failed to generate d.ts files');
    signale.error(err);
    process.exit(1);
  }
}

generateDts();
