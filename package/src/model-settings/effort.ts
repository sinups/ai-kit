import type { EffortLevel } from './types';

export const DEFAULT_EFFORT_LEVELS: EffortLevel[] = [
  { value: 'low', label: 'Low', description: 'Fastest answers, minimal reasoning' },
  { value: 'medium', label: 'Medium', description: 'Balanced speed and depth' },
  { value: 'high', label: 'High', description: 'Thinks longer on harder problems' },
  { value: 'max', label: 'Max', description: 'Deepest reasoning, slowest and most expensive' },
];

export function findEffortLevel(levels: EffortLevel[], value: string | null | undefined) {
  return levels.find((level) => level.value === value);
}
