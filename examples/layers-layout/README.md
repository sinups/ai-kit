# Layers chat layout approval demo

This isolated demo uses the local AI-kit source, not the Layers application.
It does not connect to MCP, an LLM, or a backend. All content and timings are
synthetic. No credentials or workspace data are needed.

## Run

From the repository root, with the existing dependencies installed:

```sh
node node_modules/vite/bin/vite.js --config examples/layers-layout/vite.config.ts
```

Open http://127.0.0.1:4314/. The port is strict and the host is loopback only.

## Component Map

| Need | Stock component or configuration |
| --- | --- |
| Full transcript and composer | AgentChat |
| Initial screen and suggested prompts | AgentChat emptyState |
| Processing before text / between tools | workingRow, built-in SpiralLoader |
| Quiet animated activity with click-to-open details | quietPresentation |
| Alternative detailed tool presentation | presentation="cards" |
| Tool names and safe descriptions | toolCatalog, toolArgs, toolOutputs |
| Write permission | approvals and the kit approval controls |
| Text, lists, tables and links | Built-in Markdown rendering |
| Demonstration page preview | Mantine Modal containing kit Markdown |
| Stream appearance | frameBatched, animateAppearance, kit streaming renderer |

There is no custom tool renderer. The header controls are demonstration controls,
not a proposed production toolbar. Approval copy is specific to creating a private
page. Real publication, deletion, and other actions need their own summaries.

## Scenarios

Use the scenario selector before sending a message: page search, private page
creation, no results, or service failure. Compare compact history and detailed
cards. Try light/dark themes, click a page link, approve/reject a creation, and stop
while waiting or writing the answer. Approval never advances on a timer.

The demo contains one turn at a time. Sending again replaces the previous fixture.
Retry repeats the selected fixture, including its simulated failure. Hash links
open local fixture pages, not real workspace entities. Timers cannot demonstrate
network latency, actual model behavior, or real transaction cancellation. A stop
after a completed simulated creation retains that completed result.

## Checks

```sh
node node_modules/jest/bin/jest.js --runInBand --roots examples/layers-layout --runTestsByPath examples/layers-layout/demo.test.tsx
node node_modules/typescript/bin/tsc -p examples/layers-layout/tsconfig.json --noEmit
node node_modules/vite/bin/vite.js build --config examples/layers-layout/vite.config.ts
node node_modules/oxlint/bin/oxlint -c oxlint.config.mjs examples/layers-layout
```

Tests cover waiting, stop cleanup, indefinite consent, rejection, completed-write
truthfulness, stopping during consent, and the completed answer link. Screenshots
in evidence/ are synthetic UI fixtures, not production acceptance evidence.

Approve this composition before connecting it to the real Layers transport.
