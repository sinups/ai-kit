import { isRecord } from './parts';

export type FilePartInfo = {
  /** Name to show, `Attachment` when the part has none */
  filename: string;
  /** `mediaType` or `mimeType` of the part */
  mediaType?: string;
  size?: number;
  /** Address of the file: `url`, or `data` as a `data:` URL */
  url?: string;
};

/** Alternative text of an attached image: its file name, `attachment` without one */
export function imageAltFromName(name: string): string {
  return name || 'attachment';
}

/** Name a part carries in `filename`, `name` or `fileName`, empty without one */
export function getPartFilename(part: unknown): string {
  if (!isRecord(part)) {
    return '';
  }
  const name = part.filename ?? part.name ?? part.fileName;
  return typeof name === 'string' ? name : '';
}

/** `mediaType` or `mimeType` of a part */
export function getPartMediaType(part: Record<string, unknown>): string | undefined {
  const mime = part.mediaType ?? part.mimeType;
  return typeof mime === 'string' ? mime : undefined;
}

/** Image address of an `image`, `data-image` or image `file` part, `null` for any other part */
export function getImageUrlFromPart(part: unknown): string | null {
  if (!isRecord(part) || typeof part.type !== 'string') {
    return null;
  }
  if (part.type === 'image') {
    const imagePart = part as { url?: string; image?: string };
    return imagePart.url ?? imagePart.image ?? null;
  }
  if (part.type === 'data-image') {
    return (part as { data?: { url?: string } }).data?.url ?? null;
  }
  if (part.type === 'file' && getPartMediaType(part)?.startsWith('image/')) {
    return getFileFromPart(part)?.url ?? null;
  }
  return null;
}

/** Name, type, size and address of a `file` part, `null` for any other part */
export function getFileFromPart(part: unknown): FilePartInfo | null {
  if (!isRecord(part) || part.type !== 'file') {
    return null;
  }
  const file = part as { size?: number; url?: string; data?: string };
  const mediaType = getPartMediaType(part);
  return {
    filename: getPartFilename(part) || 'Attachment',
    mediaType,
    size: file.size,
    url: file.url ?? (file.data && mediaType ? `data:${mediaType};base64,${file.data}` : undefined),
  };
}
