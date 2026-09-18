import type { ModelOption } from '@sinups/ai-kit';

export const MODELS: ModelOption[] = [
  { id: 'claude-opus-5', name: 'Claude Opus', version: '5' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet', version: '5' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku', version: '4.5' },
];

export function isKnownModel(id: string | undefined): id is string {
  return MODELS.some((model) => model.id === id);
}
