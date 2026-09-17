export type FileChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface FileChange {
  /** Path after the change, relative to the repository root */
  path: string;
  /** Path before a rename */
  previousPath?: string;
  /** Kind of change */
  status: FileChangeStatus;
  /** Content before the change, omitted for added files */
  oldContent?: string;
  /** Content after the change, omitted for deleted files */
  newContent?: string;
  /** Added line count, computed from the contents when omitted */
  additions?: number;
  /** Removed line count, computed from the contents when omitted */
  deletions?: number;
  /** Binary file, its contents are not shown */
  binary?: boolean;
  /** Language id of the contents, for example `ts` */
  language?: string;
  /** New file not yet tracked by version control */
  untracked?: boolean;
  /** File size in bytes, measured from the contents when omitted */
  sizeBytes?: number;
}

export interface DiffSource {
  /** Stable unique id */
  id: string;
  /** Short label for the switcher, for example `Uncommitted` or `Turn 3` */
  label: string;
  /** Changed files of this source */
  changes: FileChange[];
}

export type WordSegmentType = 'equal' | 'added' | 'removed';

export interface WordSegment {
  text: string;
  type: WordSegmentType;
}

export interface FileStats {
  additions: number;
  deletions: number;
}

export type FileDecision = 'accepted' | 'rejected';

export interface DiffLabels {
  filesChanged: (files: number) => string;
  searchFiles: string;
  statusFilter: string;
  allStatuses: string;
  statusAdded: string;
  statusModified: string;
  statusDeleted: string;
  statusRenamed: string;
  viewList: string;
  viewTree: string;
  noFiles: string;
  noMatchingFiles: string;
  unified: string;
  split: string;
  copyPath: string;
  pathCopied: string;
  showUnchanged: (lines: number) => string;
  binaryFile: string;
  binaryFileDescription: string;
  deletedFile: string;
  deletedFileDescription: (lines: number) => string;
  showContent: string;
  emptyFile: string;
  renamedWithoutChanges: string;
  viewed: string;
  viewedCount: (viewed: number, total: number) => string;
  previousFile: string;
  nextFile: string;
  accept: string;
  reject: string;
  acceptAll: string;
  rejectAll: string;
  accepted: string;
  rejected: string;
  back: string;
  selectFile: string;
  title: string;
  retry: string;
  statusUntracked: string;
  untrackedFile: string;
  untrackedFileDescription: (lines: number) => string;
  fileTooLarge: string;
  fileTooLargeDescription: (size: string, limit: string) => string;
  showAnyway: string;
  changesSource: string;
  dismiss: string;
  closeSearch: string;
  lineAdded: string;
  lineRemoved: string;
}
