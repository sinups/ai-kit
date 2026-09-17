import { isErrorPart, isRecord, isTextPart, isV5ToolPart } from './parts';

describe('utils/parts guards', () => {
  it('isRecord accepts objects only', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('text')).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it('isTextPart requires a string text', () => {
    expect(isTextPart({ type: 'text', text: 'hi' })).toBe(true);
    expect(isTextPart({ type: 'text' })).toBe(false);
    expect(isTextPart({ type: 'error', text: 'hi' })).toBe(false);
    expect(isTextPart(null)).toBe(false);
  });

  it('isErrorPart requires a string message', () => {
    expect(isErrorPart({ type: 'error', message: 'Boom' })).toBe(true);
    expect(isErrorPart({ type: 'error', title: 'Boom' })).toBe(false);
    expect(isErrorPart({ type: 'text', message: 'Boom' })).toBe(false);
  });

  it('isV5ToolPart matches tool-* and dynamic-tool', () => {
    expect(isV5ToolPart({ type: 'tool-Bash' })).toBe(true);
    expect(isV5ToolPart({ type: 'dynamic-tool' })).toBe(true);
    expect(isV5ToolPart({ type: 'text', text: 'x' })).toBe(false);
    expect(isV5ToolPart({ type: 42 })).toBe(false);
    expect(isV5ToolPart('tool-Bash')).toBe(false);
  });
});
