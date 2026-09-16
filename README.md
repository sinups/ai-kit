# AI UI Kit

Agent chat UI components for [Mantine](https://mantine.dev): message list, streaming markdown,
tool cards (Bash, Edit, Search, Todo, Plan, Subagent, MCP, Thinking), clarifying questions and a
composable input bar. Built on Mantine primitives and theme tokens, typed to be compatible with
the Vercel AI SDK.

Documentation: https://sinups.github.io/ai-kit

## Installation

```bash
npm install @sinups/ai-kit @mantine/core @mantine/hooks
```

Import the stylesheets once at the root of your app:

```tsx
import '@mantine/core/styles.css';
import '@sinups/ai-kit/styles.css';
```

## Usage

```tsx
import { AgentChat } from '@sinups/ai-kit';
import { useChat } from '@ai-sdk/react';

function Chat() {
  const { messages, status, sendMessage, stop } = useChat();

  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={({ content }) => sendMessage({ text: content })}
      onStop={stop}
    />
  );
}
```

Every component is exported from the package root. Messages are structurally compatible with
`UIMessage` from the AI SDK, so no dependency on `ai` is required. See the
[documentation](https://sinups.github.io/ai-kit/docs) for the full catalog, live previews and
the API reference.

## Repository

| Path        | What it is                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| `package/`  | The npm package (`@sinups/ai-kit`): components, styles, tests and stories   |
| `site/`     | The documentation site (Next.js), deployed to GitHub Pages                  |

### Development

```bash
yarn install
yarn storybook    # component playground on http://localhost:8271
yarn dev          # documentation site on http://localhost:4100
yarn test         # format check, typecheck, lint and unit tests
yarn build        # build the package into package/dist
yarn site:build   # export the documentation site into site/out
```

### Release

```bash
yarn release:patch   # or release:minor / release:major
```

The script builds the package, bumps the version, publishes `@sinups/ai-kit` to npm and pushes
the release commit. The documentation site is deployed to GitHub Pages by the `site` workflow on
every push to `main`.

## Credits

This project is a fork of [Agent Elements](https://github.com/21st-dev/agent-elements) by
[21st.dev](https://21st.dev), released under the MIT License. The component design, behavior,
examples, skills and the documentation site come from that project; the implementation was
rebuilt on Mantine and the distribution became a single npm package. Build tooling is derived
from the [Mantine extension template](https://github.com/mantinedev/extension-template).
See [NOTICE](./NOTICE).

## License

MIT
