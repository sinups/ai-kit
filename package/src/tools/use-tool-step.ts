import { useMemo } from 'react';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { getLegacyToolState, getPartInput, getPartOutput } from '../utils/format-tool';
import { mapToolInvocationToStep, mapToolStateToStepState } from '../utils/tool-adapters';

export type ToolStepResult = {
  step: ToolCallStep;
  stepState: StepState;
};

/** Shared no-op `onComplete` for tool cards driven by a part instead of a timeline */
export const noopComplete = () => {};

/** Builds the timeline step and its state for a tool part, memoized by part identity */
export function useToolStep(part: ToolPart, toolName: string, fallbackId: string): ToolStepResult;
export function useToolStep(
  part: ToolPart | undefined,
  toolName: string,
  fallbackId: string
): ToolStepResult | null;
export function useToolStep(
  part: ToolPart | undefined,
  toolName: string,
  fallbackId: string
): ToolStepResult | null {
  return useMemo(() => {
    if (!part) {
      return null;
    }
    const legacyState = getLegacyToolState(part);
    const step = mapToolInvocationToStep(part.toolCallId ?? (part.id as string) ?? fallbackId, {
      toolName,
      args: getPartInput(part),
      state: legacyState,
      result: getPartOutput(part),
    });
    return { step, stepState: mapToolStateToStepState(legacyState) };
  }, [part, toolName, fallbackId]);
}
