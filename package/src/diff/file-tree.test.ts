import {
  buildFileTree,
  computeFileStats,
  countLines,
  filterChanges,
  flattenFileTree,
  splitPath,
  summarizeChanges,
} from './file-tree';
import type { FileChange } from './types';

const change = (path: string, extra: Partial<FileChange> = {}): FileChange => ({
  path,
  status: 'modified',
  ...extra,
});

describe('file-tree', () => {
  it('computes stats from contents unless they are given', () => {
    expect(
      computeFileStats(change('a.ts', { oldContent: 'a\nb\nc\n', newContent: 'a\nB\nc\nd\n' }))
    ).toEqual({ additions: 2, deletions: 1 });
    expect(computeFileStats(change('a.ts', { additions: 5, deletions: 2 }))).toEqual({
      additions: 5,
      deletions: 2,
    });
    expect(computeFileStats(change('new.ts', { status: 'added', newContent: 'x\ny' }))).toEqual({
      additions: 2,
      deletions: 0,
    });
    expect(computeFileStats(change('logo.png', { binary: true }))).toEqual({
      additions: 0,
      deletions: 0,
    });
  });

  it('summarizes, filters and splits paths', () => {
    const changes = [
      change('src/a.ts', { additions: 3, deletions: 1 }),
      change('src/b.ts', { status: 'added', additions: 10, deletions: 0 }),
      change('docs/new.md', {
        status: 'renamed',
        previousPath: 'docs/old.md',
        additions: 0,
        deletions: 0,
      }),
    ];
    expect(summarizeChanges(changes)).toEqual({ files: 3, additions: 13, deletions: 1 });
    expect(filterChanges(changes, 'SRC', 'all').map((item) => item.path)).toEqual([
      'src/a.ts',
      'src/b.ts',
    ]);
    expect(filterChanges(changes, '', 'added').map((item) => item.path)).toEqual(['src/b.ts']);
    expect(filterChanges(changes, 'old.md', 'all').map((item) => item.path)).toEqual([
      'docs/new.md',
    ]);
    expect(splitPath('src/app/page.tsx')).toEqual({ directory: 'src/app/', name: 'page.tsx' });
    expect(splitPath('README.md')).toEqual({ directory: '', name: 'README.md' });
    expect(countLines('a\nb\n')).toBe(2);
    expect(countLines(undefined)).toBe(0);
  });

  it('builds a tree with folders first and collapsed single-folder chains', () => {
    const tree = buildFileTree([
      change('README.md'),
      change('package/src/billing/invoice.ts'),
      change('package/src/billing/tax.ts'),
      change('package/src/index.ts'),
      change('docs/guides/billing/setup.md'),
    ]);

    expect(tree.map((node) => [node.type, node.name])).toEqual([
      ['folder', 'docs/guides/billing'],
      ['folder', 'package/src'],
      ['file', 'README.md'],
    ]);
    const packageSrc = tree[1];
    expect(packageSrc.type === 'folder' && packageSrc.path).toBe('package/src');
    expect(
      packageSrc.type === 'folder' && packageSrc.children.map((node) => [node.name, node.path])
    ).toEqual([
      ['billing', 'package/src/billing'],
      ['index.ts', 'package/src/index.ts'],
    ]);
    expect(flattenFileTree(tree).map((item) => item.path)).toEqual([
      'docs/guides/billing/setup.md',
      'package/src/billing/invoice.ts',
      'package/src/billing/tax.ts',
      'package/src/index.ts',
      'README.md',
    ]);
  });
});
