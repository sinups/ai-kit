import React from 'react';
import { Markdown } from './Markdown';

export default { title: 'Markdown' };

const SAMPLE = `# Heading 1

## Heading 2

### Heading 3

#### Heading 4

A paragraph with **bold text**, \`inline code\` and a [link to Mantine](https://mantine.dev) plus an [internal link](/docs).

- First bullet
- Second bullet with \`code\`
- Third bullet

1. Step one
2. Step two
3. Step three

> A quote about something important.

| Column | Type | Description |
| --- | --- | --- |
| id | string | Unique identifier |
| name | string | Display name |
| size | number | Size in bytes |

---

\`\`\`ts
export function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

\`\`\`bash
yarn add @sinups/ai-kit
\`\`\`
`;

export function Usage() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={SAMPLE} />
    </div>
  );
}

export function NumberedListBreaks() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={'1.\n\nFirst item\n2.\n\nSecond item\n3. Third item'} />
    </div>
  );
}

export function UnknownLanguage() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={'```rust\nfn main() {}\n```\n\n```\nplain block\n```'} />
    </div>
  );
}
