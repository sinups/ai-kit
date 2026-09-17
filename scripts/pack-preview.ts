import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import signale from 'signale';

const root = process.cwd();
const packageDir = path.join(root, 'package');
const outDir = path.join(root, '.pack');
const metadataFiles = ['README.md', 'LICENSE', 'NOTICE'];

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  await fs.emptyDir(outDir);
  for (const file of metadataFiles) {
    await fs.copy(path.join(root, file), path.join(packageDir, file));
  }

  try {
    const output = execFileSync('npm', ['pack', '--json', '--pack-destination', outDir], {
      cwd: packageDir,
      encoding: 'utf8',
    });
    const [result] = JSON.parse(output) as {
      filename: string;
      size: number;
      unpackedSize: number;
      entryCount: number;
      files: { path: string; size: number }[];
    }[];

    const tarball = path.join(outDir, result.filename);
    const unpacked = path.join(outDir, 'package');
    execFileSync('tar', ['-xzf', tarball, '-C', outDir]);

    const groups = new Map<string, { files: number; bytes: number }>();
    for (const file of result.files) {
      const parts = file.path.split('/');
      const group = parts.length > 2 ? `${parts[0]}/${parts[1]}` : file.path;
      const current = groups.get(group) ?? { files: 0, bytes: 0 };
      groups.set(group, { files: current.files + 1, bytes: current.bytes + file.size });
    }

    signale.success(`Tarball ${path.relative(root, tarball)}: ${formatSize(result.size)}`);
    signale.info(
      `Unpacked into ${path.relative(root, unpacked)}: ${formatSize(result.unpackedSize)}, ${result.entryCount} files`
    );
    for (const [group, { files, bytes }] of [...groups].sort((a, b) => b[1].bytes - a[1].bytes)) {
      signale.log(`  ${group.padEnd(28)} ${String(files).padStart(4)} files  ${formatSize(bytes)}`);
    }
  } finally {
    for (const file of metadataFiles) {
      await fs.remove(path.join(packageDir, file));
    }
  }
}

main().catch((error) => {
  signale.error(error);
  process.exitCode = 1;
});
