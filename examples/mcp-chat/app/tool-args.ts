import { summarizeToolArgs, type ToolArgsFormatters } from '@sinups/ai-kit';

const SELF = '__me__';
const HIDDEN_KEYS = new Set(['approval']);

function readable(value: unknown, me: string): unknown {
  if (value === SELF) {
    return me;
  }
  return Array.isArray(value) ? value.map((item) => (item === SELF ? me : item)) : value;
}

/** Servers here name the caller `__me__` and carry an `approval` key the user never needs to see */
export function buildToolArgs(me: string): ToolArgsFormatters {
  return {
    'tool-mcp__*': (_part, { args, schema, locale }) =>
      summarizeToolArgs(
        Object.fromEntries(
          Object.entries(args)
            .filter(([key]) => !HIDDEN_KEYS.has(key))
            .map(([key, value]) => [key, readable(value, me)])
        ),
        { schema, locale }
      ),
  };
}
