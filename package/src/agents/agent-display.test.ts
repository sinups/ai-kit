import { formatAgentDate, getAgentModelLabel } from './agent-display';
import { AGENT_MODELS } from './fixtures';

describe('agents/agent-display', () => {
  it('labels models', () => {
    expect(getAgentModelLabel(undefined, AGENT_MODELS, 'Inherit')).toBe('Inherit');
    expect(getAgentModelLabel('inherit', AGENT_MODELS, 'Inherit')).toBe('Inherit');
    expect(getAgentModelLabel('qwen-2.5-coder-32b', AGENT_MODELS, 'Inherit')).toBe(
      'Qwen 2.5 Coder 32B'
    );
    expect(getAgentModelLabel('custom-model', AGENT_MODELS, 'Inherit')).toBe('custom-model');
  });

  it('formats dates in an explicit locale', () => {
    expect(formatAgentDate('2026-09-12T10:24:00Z', 'en')).toBe('Sep 12, 2026');
    expect(formatAgentDate('2026-09-12T10:24:00Z', 'de')).toBe('12.09.2026');
    expect(formatAgentDate('not a date', 'en')).toBe('not a date');
  });
});
