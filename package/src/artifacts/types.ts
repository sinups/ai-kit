/** A document, code file, table or image the answer produced, opened by its `id` */
export type ArtifactRef = {
  id: string;
  title: string;
  /** What the artifact is, for example `Document` or `Code` */
  kind?: string;
  version?: number;
};

/** Part of an answer that points to an artifact */
export type ArtifactPart = ArtifactRef & {
  type: 'artifact';
  /** `streaming` while the artifact is still being written */
  status?: 'streaming' | 'ready' | 'error';
};

/** Kind and version of an artifact as one line, `Document · v2` */
export function formatArtifactMeta(artifact: ArtifactRef): string {
  return [artifact.kind, artifact.version !== undefined ? `v${artifact.version}` : undefined]
    .filter(Boolean)
    .join(' · ');
}
