import React, { createContext, useContext, useMemo, useState } from 'react';
import type { McpToolDefinition } from '../mcp/types';
import type { ToolPart } from '../types';
import type { ToolOutputFormatters } from '../rows/tool-output';
import type { ToolArgsFormatters } from './tool-args';
import { parseMcpToolType } from './tool-registry';

/** What a server says about one of its tools: the readable name, the purpose and the arguments */
export type ToolCatalogEntry = Pick<
  McpToolDefinition,
  'title' | 'description' | 'annotations' | 'inputSchema'
>;

/**
 * Tool definitions keyed by the name a call carries: `mcp__<server>__<tool>`, the full part type
 * `tool-mcp__<server>__<tool>` or the bare tool name.
 */
export type ToolCatalog = Record<string, ToolCatalogEntry | undefined>;

export type ToolPresentation = {
  /** Catalog of the connected servers, see `ToolCatalog` */
  catalog?: ToolCatalog;
  /** Argument formatters by part type */
  args?: ToolArgsFormatters;
  /** Result formatters by part type */
  outputs?: ToolOutputFormatters;
  /** Locale of numbers and dates, the locale of the runtime by default */
  locale?: string;
};

const ToolPresentationContext = createContext<ToolPresentation & { seen?: Map<string, number> }>(
  {}
);

export interface ToolPresentationProviderProps extends ToolPresentation {
  children: React.ReactNode;
}

/** Hands the tool catalog and the host formatters to every tool call rendered inside it */
export function ToolPresentationProvider({
  children,
  catalog,
  args,
  outputs,
  locale,
}: ToolPresentationProviderProps) {
  const [seen] = useState(() => new Map<string, number>());
  const value = useMemo(
    () => ({ catalog, args, outputs, locale, seen }),
    [catalog, args, outputs, locale, seen]
  );
  return (
    <ToolPresentationContext.Provider value={value}>{children}</ToolPresentationContext.Provider>
  );
}

ToolPresentationProvider.displayName = 'ToolPresentationProvider';

export function useToolPresentation(): ToolPresentation {
  return useContext(ToolPresentationContext);
}

/**
 * Moment a call id, or one of its moments such as `:done`, was first rendered under this provider,
 * so a step that folds, opens or remounts later keeps its time; without an id or a provider it is
 * kept per component.
 */
export function useFirstSeen(): (toolCallId: string | undefined, moment?: string) => number {
  const shared = useContext(ToolPresentationContext).seen;
  const [local] = useState(() => new Map<string, number>());
  return (toolCallId, moment = '') => {
    const seen = toolCallId && shared ? shared : local;
    const id = `${toolCallId ?? ''}${moment}`;
    const known = seen.get(id);
    if (known !== undefined) {
      return known;
    }
    const now = Date.now();
    seen.set(id, now);
    return now;
  };
}

/** Catalog entry of the tool behind a call, `undefined` when the host has none for it */
export function findToolCatalogEntry(
  catalog: ToolCatalog | undefined,
  part: Pick<ToolPart, 'type' | 'toolName'>
): ToolCatalogEntry | undefined {
  if (!catalog) {
    return undefined;
  }
  const type = part.type;
  const mcpInfo = parseMcpToolType(type);
  const keys = [
    type,
    type.startsWith('tool-') ? type.slice(5) : undefined,
    mcpInfo?.toolName,
    typeof part.toolName === 'string' ? part.toolName : undefined,
  ];
  for (const key of keys) {
    if (key && catalog[key]) {
      return catalog[key];
    }
  }
  return undefined;
}

/** Readable name of a catalog tool: its `title`, then `annotations.title` */
export function getToolCatalogTitle(entry: ToolCatalogEntry | undefined): string | undefined {
  return entry?.title || entry?.annotations?.title || undefined;
}
