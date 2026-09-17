import React, { memo, useMemo } from 'react';
import { CommandPalette } from '../primitives/CommandPalette/CommandPalette';
import type { PaletteCommand } from '../primitives/CommandPalette/command-palette';
import { countLines } from './pasted-text';
import { getSearchablePrompts } from './prompt-history';

export interface PromptHistorySearchLabels {
  /** Search input placeholder and accessible label */
  search: string;
  /** Accessible label of the results list */
  results: string;
  /** Shown when nothing matches */
  empty: string;
  /** Description of multi-line prompts, `{lines}` is replaced */
  lines: string;
}

export interface PromptHistorySearchProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Called on Escape, outside click and after a prompt is picked */
  onClose: () => void;
  /** Previously sent prompts, oldest first */
  history: string[];
  /** Called with the picked prompt */
  onSelect: (prompt: string) => void;
  /** Overrides for the English labels */
  labels?: Partial<PromptHistorySearchLabels>;
}

const DEFAULT_LABELS: PromptHistorySearchLabels = {
  search: 'Find a previous prompt',
  results: 'Prompts',
  empty: 'No matching prompts',
  lines: '{lines} lines',
};

const PREVIEW_LENGTH = 160;

/** Fuzzy search over previously sent prompts, newest first */
export const PromptHistorySearch = memo(function PromptHistorySearch({
  opened,
  onClose,
  history,
  onSelect,
  labels: labelsProp,
}: PromptHistorySearchProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  const commands = useMemo<PaletteCommand[]>(
    () =>
      getSearchablePrompts(history).map((prompt, index) => {
        const firstLine = prompt.trim().split('\n')[0];
        const lines = countLines(prompt.trim());
        return {
          id: String(index),
          label:
            firstLine.length > PREVIEW_LENGTH
              ? `${firstLine.slice(0, PREVIEW_LENGTH)}…`
              : firstLine,
          description: lines > 1 ? labels.lines.replace('{lines}', String(lines)) : undefined,
          keywords: [prompt],
          onSelect: () => onSelect(prompt),
        };
      }),
    [history, onSelect, labels.lines]
  );

  return (
    <CommandPalette
      opened={opened}
      onClose={onClose}
      commands={commands}
      placeholder={labels.search}
      emptyLabel={labels.empty}
      labels={{ search: labels.search, results: labels.results }}
    />
  );
});

PromptHistorySearch.displayName = 'PromptHistorySearch';
