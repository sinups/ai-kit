import {
  DEFAULT_HOOK_MESSAGES,
  buildHook,
  countHooksByEvent,
  createHookDraft,
  describeMatcher,
  getHookEventText,
  getHookPayloadExample,
  getHookSummary,
  validateActionStep,
  validateEventStep,
  validateHookDraft,
  validateMatcher,
  validateMatcherStep,
} from './hook-wizard';
import { HOOK_EVENTS, HOOK_EVENT_ORDER, HOOK_SCOPES, HOOK_SCOPE_ORDER } from './types';

describe('hooks-config/types', () => {
  it('describes every event exactly once', () => {
    expect(new Set(HOOK_EVENT_ORDER).size).toBe(HOOK_EVENT_ORDER.length);
    expect(Object.keys(HOOK_EVENTS).sort()).toEqual([...HOOK_EVENT_ORDER].sort());
    for (const event of HOOK_EVENT_ORDER) {
      const meta = HOOK_EVENTS[event];
      expect(meta.event).toBe(event);
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.examplePayload.hook_event_name).toBe(event);
    }
    expect(HOOK_EVENT_ORDER.filter((event) => HOOK_EVENTS[event].supportsMatcher)).toEqual([
      'PreToolUse',
      'PostToolUse',
    ]);
  });

  it('describes every scope', () => {
    expect(Object.keys(HOOK_SCOPES).sort()).toEqual([...HOOK_SCOPE_ORDER].sort());
    for (const scope of HOOK_SCOPE_ORDER) {
      expect(HOOK_SCOPES[scope].description).toBeTruthy();
    }
  });
});

describe('hooks-config/hook-wizard', () => {
  it('creates a draft from an existing hook', () => {
    expect(createHookDraft()).toMatchObject({ event: null, type: 'command', scope: 'project' });
    expect(
      createHookDraft({
        event: 'Stop',
        type: 'prompt',
        prompt: 'Check',
        timeout: 30,
        enabled: false,
      })
    ).toMatchObject({ event: 'Stop', prompt: 'Check', timeout: 30, enabled: false });
  });

  it('validates the event step', () => {
    expect(validateEventStep(createHookDraft())).toEqual({ event: 'Choose an event' });
    expect(validateEventStep(createHookDraft({ event: 'Stop' }))).toBeNull();
  });

  it('uses the given messages', () => {
    const messages = { ...DEFAULT_HOOK_MESSAGES, eventRequired: 'Pick one', allTools: 'Any' };
    expect(validateEventStep(createHookDraft(), messages)).toEqual({ event: 'Pick one' });
    expect(describeMatcher('*', messages)).toBe('Any');
    expect(getHookEventText('Stop', { Stop: { label: 'Done' } })).toEqual({
      label: 'Done',
      description: HOOK_EVENTS.Stop.description,
    });
  });

  it('validates matchers only for events that support them', () => {
    expect(validateMatcher('')).toBeNull();
    expect(validateMatcher('*')).toBeNull();
    expect(validateMatcher('Edit|Write')).toBeNull();
    expect(validateMatcher('mcp__(git')).toBe('Not a valid regular expression');
    expect(
      validateMatcherStep({ ...createHookDraft({ event: 'PreToolUse' }), matcher: '(' })
    ).toEqual({ matcher: 'Not a valid regular expression' });
    expect(validateMatcherStep({ ...createHookDraft({ event: 'Stop' }), matcher: '(' })).toBeNull();
  });

  it('validates the action step', () => {
    const draft = createHookDraft({ event: 'Stop' });
    expect(validateActionStep(draft)).toEqual({ command: 'Enter a command' });
    expect(validateActionStep({ ...draft, type: 'prompt' })).toEqual({ prompt: 'Enter a prompt' });
    expect(validateActionStep({ ...draft, command: 'make lint', timeout: 0 })).toEqual({
      timeout: 'Use a whole number of seconds',
    });
    expect(validateActionStep({ ...draft, command: 'make lint', timeout: 4000 })).toEqual({
      timeout: 'At most 3600 seconds',
    });
    expect(validateActionStep({ ...draft, command: 'make lint', timeout: 60 })).toBeNull();
    expect(validateHookDraft(createHookDraft())).toEqual({
      event: 'Choose an event',
      command: 'Enter a command',
    });
  });

  it('builds a hook without fields that do not apply', () => {
    const draft = {
      ...createHookDraft({ event: 'Stop' }),
      matcher: 'Bash',
      command: '  ./notify.sh ',
      prompt: 'unused',
    };
    expect(buildHook(draft, 'h1')).toEqual({
      id: 'h1',
      event: 'Stop',
      type: 'command',
      command: './notify.sh',
      scope: 'project',
      enabled: true,
    });
    expect(
      buildHook(
        {
          ...createHookDraft({ event: 'PreToolUse' }),
          matcher: 'Bash',
          type: 'prompt',
          prompt: 'Is it safe?',
          timeout: 20,
        },
        'h2'
      )
    ).toEqual({
      id: 'h2',
      event: 'PreToolUse',
      matcher: 'Bash',
      type: 'prompt',
      prompt: 'Is it safe?',
      timeout: 20,
      scope: 'project',
      enabled: true,
    });
    expect(() => buildHook(createHookDraft(), 'h3')).toThrow();
  });

  it('describes matchers and payloads', () => {
    expect(describeMatcher(undefined)).toBe('All tools');
    expect(describeMatcher('*')).toBe('All tools');
    expect(describeMatcher('Bash')).toBe('Bash');
    expect(describeMatcher('Edit|Write')).toBe('Tools matching Edit|Write');
    expect(JSON.parse(getHookPayloadExample('PreToolUse', 'Read')).tool_name).toBe('Read');
    expect(JSON.parse(getHookPayloadExample('PreToolUse', 'Edit|Write')).tool_name).toBe('Bash');
    expect(JSON.parse(getHookPayloadExample('Stop')).hook_event_name).toBe('Stop');
  });

  it('counts hooks by event and summarizes actions', () => {
    const counts = countHooksByEvent([
      { id: '1', event: 'Stop', type: 'command', command: 'a', scope: 'user' },
      { id: '2', event: 'Stop', type: 'prompt', prompt: ' Check ', scope: 'user' },
    ]);
    expect(counts.Stop).toBe(2);
    expect(counts.PreToolUse).toBe(0);
    expect(getHookSummary({ type: 'prompt', prompt: ' Check ' })).toBe('Check');
  });
});
