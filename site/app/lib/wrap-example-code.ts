/**
 * Turn a minimal JSX example snippet into a full, copy-pasteable page.
 *
 * Each example stored in `component-docs.ts` is usually just the JSX body —
 * e.g. `<AgentChat messages={messages} ... />`. This helper wraps it so the
 * reader sees a ready-to-run file: `"use client"`, imports, referenced
 * constants, and an `Example` export.
 *
 * The helper is intentionally pragmatic: it detects a small set of well-known
 * identifiers and stubs them. If an example already contains a full
 * `export function` / `export default`, it's returned as-is.
 */

import { resolveExampleImport } from '@/app/lib/example-imports';

type KnownStub = {
  match: RegExp;
  /** Extra imports needed (e.g. type ChatMessage). */
  imports?: string[];
  /** Const declarations to emit above the component. */
  declarations: string;
};

const KNOWN_STUBS: Record<string, KnownStub> = {
  messages: {
    match: /\bmessages\b/,
    imports: [`import type { ChatMessage } from "@sinups/ai-kit";`],
    declarations: `const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Show me the latest status." }],
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [{ type: "text", text: "All systems are green." }],
  },
];`,
  },
  promptSuggestions: {
    match: /\bpromptSuggestions\b/,
    declarations: `const promptSuggestions = [
  { id: "write", label: "Write", value: "Write release notes for this change." },
  { id: "plan", label: "Plan", value: "Draft a rollout plan in 5 steps." },
];`,
  },
  suggestionItems: {
    match: /\bsuggestionItems\b/,
    declarations: `const suggestionItems = [
  { id: "write", label: "Write", value: "Write release notes." },
  { id: "plan", label: "Plan", value: "Draft a rollout plan." },
];`,
  },
  imageUrl: {
    match: /\bimageUrl\b/,
    declarations: `const imageUrl = "https://example.com/preview.png";`,
  },
  images: {
    match: /\bimages\b/,
    declarations: `const images = [
  { id: "img-1", filename: "preview.png", url: imageUrl },
];`,
  },
  files: {
    match: /\bfiles\b/,
    declarations: `const files = [{ id: "file-1", filename: "spec.md", size: 3200 }];`,
  },
  handleSend: {
    match: /\bhandleSend\b/,
    declarations: `const handleSend = () => {};`,
  },
  handleStop: {
    match: /\bhandleStop\b/,
    declarations: `const handleStop = () => {};`,
  },
  onAttach: {
    match: /\bonAttach\b(?!\s*=)/,
    declarations: `const onAttach = () => {};`,
  },
  onRemoveImage: {
    match: /\bonRemoveImage\b(?!\s*=)/,
    declarations: `const onRemoveImage = () => {};`,
  },
  onRemoveFile: {
    match: /\bonRemoveFile\b(?!\s*=)/,
    declarations: `const onRemoveFile = () => {};`,
  },
};

const COMPONENT_TAG_RE = /<([A-Z][A-Za-z0-9_]*)/g;

function extractComponents(snippet: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = COMPONENT_TAG_RE.exec(snippet)) !== null) {
    found.add(m[1]);
  }
  return Array.from(found);
}

/**
 * Number of JSX roots in a snippet: top-level elements plus top-level `{…}`
 * expressions. Quoted text and nested braces are skipped so that `a < b`
 * inside a handler is not read as a tag.
 */
function countRootElements(snippet: string): number {
  let roots = 0;
  let depth = 0;
  let braces = 0;
  let quote: string | null = null;
  let i = 0;

  while (i < snippet.length) {
    const char = snippet[i];

    if (quote) {
      if (char === '\\') i += 1;
      else if (char === quote) quote = null;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      i += 1;
      continue;
    }
    if (char === '{') {
      if (braces === 0 && depth === 0) roots += 1;
      braces += 1;
      i += 1;
      continue;
    }
    if (char === '}') {
      braces = Math.max(0, braces - 1);
      i += 1;
      continue;
    }
    if (braces > 0 || char !== '<') {
      i += 1;
      continue;
    }

    const closing = snippet[i + 1] === '/';
    let j = i + 1;
    let tagQuote: string | null = null;
    let tagBraces = 0;
    while (j < snippet.length) {
      const tagChar = snippet[j];
      if (tagQuote) {
        if (tagChar === '\\') j += 1;
        else if (tagChar === tagQuote) tagQuote = null;
      } else if (tagChar === '"' || tagChar === "'" || tagChar === '`') {
        tagQuote = tagChar;
      } else if (tagChar === '{') {
        tagBraces += 1;
      } else if (tagChar === '}') {
        tagBraces = Math.max(0, tagBraces - 1);
      } else if (tagChar === '>' && tagBraces === 0) {
        break;
      }
      j += 1;
    }
    const selfClosing = snippet[j - 1] === '/';

    if (closing) {
      depth = Math.max(0, depth - 1);
    } else {
      if (depth === 0) roots += 1;
      if (!selfClosing) depth += 1;
    }
    i = j + 1;
  }

  return roots;
}

function alreadyDefines(snippet: string, name: string): boolean {
  // Only detect real top-level declarations — not JSX attribute assignments
  // like `messages={messages}` where `messages=` would otherwise match.
  const re = new RegExp(`\\b(?:const|let|var|function)\\s+${name}\\b`);
  return re.test(snippet);
}

function isFullFile(snippet: string): boolean {
  return (
    /^\s*(?:"use client";?\s*)?(?:import\s)/m.test(snippet) ||
    /export\s+(?:default\s+)?function/.test(snippet)
  );
}

function indentBy(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : ''))
    .join('\n');
}

/** Indent a JSX body for `return ( … )`, wrapping several roots in a fragment. */
function asReturnBody(jsx: string): string {
  if (countRootElements(jsx) > 1 || jsx.startsWith('{')) {
    return `    <>\n${indentBy(jsx, 6)}\n    </>`;
  }
  return indentBy(jsx, 4);
}

/**
 * Build a full, copy-pasteable Example file from a JSX snippet.
 */
export function buildExampleSource(componentName: string, snippet: string): string {
  const trimmed = snippet.trim();
  if (isFullFile(trimmed)) return trimmed;

  // Detect all referenced capitalised JSX tags (e.g. InputBar, SendButton)
  // and emit one import per module (everything ships from the package root).
  const componentsReferenced = extractComponents(trimmed);
  const componentsToImport = Array.from(new Set([componentName, ...componentsReferenced])).filter(
    (n) => /^[A-Z]/.test(n)
  );

  const extraImports = new Set<string>();
  const declarations: string[] = [];

  for (const [name, stub] of Object.entries(KNOWN_STUBS)) {
    if (!stub.match.test(trimmed)) continue;
    if (alreadyDefines(trimmed, name)) continue;
    stub.imports?.forEach((imp) => extraImports.add(imp));
    declarations.push(stub.declarations);
  }

  // Group components by the package they come from: the kit, the icon set or
  // Mantine. Names the snippet declares itself, and names no package exports,
  // get no import line at all.
  const byPath = new Map<string, string[]>();
  for (const name of componentsToImport) {
    if (alreadyDefines(trimmed, name)) continue;
    const path = resolveExampleImport(name);
    if (!path) continue;
    const bucket = byPath.get(path) ?? [];
    bucket.push(name);
    byPath.set(path, bucket);
  }
  const componentImports = Array.from(byPath.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([path, names]) =>
        `import { ${[...names].sort((a, b) => a.localeCompare(b)).join(', ')} } from "${path}";`
    );

  const importLines: string[] = [...componentImports, ...extraImports];

  // If snippet is already a multi-line block with its own `const` + JSX
  // (like some MessageList examples), split at the first JSX opening and
  // wrap the JSX in an Example, keeping the consts at module scope.
  const looksLikeMixed = /^\s*const\s/.test(trimmed) && /<[A-Z][A-Za-z0-9_]*/.test(trimmed);

  if (looksLikeMixed) {
    const lines = trimmed.split('\n');
    let splitAt = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*</.test(lines[i])) {
        splitAt = i;
        break;
      }
    }
    const consts = [...declarations, lines.slice(0, splitAt).join('\n').trim()].join('\n\n');
    const jsx = lines.slice(splitAt).join('\n').trim();
    return (
      `"use client";\n\n` +
      `${importLines.join('\n')}\n\n` +
      `${consts}\n\n` +
      `export function Example() {\n  return (\n${asReturnBody(jsx)}\n  );\n}\n`
    );
  }

  const indentedSnippet = asReturnBody(trimmed);

  const parts: string[] = [];
  parts.push(`"use client";`);
  parts.push('');
  parts.push(importLines.join('\n'));
  if (declarations.length > 0) {
    parts.push('');
    parts.push(declarations.join('\n\n'));
  }
  parts.push('');
  parts.push(`export function Example() {\n  return (\n${indentedSnippet}\n  );\n}`);
  return parts.join('\n') + '\n';
}
