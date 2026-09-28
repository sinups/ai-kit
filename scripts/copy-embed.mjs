import fs from 'node:fs';
import path from 'node:path';

const source = path.join(process.cwd(), 'package/dist/embed/widget.js');
const target = path.join(process.cwd(), 'site/public/widget.js');

if (!fs.existsSync(source)) {
  console.error('package/dist/embed/widget.js not found. Run the package build first.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied ${path.relative(process.cwd(), source)} to ${path.relative(process.cwd(), target)}`);
