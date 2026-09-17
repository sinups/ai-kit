import type { ModelOption } from '../types';
import type { DailyUsage, ModelUsage, OutputStyle, UsageLimit, StatusMcpServer } from './types';

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000);

export const MODELS: ModelOption[] = [
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', version: '32B' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3', version: '70B' },
  { id: 'mistral-small-24b', name: 'Mistral Small', version: '24B' },
];

export const OUTPUT_STYLES: OutputStyle[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Concise answers focused on getting the task done',
    example: 'Fixed the retry in client.ts.',
  },
  {
    id: 'explanatory',
    name: 'Explanatory',
    description: 'Explains the choices and trade-offs behind each change',
    example: 'I added the retry in the client because the session store is shared…',
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'Leaves small parts for you to implement, with hints',
    example: 'TODO(you): handle the 401 case — hint: it should not retry.',
  },
];

export const LIMITS: UsageLimit[] = [
  {
    id: 'session',
    label: '5-hour limit',
    used: 184,
    limit: 200,
    unit: 'requests',
    resetsAt: hoursFromNow(1.4),
  },
  {
    id: 'weekly',
    label: 'Weekly limit',
    used: 6_200_000,
    limit: 10_000_000,
    resetsAt: hoursFromNow(80),
  },
  {
    id: 'spend',
    label: 'Extra usage',
    used: 12.4,
    limit: 50,
    unit: 'cost',
    resetsAt: hoursFromNow(300),
  },
];

export const MODEL_USAGE: ModelUsage[] = [
  { model: 'Qwen 2.5 Coder 32B', tokens: 4_120_000, cost: 61.8 },
  { model: 'Llama 3.3 70B', tokens: 1_830_000, cost: 5.49 },
  { model: 'Mistral Small 24B', tokens: 250_000, cost: 0.25 },
];

export const DAILY_USAGE: DailyUsage[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - index));
  const tokens = [420_000, 910_000, 180_000, 1_320_000, 760_000, 1_540_000, 1_070_000][index];
  return { date, tokens, cost: tokens / 100_000 };
});

export const MCP_SERVERS: StatusMcpServer[] = [
  { name: 'git', status: 'success' },
  { name: 'issues', status: 'success' },
  { name: 'figma', status: 'needs-auth' },
  { name: 'errors', status: 'error' },
  { name: 'postgres', status: 'disabled' },
];
