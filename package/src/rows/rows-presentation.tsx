import React from 'react';
import type { TranscriptPresentation } from '../MessageList/transcript-presentation';
import type { ToolPart } from '../types';
import { isV5ToolPart } from '../utils/parts';
import { ToolPartRow } from './ToolPartRow';

/**
 * Flat transcript of a terminal client for the `presentation` of `MessageList` and `AgentChat`:
 * a marker, the call and its answer under a gutter. Passed as a value so that the rows only reach
 * the bundle of a host that turns them on.
 */
export interface RowsPresentation extends TranscriptPresentation {
  kind: 'rows';
}

export const rowsPresentation: RowsPresentation = {
  kind: 'rows',
  renderParts: (entries, renderDefault, context) =>
    entries.map((entry) => {
      if (!isV5ToolPart(entry.part)) {
        return renderDefault(entry);
      }
      const part = entry.part as ToolPart;
      return (
        <ToolPartRow
          key={part.toolCallId ?? `${context.messageId}-tool-${entry.index}`}
          part={part}
          chatStatus={context.chatStatus}
          lookups={context.lookups}
          showActivity={context.showActivity}
          toolOutputs={context.toolOutputs}
          highlighter={context.highlighter}
        />
      );
    }),
};
