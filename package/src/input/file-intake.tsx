import React, { useCallback, useRef } from 'react';

export type FileIntakePolicy = {
  /** MIME types, `type/*` masks and `.ext` extensions; the any-type mask takes every file, as does omitting it */
  accept?: string[];
  /** Most files at once, counting `current` */
  maxFiles?: number;
  /** Largest file in bytes */
  maxFileSize?: number;
  /** Files already attached, counted against `maxFiles` */
  current?: number;
};

export type FileRejectionReason = 'type' | 'size' | 'count';

export type FileRejection = {
  file: File;
  reason: FileRejectionReason;
};

export type FileIntakeResult = {
  accepted: File[];
  rejected: FileRejection[];
};

function matchesAccept(file: File, accept: string[]): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return accept.some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) {
      return false;
    }
    if (rule === '*' || rule === '*/*') {
      return true;
    }
    if (rule.startsWith('.')) {
      return name.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1));
    }
    return type === rule;
  });
}

/** Splits files into those the policy accepts and those it rejects, with the reason for each */
export function filterFiles(files: File[], policy: FileIntakePolicy = {}): FileIntakeResult {
  const { accept, maxFiles, maxFileSize, current = 0 } = policy;
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (accept && accept.length > 0 && !matchesAccept(file, accept)) {
      rejected.push({ file, reason: 'type' });
    } else if (maxFileSize !== undefined && file.size > maxFileSize) {
      rejected.push({ file, reason: 'size' });
    } else if (maxFiles !== undefined && current + accepted.length >= maxFiles) {
      rejected.push({ file, reason: 'count' });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}

export type UseFileIntakeOptions = FileIntakePolicy & {
  /** Lets the file dialog pick several files, `true` by default */
  multiple?: boolean;
  /** Called with the accepted files; not called when every file was rejected */
  onFiles: (files: File[]) => void;
  /** Called with the rejected files and the reason for each */
  onReject?: (rejections: FileRejection[]) => void;
};

export type FileIntake = {
  /** Opens the file dialog, for `onAttach` of `InputBar` */
  open: () => void;
  /** Hidden file input, render it anywhere, for example in `leftActions` */
  input: React.ReactElement;
  /** Takes files pasted from the clipboard; text pastes are left alone */
  onPaste: (event: React.ClipboardEvent) => void;
  /** Takes dropped files, for `ChatDropZone` */
  onDrop: (files: FileList | File[]) => void;
};

/** Picks, pastes and drops files through one policy; uploading them stays with the host */
export function useFileIntake({
  accept,
  maxFiles,
  maxFileSize,
  current,
  multiple = true,
  onFiles,
  onReject,
}: UseFileIntakeOptions): FileIntake {
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ accept, maxFiles, maxFileSize, current, onFiles, onReject });
  latest.current = { accept, maxFiles, maxFileSize, current, onFiles, onReject };

  const take = useCallback((files: File[]) => {
    const policy = latest.current;
    const { accepted, rejected } = filterFiles(files, policy);
    if (accepted.length > 0) {
      policy.onFiles(accepted);
    }
    if (rejected.length > 0) {
      policy.onReject?.(rejected);
    }
  }, []);

  const open = useCallback(() => inputRef.current?.click(), []);

  const onDrop = useCallback((files: FileList | File[]) => take(Array.from(files)), [take]);

  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) {
        return;
      }
      event.preventDefault();
      take(files);
    },
    [take]
  );

  const input = (
    <input
      ref={inputRef}
      type="file"
      hidden
      tabIndex={-1}
      aria-hidden
      multiple={multiple}
      accept={accept?.join(',')}
      onChange={(event) => {
        take(Array.from(event.currentTarget.files ?? []));
        event.currentTarget.value = '';
      }}
    />
  );

  return { open, input, onPaste, onDrop };
}
