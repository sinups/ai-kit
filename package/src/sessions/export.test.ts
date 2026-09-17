import type { ChatMessage } from '../types';
import { exportConversation, getExportFilename } from './export';
import type { ExportOptions } from './types';

const MESSAGES: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: '2026-09-17T09:00:00.000Z',
    parts: [
      { type: 'text', text: 'Fix the login bug' },
      { type: 'file', filename: 'trace.log', url: 'https://example.com/trace.log' },
    ],
  },
  {
    id: 'a1',
    role: 'assistant',
    createdAt: new Date('2026-09-17T09:00:05.000Z'),
    parts: [
      { type: 'reasoning', text: 'Check the session refresh first.' },
      {
        type: 'tool-Grep',
        toolCallId: 't1',
        state: 'output-available',
        input: { pattern: 'refresh' },
        output: 'src/auth.ts:42',
      },
      {
        type: 'dynamic-tool',
        toolName: 'deploy',
        state: 'output-error',
        input: { env: 'prod' },
        errorText: 'Forbidden',
      },
      { type: 'text', text: 'Found it in `auth.ts`.' },
      { type: 'error', title: 'Rate limit', message: 'Try again later' },
      { type: 'compaction', summary: 'Discussed the auth flow' },
      { type: 'data-custom', value: 1 },
    ],
  },
  { id: 'a2', role: 'assistant', parts: [{ type: 'data-custom', value: 2 }] },
];

const ALL: ExportOptions = {
  format: 'markdown',
  includeToolCalls: true,
  includeThinking: true,
  includeTimestamps: true,
  title: 'Login bug',
};

describe('exportConversation', () => {
  it('renders markdown with every known part type', () => {
    const result = exportConversation(MESSAGES, ALL);
    expect(result.mimeType).toBe('text/markdown');
    expect(result.extension).toBe('md');
    expect(result.content).toBe(
      [
        '# Login bug',
        '',
        '## User · 2026-09-17T09:00:00.000Z',
        '',
        'Fix the login bug',
        '',
        'Attachment: [trace.log](<https://example.com/trace.log>)',
        '',
        '## Assistant · 2026-09-17T09:00:05.000Z',
        '',
        '> **Thinking**',
        '>',
        '> Check the session refresh first.',
        '',
        '**Tool: Grep** (output-available)',
        '',
        'Input:',
        '',
        '```json',
        '{\n  "pattern": "refresh"\n}',
        '```',
        '',
        'Output:',
        '',
        '```',
        'src/auth.ts:42',
        '```',
        '',
        '**Tool: deploy** (output-error)',
        '',
        'Input:',
        '',
        '```json',
        '{\n  "env": "prod"\n}',
        '```',
        '',
        'Error: Forbidden',
        '',
        'Found it in `auth.ts`.',
        '',
        '> **Error:** Rate limit: Try again later',
        '',
        '---',
        '',
        '_Earlier messages were compacted: Discussed the auth flow_',
        '',
        '---',
        '',
      ].join('\n')
    );
  });

  it('drops tool calls, thinking and timestamps when disabled', () => {
    const { content } = exportConversation(MESSAGES, {
      format: 'markdown',
      includeToolCalls: false,
      includeThinking: false,
      includeTimestamps: false,
    });
    expect(content).not.toMatch(/Thinking|Tool:|2026-09-17|^# /m);
    expect(content).toMatch(/^## User\n/);
    expect(content).toContain('Found it in `auth.ts`.');
  });

  it('renders plain text', () => {
    const result = exportConversation(MESSAGES, { ...ALL, format: 'text', title: undefined });
    expect(result.mimeType).toBe('text/plain');
    expect(result.extension).toBe('txt');
    expect(result.content).toBe(
      [
        'User (2026-09-17T09:00:00.000Z):',
        'Fix the login bug',
        '[File] trace.log (https://example.com/trace.log)',
        '',
        'Assistant (2026-09-17T09:00:05.000Z):',
        '[Thinking] Check the session refresh first.',
        '[Tool Grep] output-available',
        'Input: {\n  "pattern": "refresh"\n}',
        'Output: src/auth.ts:42',
        '[Tool deploy] output-error',
        'Input: {\n  "env": "prod"\n}',
        'Error: Forbidden',
        'Found it in `auth.ts`.',
        '[Error] Rate limit: Try again later',
        '[Compacted] Discussed the auth flow',
        '',
      ].join('\n')
    );
  });

  it('renders json with filtered parts and optional timestamps', () => {
    const result = exportConversation(MESSAGES, {
      ...ALL,
      format: 'json',
      includeToolCalls: false,
      includeTimestamps: false,
    });
    expect(result.mimeType).toBe('application/json');
    const data = JSON.parse(result.content);
    expect(data.title).toBe('Login bug');
    expect(data.messages).toHaveLength(3);
    expect(data.messages[0]).not.toHaveProperty('createdAt');
    expect(data.messages[1].parts.map((part: { type: string }) => part.type)).toEqual([
      'reasoning',
      'text',
      'error',
      'compaction',
      'data-custom',
    ]);

    const withTime = JSON.parse(exportConversation(MESSAGES, { ...ALL, format: 'json' }).content);
    expect(withTime.messages[1].createdAt).toBe('2026-09-17T09:00:05.000Z');
    expect(withTime.messages[2]).not.toHaveProperty('createdAt');
  });

  it('uses a longer fence when the content contains backticks', () => {
    const { content } = exportConversation(
      [
        {
          id: 'a',
          role: 'assistant',
          parts: [{ type: 'tool-Read', input: 'x', output: 'before ``` after' }],
        },
      ],
      { ...ALL, title: undefined }
    );
    expect(content).toContain('````\nbefore ``` after\n````');
  });

  it('escapes attachment links and keeps non-web urls as plain text', () => {
    const { content } = exportConversation(
      [
        {
          id: 'u',
          role: 'user',
          parts: [
            { type: 'file', filename: 'notes [draft].md', url: 'https://example.com/a b).md' },
            { type: 'file', filename: 'run.js', url: 'data:text/html,hi' },
          ],
        },
      ],
      { ...ALL, title: undefined }
    );
    expect(content).toContain(
      'Attachment: [notes \\[draft\\].md](<https://example.com/a%20b).md>)'
    );
    expect(content).toContain('Attachment: run.js');
    expect(content).not.toContain('data:');
  });
});

describe('getExportFilename', () => {
  it('slugifies the title and adds the extension', () => {
    expect(getExportFilename('Fix: Login bug (v2)!', 'markdown')).toBe('fix-login-bug-v2.md');
    expect(getExportFilename('Café résumé', 'json')).toBe('cafe-resume.json');
    expect(getExportFilename(undefined, 'text')).toBe('conversation.txt');
    expect(getExportFilename('Привет', 'text')).toBe('conversation.txt');
  });
});
