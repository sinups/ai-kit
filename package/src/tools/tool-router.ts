import React from 'react';
import type { StepState, ToolCallStep } from '../types/timeline';
import { ActionRow } from './ActionRow';
import { BashToolTerminalCard } from './BashTool';
import { EditToolDiffCard } from './EditTool';
import { GenericToolRow } from './GenericTool';
import { ThinkingCollapsed } from './ThinkingTool';

/** Picks the card component for a timeline `tool-call` step */
export function routeToolCall(
  step: ToolCallStep,
  state: StepState,
  onComplete: () => void,
  actionIndex: number
): React.ReactNode {
  if (step.toolVariant === 'thinking') {
    return React.createElement(ThinkingCollapsed, { key: step.id, step, state, onComplete });
  }

  if (step.diffLines || step.filePath || step.toolName === 'Write' || step.toolName === 'Edit') {
    return React.createElement(EditToolDiffCard, { key: step.id, step, state, onComplete });
  }

  if (step.bashCommand || step.toolName === 'Bash') {
    return React.createElement(BashToolTerminalCard, { key: step.id, step, state, onComplete });
  }

  if (step.toolVariant === 'action' || !step.toolVariant) {
    return React.createElement(ActionRow, {
      key: step.id,
      step,
      state,
      onComplete,
      index: actionIndex,
    });
  }

  return React.createElement(GenericToolRow, { key: step.id, step, state, onComplete });
}
