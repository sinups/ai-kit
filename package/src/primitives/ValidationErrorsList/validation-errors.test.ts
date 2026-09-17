import {
  dedupeValidationErrors,
  fillValidationTemplate,
  getValidationErrorKey,
  getValidationSeverity,
  groupValidationErrors,
  type SettingsValidationError,
} from './validation-errors';

const ERRORS: SettingsValidationError[] = [
  { file: '.agent/settings.json', path: 'permissions.allow[0]', message: 'Unknown tool Bsh' },
  { file: '~/.agent/settings.json', path: 'model', message: 'Unknown model', severity: 'warning' },
  { file: '.agent/settings.json', path: 'permissions.allow[0]', message: 'Unknown tool Bsh' },
  { file: '.agent/settings.json', path: 'hooks', message: 'Expected an object' },
];

describe('primitives/dedupeValidationErrors', () => {
  it('keeps the first of identical file, path and message', () => {
    expect(dedupeValidationErrors(ERRORS)).toEqual([ERRORS[0], ERRORS[1], ERRORS[3]]);
  });

  it('treats a different path as a different error', () => {
    const errors = [ERRORS[0], { ...ERRORS[0], path: 'permissions.allow[1]' }];
    expect(dedupeValidationErrors(errors)).toHaveLength(2);
  });
});

describe('primitives/groupValidationErrors', () => {
  it('groups by file in order of first appearance and counts severities', () => {
    expect(groupValidationErrors(ERRORS)).toEqual([
      {
        file: '.agent/settings.json',
        errors: [ERRORS[0], ERRORS[3]],
        errorCount: 2,
        warningCount: 0,
      },
      { file: '~/.agent/settings.json', errors: [ERRORS[1]], errorCount: 0, warningCount: 1 },
    ]);
  });
});

describe('primitives/helpers', () => {
  it('derives keys and the overall severity', () => {
    expect(getValidationErrorKey({ ...ERRORS[0], id: 'x' })).toBe('x');
    expect(getValidationErrorKey(ERRORS[0])).toBe(getValidationErrorKey(ERRORS[2]));
    expect(getValidationSeverity(ERRORS)).toBe('error');
    expect(getValidationSeverity([ERRORS[1]])).toBe('warning');
    expect(getValidationSeverity([])).toBe('warning');
  });
});

describe('primitives/fillValidationTemplate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(
      fillValidationTemplate('{file} has {count} problems {x}', { file: 'a.json', count: '2' })
    ).toBe('a.json has 2 problems {x}');
  });
});
