import { countDiffStats, diffLines } from '../utils/line-diff';
import { byteLength } from '../utils/shell-output';
import type { FileChange, FileChangeStatus, FileStats } from './types';

export type FileTreeNode =
  | { type: 'folder'; name: string; path: string; children: FileTreeNode[] }
  | { type: 'file'; name: string; path: string; change: FileChange };

export function stripTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

export function splitPath(path: string): { directory: string; name: string } {
  const index = path.lastIndexOf('/');
  return index === -1
    ? { directory: '', name: path }
    : { directory: path.slice(0, index + 1), name: path.slice(index + 1) };
}

export function countLines(text: string | undefined): number {
  if (!text) {
    return 0;
  }
  return stripTrailingNewline(text).split('\n').length;
}

/** Added and removed line counts, taken from the change when given and computed from the contents otherwise */
export function computeFileStats(change: FileChange): FileStats {
  if (change.additions !== undefined && change.deletions !== undefined) {
    return { additions: change.additions, deletions: change.deletions };
  }
  if (change.binary) {
    return { additions: change.additions ?? 0, deletions: change.deletions ?? 0 };
  }
  const { added, removed } = countDiffStats(
    diffLines(
      stripTrailingNewline(change.oldContent ?? ''),
      stripTrailingNewline(change.newContent ?? '')
    )
  );
  return { additions: change.additions ?? added, deletions: change.deletions ?? removed };
}

/** Size in bytes: `sizeBytes` when given, otherwise the larger UTF-8 size of the old and new contents */
export function getFileSize(change: FileChange): number {
  if (change.sizeBytes !== undefined) {
    return change.sizeBytes;
  }
  return Math.max(byteLength(change.oldContent ?? ''), byteLength(change.newContent ?? ''));
}

export function summarizeChanges(changes: FileChange[]): FileStats & { files: number } {
  let additions = 0;
  let deletions = 0;
  for (const change of changes) {
    const stats = computeFileStats(change);
    additions += stats.additions;
    deletions += stats.deletions;
  }
  return { files: changes.length, additions, deletions };
}

export function filterChanges(
  changes: FileChange[],
  query: string,
  status: FileChangeStatus | 'all'
): FileChange[] {
  const needle = query.trim().toLowerCase();
  return changes.filter(
    (change) =>
      (status === 'all' || change.status === status) &&
      (!needle ||
        change.path.toLowerCase().includes(needle) ||
        !!change.previousPath?.toLowerCase().includes(needle))
  );
}

export function countChangesByStatus(changes: FileChange[]): Record<FileChangeStatus, number> {
  const counts: Record<FileChangeStatus, number> = {
    added: 0,
    modified: 0,
    deleted: 0,
    renamed: 0,
  };
  for (const change of changes) {
    counts[change.status]++;
  }
  return counts;
}

type MutableFolder = {
  folders: Map<string, MutableFolder>;
  files: { name: string; change: FileChange }[];
};

function toNodes(folder: MutableFolder, prefix: string): FileTreeNode[] {
  const folders = [...folder.folders.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]): FileTreeNode => {
      let label = name;
      let current = child;
      while (current.files.length === 0 && current.folders.size === 1) {
        const [[nextName, next]] = [...current.folders.entries()];
        label = `${label}/${nextName}`;
        current = next;
      }
      const path = `${prefix}${label}`;
      return { type: 'folder', name: label, path, children: toNodes(current, `${path}/`) };
    });
  const files = [...folder.files]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, change }): FileTreeNode => ({ type: 'file', name, path: change.path, change }));
  return [...folders, ...files];
}

/** Folders first then files, each sorted by name; chains of single folders collapse into `a/b/c` */
export function buildFileTree(changes: FileChange[]): FileTreeNode[] {
  const root: MutableFolder = { folders: new Map(), files: [] };
  for (const change of changes) {
    const parts = change.path.split('/').filter(Boolean);
    const name = parts.pop() ?? change.path;
    let folder = root;
    for (const part of parts) {
      let next = folder.folders.get(part);
      if (!next) {
        next = { folders: new Map(), files: [] };
        folder.folders.set(part, next);
      }
      folder = next;
    }
    folder.files.push({ name, change });
  }
  return toNodes(root, '');
}

export function flattenFileTree(nodes: FileTreeNode[]): FileChange[] {
  return nodes.flatMap((node) =>
    node.type === 'file' ? [node.change] : flattenFileTree(node.children)
  );
}
