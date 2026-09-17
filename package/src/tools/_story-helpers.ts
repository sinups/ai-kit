import type { ToolPart } from '../types';
import type { SyntaxHighlighter } from '../utils/highlighter';

export const OLD_CODE = `export function greet(name: string) {
  console.log("Hello " + name);
  return name;
}`;

export const NEW_CODE = `export function greet(name: string, excited = false) {
  const suffix = excited ? "!" : ".";
  console.log(\`Hello \${name}\${suffix}\`);
  return name;
}`;

export function bashPart(state: ToolPart['state'], extra: Partial<ToolPart> = {}): ToolPart {
  return {
    type: 'tool-Bash',
    toolCallId: `bash-${state}`,
    state,
    input: { command: 'yarn tsc --noEmit | head -20' },
    ...extra,
  };
}

export function editPart(state: ToolPart['state'], extra: Partial<ToolPart> = {}): ToolPart {
  return {
    type: 'tool-Edit',
    toolCallId: `edit-${state}`,
    state,
    input: {
      file_path: '/project/src/utils/greet.ts',
      old_string: OLD_CODE,
      new_string: NEW_CODE,
    },
    ...extra,
  };
}

export const NESTED_TOOLS: ToolPart[] = [
  {
    type: 'tool-Read',
    toolCallId: 'n1',
    state: 'output-available',
    input: { file_path: '/project/src/index.ts' },
    output: 'ok',
  },
  {
    type: 'tool-Grep',
    toolCallId: 'n2',
    state: 'output-available',
    input: { pattern: 'ToolRowBase', path: '/project/src' },
    output: { numFiles: 4 },
  },
  {
    type: 'tool-Edit',
    toolCallId: 'n3',
    state: 'output-available',
    input: { file_path: '/project/src/App.tsx', old_string: 'a', new_string: 'b\nc' },
    output: { success: true },
  },
  {
    type: 'tool-Bash',
    toolCallId: 'n4',
    state: 'output-available',
    input: { command: 'yarn jest package/src' },
    output: { stdout: 'PASS', exitCode: 0 },
  },
  {
    type: 'tool-Write',
    toolCallId: 'n5',
    state: 'output-available',
    input: { file_path: '/project/src/new.ts', content: 'export const x = 1;' },
    output: { success: true },
  },
  {
    type: 'tool-Glob',
    toolCallId: 'n6',
    state: 'output-available',
    input: { pattern: '**/*.story.tsx' },
    output: { numFiles: 12 },
  },
];

const KEYWORDS = /^(import|export|from|const|let|function|return|if|type|interface|default|new)$/;

/** Tiny regex highlighter for stories: keywords, strings and numbers in light and dark colors */
export const demoHighlighter: SyntaxHighlighter = (code) =>
  code.split('\n').map((line) =>
    (line.match(/'[^']*'|"[^"]*"|`[^`]*`|\w+|\s+|[^\w\s]/g) ?? []).map((content) => {
      if (KEYWORDS.test(content)) {
        return { content, color: '#8250df', darkColor: '#d2a8ff' };
      }
      if (/^['"`]/.test(content)) {
        return { content, color: '#0a3069', darkColor: '#a5d6ff' };
      }
      if (/^\d+$/.test(content)) {
        return { content, color: '#0550ae', darkColor: '#79c0ff' };
      }
      return { content };
    })
  );
