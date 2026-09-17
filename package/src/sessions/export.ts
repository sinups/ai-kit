import type { ChatMessage, MessagePart } from '../types';
import { toDate } from './format-relative-time';
import type { ExportFormat, ExportOptions, ExportResult } from './types';

const FORMAT_META: Record<ExportFormat, { mimeType: string; extension: string }> = {
  markdown: { mimeType: 'text/markdown', extension: 'md' },
  json: { mimeType: 'application/json', extension: 'json' },
  text: { mimeType: 'text/plain', extension: 'txt' },
};

const ROLE_LABELS: Record<ChatMessage['role'], string> = {
  user: 'User',
  assistant: 'Assistant',
  system: 'System',
};

type LoosePart = Record<string, unknown>;

function isToolPart(part: MessagePart): boolean {
  return part.type.startsWith('tool-') || part.type === 'dynamic-tool';
}

function isThinkingPart(part: MessagePart): boolean {
  return part.type === 'reasoning' || part.type === 'thinking';
}

function toolName(part: LoosePart): string {
  if (typeof part.toolName === 'string' && part.toolName) {
    return part.toolName;
  }
  return String(part.type).replace(/^tool-/, '');
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2) ?? '';
  } catch {
    return String(value);
  }
}

function fence(content: string, lang = ''): string {
  const longest = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = '`'.repeat(longest + 1);
  return `${ticks}${lang}\n${content}\n${ticks}`;
}

function quote(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function timestamp(message: ChatMessage): string | undefined {
  if (message.createdAt === undefined) {
    return undefined;
  }
  const date = toDate(message.createdAt);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function filterExportParts(parts: MessagePart[], options: ExportOptions): MessagePart[] {
  return parts.filter(
    (part) =>
      (options.includeToolCalls || !isToolPart(part)) &&
      (options.includeThinking || !isThinkingPart(part))
  );
}

function partText(part: LoosePart): string {
  return typeof part.text === 'string' ? part.text : '';
}

function fileName(part: LoosePart): string {
  return String(part.filename ?? part.name ?? part.url ?? 'file');
}

function markdownLink(label: string, url: string): string {
  const escapedLabel = label.replace(/[[\]\\]/g, '\\$&');
  const escapedUrl = url.replace(/[<>\s]/g, (char) => encodeURIComponent(char));
  return `[${escapedLabel}](<${escapedUrl}>)`;
}

function markdownPart(part: MessagePart): string | null {
  const p = part as LoosePart;
  if (part.type === 'text') {
    return partText(p).trim() || null;
  }
  if (isThinkingPart(part)) {
    const text = partText(p).trim();
    return text ? quote(`**Thinking**\n\n${text}`) : null;
  }
  if (isToolPart(part)) {
    const lines = [`**Tool: ${toolName(p)}**${p.state ? ` (${String(p.state)})` : ''}`];
    if (p.input !== undefined) {
      lines.push('Input:', fence(stringify(p.input), typeof p.input === 'string' ? '' : 'json'));
    }
    const output = p.output ?? p.result;
    if (output !== undefined) {
      lines.push('Output:', fence(stringify(output), typeof output === 'string' ? '' : 'json'));
    }
    if (typeof p.errorText === 'string') {
      lines.push(`Error: ${p.errorText}`);
    }
    return lines.join('\n\n');
  }
  if (part.type === 'file') {
    const name = fileName(p);
    return typeof p.url === 'string' && /^https?:\/\//i.test(p.url)
      ? `Attachment: ${markdownLink(name, p.url)}`
      : `Attachment: ${name}`;
  }
  if (part.type === 'error') {
    const title = typeof p.title === 'string' ? `${p.title}: ` : '';
    return quote(`**Error:** ${title}${String(p.message ?? '')}`);
  }
  if (part.type === 'compaction') {
    const summary = typeof p.summary === 'string' ? `: ${p.summary}` : '';
    return `---\n\n_Earlier messages were compacted${summary}_\n\n---`;
  }
  return null;
}

function textPart(part: MessagePart): string | null {
  const p = part as LoosePart;
  if (part.type === 'text') {
    return partText(p).trim() || null;
  }
  if (isThinkingPart(part)) {
    const text = partText(p).trim();
    return text ? `[Thinking] ${text}` : null;
  }
  if (isToolPart(part)) {
    const lines = [`[Tool ${toolName(p)}]${p.state ? ` ${String(p.state)}` : ''}`];
    if (p.input !== undefined) {
      lines.push(`Input: ${stringify(p.input)}`);
    }
    const output = p.output ?? p.result;
    if (output !== undefined) {
      lines.push(`Output: ${stringify(output)}`);
    }
    if (typeof p.errorText === 'string') {
      lines.push(`Error: ${p.errorText}`);
    }
    return lines.join('\n');
  }
  if (part.type === 'file') {
    return `[File] ${fileName(p)}${typeof p.url === 'string' ? ` (${p.url})` : ''}`;
  }
  if (part.type === 'error') {
    const title = typeof p.title === 'string' ? `${p.title}: ` : '';
    return `[Error] ${title}${String(p.message ?? '')}`;
  }
  if (part.type === 'compaction') {
    return `[Compacted]${typeof p.summary === 'string' ? ` ${p.summary}` : ''}`;
  }
  return null;
}

function serializeText(
  messages: ChatMessage[],
  options: ExportOptions,
  render: (part: MessagePart) => string | null,
  markdown: boolean
): string {
  const blocks: string[] = [];
  if (options.title) {
    blocks.push(markdown ? `# ${options.title}` : options.title);
  }
  for (const message of messages) {
    const body = filterExportParts(message.parts, options)
      .map(render)
      .filter((block): block is string => !!block);
    if (body.length === 0) {
      continue;
    }
    const time = options.includeTimestamps ? timestamp(message) : undefined;
    const role = ROLE_LABELS[message.role] ?? message.role;
    const heading = markdown
      ? `## ${role}${time ? ` · ${time}` : ''}`
      : `${role}${time ? ` (${time})` : ''}:`;
    blocks.push([heading, ...body].join(markdown ? '\n\n' : '\n'));
  }
  return `${blocks.join('\n\n')}\n`;
}

function serializeJson(messages: ChatMessage[], options: ExportOptions): string {
  const data = {
    ...(options.title ? { title: options.title } : {}),
    messages: messages.map((message) => {
      const time = options.includeTimestamps ? timestamp(message) : undefined;
      return {
        id: message.id,
        role: message.role,
        ...(time ? { createdAt: time } : {}),
        parts: filterExportParts(message.parts, options),
      };
    }),
  };
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function exportConversation(messages: ChatMessage[], options: ExportOptions): ExportResult {
  const content =
    options.format === 'json'
      ? serializeJson(messages, options)
      : serializeText(
          messages,
          options,
          options.format === 'markdown' ? markdownPart : textPart,
          options.format === 'markdown'
        );
  return { content, ...FORMAT_META[options.format] };
}

export function getExportFilename(title: string | undefined, format: ExportFormat): string {
  const slug = (title ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return `${slug || 'conversation'}.${FORMAT_META[format].extension}`;
}
