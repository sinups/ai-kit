"use client";

import React, { useMemo } from "react";
import type { ChatMessage } from "@sinups/ai-kit";
import { AgentChat, InputBar } from "@sinups/ai-kit";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { getDocNav } from "@/app/utils/doc-nav";

type TextPart = { type: "text"; text: string };
type ToolPartBase = Extract<
  ChatMessage["parts"][number],
  { type: `tool-${string}` }
>;

const textPart = (text: string): TextPart => ({ type: "text", text });
const filePart = (filename: string, size?: number) =>
  ({
    type: "file",
    filename,
    size,
  }) as unknown as ChatMessage["parts"][number];

function toolPart(
  toolName: string,
  {
    toolCallId,
    state,
    input,
    output,
  }: {
    toolCallId: string;
    state: "input-streaming" | "input-available" | "output-available";
    input?: Record<string, unknown>;
    output?: unknown;
  },
): ToolPartBase {
  return {
    type: `tool-${toolName}` as const,
    toolCallId,
    state,
    input,
    output,
    result: output,
  } as ToolPartBase;
}

function buildConversation(): ChatMessage[] {
  return [
    {
      id: "demo-user-1",
      role: "user",
      parts: [
        textPart(
          "Add an info banner to InputBar with a title, description, and a close action. Keep the rounded corners, update the docs, and run tests.",
        ),
      ],
    },
    {
      id: "demo-assistant-1",
      role: "assistant",
      parts: [
        toolPart("Thinking", {
          toolCallId: "think-setup",
          state: "output-available",
          input: {
            thought:
              "Plan: locate InputBar composition and context items; add a top info bar with close action that keeps rounding intact. Then update docs + previews to include the info bar example and outline example. Finally run tests and summarize changes.",
          },
        }),
        textPart(
          "Got it. I will scan InputBar + docs to confirm structure, add a compact info banner that preserves the rounded frame, wire a close handler, update docs/examples, and run tests. I will also add a preview case so the banner state is visible in the component docs, plus a focused example that shows the outline token on the input field.",
        ),
        toolPart("Task", {
          toolCallId: "task-root",
          state: "output-available",
          input: {
            description:
              "Deep pass: map InputBar composition, update docs + previews, and validate with tests",
          },
          output: { totalDurationMs: 11850 },
        }),
        toolPart("Bash", {
          toolCallId: "task-root:1",
          state: "output-available",
          input: { command: 'rg "InputBar" package/src site/app' },
          output: {
            stdout:
              "package/src/input/InputBar.tsx\nsite/app/data/component-docs.ts\napp/components/component-example-preview.tsx\n",
          },
        }),
        toolPart("Read", {
          toolCallId: "task-root:2",
          state: "output-available",
          input: { file_path: "/package/src/input/InputBar.tsx" },
          output: { content: "..." },
        }),
        toolPart("Read", {
          toolCallId: "task-root:3",
          state: "output-available",
          input: { file_path: "/site/app/data/component-docs.ts" },
          output: { content: "..." },
        }),
        toolPart("Read", {
          toolCallId: "task-root:4",
          state: "output-available",
          input: { file_path: "/app/components/component-example-preview.tsx" },
          output: { content: "..." },
        }),
      ],
    },
    {
      id: "demo-assistant-2",
      role: "assistant",
      parts: [
        textPart("Scanning for InputBar usage and docs..."),
        toolPart("Grep", {
          toolCallId: "grep-1",
          state: "output-available",
          input: { pattern: "InputBar", path: "package/src" },
          output: {
            results: [
              {
                source: "web",
                title: "package/src/input/InputBar.tsx",
                date: "repo",
              },
              {
                source: "web",
                title: "site/app/data/component-docs.ts",
                date: "repo",
              },
              {
                source: "web",
                title: "app/components/component-example-preview.tsx",
                date: "repo",
              },
            ],
            tabs: [{ source: "web", label: "Repo", count: 3 }],
          },
        }),
      ],
    },
    {
      id: "demo-assistant-3",
      role: "assistant",
      parts: [
        textPart(
          "Adding the info banner to InputBar and wiring the close action.",
        ),
        toolPart("Task", {
          toolCallId: "inputbar-task",
          state: "output-available",
          input: { description: "Add info banner to InputBar" },
          output: { totalDurationMs: 4320 },
        }),
        toolPart("Edit", {
          toolCallId: "inputbar-task:1",
          state: "output-available",
          input: { file_path: "/package/src/input/InputBar.tsx" },
          output: {
            old_content:
              'export function InputBar(...) {\n  return (\n    <div className="relative ...">\n      ...\n    </div>\n  );\n}\n',
            content:
              'export function InputBar(...) {\n  return (\n    <div className="relative ...">\n      <div className="info-bar">\n        <span className="title">Syncing workspace</span>\n        <span className="desc">We will keep watching for changes.</span>\n        <button aria-label="Close">x</button>\n      </div>\n      ...\n    </div>\n  );\n}\n',
            structuredPatch: [
              {
                lines: [
                  '+  <div className="info-bar">',
                  '+    <span className="title">Syncing workspace</span>',
                  '+    <span className="desc">We will keep watching for changes.</span>',
                  '+    <button aria-label="Close">x</button>',
                  "+  </div>",
                ],
              },
            ],
          },
        }),
        toolPart("Edit", {
          toolCallId: "inputbar-task:2",
          state: "output-available",
          input: { file_path: "/package/src/input/InputBar.tsx" },
          output: {
            old_content:
              'const [infoOpen, setInfoOpen] = useState(true);\n\nreturn (\n  <div className="relative ...">\n    <div className="info-bar">\n      ...\n    </div>\n  </div>\n);\n',
            content:
              'const [infoOpen, setInfoOpen] = useState(true);\n\nreturn (\n  <div className="relative ...">\n    {infoOpen && (\n      <div className="info-bar">\n        ...\n        <button aria-label="Close" onClick={() => setInfoOpen(false)}>x</button>\n      </div>\n    )}\n  </div>\n);\n',
            structuredPatch: [
              {
                lines: [
                  "+  {infoOpen && (",
                  '+    <div className="info-bar">',
                  "+      ...",
                  '+      <button aria-label="Close" onClick={() => setInfoOpen(false)}>x</button>',
                  "+    </div>",
                  "+  )}",
                ],
              },
            ],
          },
        }),
      ],
    },
    {
      id: "demo-assistant-3b",
      role: "assistant",
      parts: [
        textPart(
          "Tightening the banner spacing and aligning it with the rounded shell.",
        ),
        toolPart("Edit", {
          toolCallId: "edit-3",
          state: "output-available",
          input: { file_path: "/package/src/input/InputBar.tsx" },
          output: {
            old_content:
              '<div className="info-bar">\n  <span className="title">Syncing workspace</span>\n  <span className="desc">We will keep watching for changes.</span>\n  <button aria-label="Close">x</button>\n</div>',
            content:
              '<div className="info-bar flex items-center gap-2 px-3 py-2 rounded-md">\n  <span className="title text-xs font-medium">Syncing workspace</span>\n  <span className="desc text-xs text-muted-foreground">We will keep watching for changes.</span>\n  <button aria-label="Close">x</button>\n</div>',
            structuredPatch: [
              {
                lines: [
                  '+<div className="info-bar flex items-center gap-2 px-3 py-2 rounded-md">',
                  '+  <span className="title text-xs font-medium">Syncing workspace</span>',
                  '+  <span className="desc text-xs text-muted-foreground">We will keep watching for changes.</span>',
                ],
              },
            ],
          },
        }),
      ],
    },
    {
      id: "demo-user-2",
      role: "user",
      parts: [
        textPart(
          "Nice. Please include a docs example for the info bar state and keep the input outline visible in the preview.",
        ),
      ],
    },
    {
      id: "demo-assistant-4",
      role: "assistant",
      parts: [
        textPart("Updating the InputBar docs and examples."),
        toolPart("Task", {
          toolCallId: "docs-task",
          state: "output-available",
          input: { description: "Update docs, previews, and run lint" },
          output: { totalDurationMs: 8240 },
        }),
        toolPart("Write", {
          toolCallId: "docs-task:1",
          state: "output-available",
          input: { file_path: "/site/app/data/component-docs.ts" },
          output: {
            content:
              '{\n  type: "example",\n  title: "Info bar",\n  previewId: "InputBar/info",\n  code: "<InputBar infoBar={{ title: \'Syncing workspace\', description: \'We will keep watching for changes.\', onClose: () => {} }} />",\n}\n',
          },
        }),
        toolPart("Edit", {
          toolCallId: "docs-task:2",
          state: "output-available",
          input: { file_path: "/app/components/component-example-preview.tsx" },
          output: {
            old_content: 'case "InputBar/base":\n  return <InputBar />;\n',
            content:
              'case "InputBar/base":\n  return <InputBar autoFocus />;\n\ncase "InputBar/info":\n  return (\n    <InputBar\n      autoFocus\n      infoBar={{\n        title: "Syncing workspace",\n        description: "We will keep watching for changes.",\n        onClose: () => {},\n      }}\n    />\n  );\n',
            structuredPatch: [
              {
                lines: [
                  '+case "InputBar/info":',
                  "+  return (",
                  "+    <InputBar",
                  "+      autoFocus",
                  "+      infoBar={{",
                  '+        title: "Syncing workspace",',
                  '+        description: "We will keep watching for changes.",',
                  "+        onClose: () => {},",
                  "+      }}",
                  "+    />",
                  "+  );",
                ],
              },
            ],
          },
        }),
        toolPart("Bash", {
          toolCallId: "docs-task:3",
          state: "output-available",
          input: { command: "pnpm lint" },
          output: {
            stdout: "Lint complete. 0 errors\n",
            exitCode: 0,
          },
        }),
      ],
    },
    {
      id: "demo-assistant-4b",
      role: "assistant",
      parts: [
        textPart("Quick check on the output diff before tests."),
        toolPart("Bash", {
          toolCallId: "bash-diff-1",
          state: "output-available",
          input: { command: "git diff --stat" },
          output: {
            stdout:
              " package/src/input/InputBar.tsx | 14 ++++++++++\n site/app/data/component-docs.ts  |  6 +++++\n app/components/component-example-preview.tsx | 18 ++++++++++++++\n 3 files changed, 38 insertions(+)\n",
          },
        }),
      ],
    },
    {
      id: "demo-user-3",
      role: "user",
      parts: [textPart("Run tests afterward and summarize the changes.")],
    },
    {
      id: "demo-assistant-5",
      role: "assistant",
      parts: [
        textPart("Running tests."),
        toolPart("Bash", {
          toolCallId: "bash-1",
          state: "output-available",
          input: { command: "pnpm test" },
          output: {
            stdout:
              "PASS  input-bar.test.tsx\nPASS  docs-inputbar.test.tsx\n\nTests: 12 passed\n",
            exitCode: 0,
          },
        }),
      ],
    },
    {
      id: "demo-assistant-6",
      role: "assistant",
      parts: [
        textPart(
          "All set. Info banner is added to InputBar, docs updated with a new example, and tests are green.",
        ),
      ],
    },
  ];
}

function buildCustomerSupportConversation(): ChatMessage[] {
  return [
    {
      id: "support-user-1",
      role: "user",
      parts: [
        textPart(
          "Customer says they were charged twice for order #A-10492 and wants a refund. Please handle and reply.",
        ),
      ],
    },
    {
      id: "support-assistant-1",
      role: "assistant",
      parts: [
        textPart(
          "I will review the ticket, verify the charges, check the refund policy, issue a refund if eligible, and draft the response.",
        ),
        toolPart("Task", {
          toolCallId: "support-task-1",
          state: "output-available",
          input: {
            description:
              "Investigate duplicate charge, validate policy, issue refund, draft reply",
          },
          output: { totalDurationMs: 10450 },
        }),
        toolPart("Search", {
          toolCallId: "support-task-1:1",
          state: "output-available",
          input: { query: "refund policy duplicate charge" },
          output: {
            results: [
              {
                title: "Billing and refunds policy",
                url: "https://help.example.com/policies/refunds",
                snippet:
                  "Duplicate charges are refunded immediately once verified. Processing time 3-5 business days.",
              },
            ],
          },
        }),
        toolPart("Read", {
          toolCallId: "support-task-1:2",
          state: "output-available",
          input: { file_path: "/support/tickets/A-10492.json" },
          output: { content: "..." },
        }),
        toolPart("Read", {
          toolCallId: "support-task-1:3",
          state: "output-available",
          input: { file_path: "/support/orders/A-10492.json" },
          output: { content: "..." },
        }),
      ],
    },
    {
      id: "support-assistant-2",
      role: "assistant",
      parts: [
        textPart("Confirming charge history and payment processor status."),
        toolPart("Bash", {
          toolCallId: "support-task-1:4",
          state: "output-available",
          input: { command: "support-cli payments:lookup A-10492" },
          output: {
            stdout:
              "Charge 1: settled $84.00\nCharge 2: settled $84.00\nDuplicate detected: true\n",
            exitCode: 0,
          },
        }),
        toolPart("Bash", {
          toolCallId: "support-task-1:5",
          state: "output-available",
          input: {
            command: "support-cli refunds:create A-10492 --amount 84.00",
          },
          output: {
            stdout: "Refund created: R-55912 (pending)\n",
            exitCode: 0,
          },
        }),
      ],
    },
    {
      id: "support-assistant-3",
      role: "assistant",
      parts: [
        textPart("Drafting the response and logging the resolution."),
        toolPart("Write", {
          toolCallId: "support-task-1:6",
          state: "output-available",
          input: { file_path: "/support/outgoing/A-10492-response.txt" },
          output: {
            content:
              "Hi Jamie,\n\nThanks for flagging this. We verified a duplicate charge on order A-10492 and have issued a full refund for the extra $84.00. The refund is now pending and should post in 3-5 business days depending on your bank.\n\nIf you see any issues or need a receipt, reply here and I will help right away.\n\nBest,\nSupport Team\n",
          },
        }),
        toolPart("Write", {
          toolCallId: "support-task-1:7",
          state: "output-available",
          input: { file_path: "/support/logs/A-10492-resolution.json" },
          output: {
            content:
              '{\n  "ticketId": "A-10492",\n  "issue": "duplicate_charge",\n  "status": "refund_pending",\n  "refundId": "R-55912",\n  "amount": 84.0,\n  "currency": "USD",\n  "resolutionNote": "Duplicate charge confirmed and refund issued.",\n  "agent": "support-agent-01",\n  "resolvedAt": "2026-03-27T14:22:00Z"\n}\n',
          },
        }),
      ],
    },
    {
      id: "support-assistant-4",
      role: "assistant",
      parts: [
        textPart(
          "All set. Duplicate charge confirmed, refund issued (R-55912), and the customer response is drafted with expected timing.",
        ),
      ],
    },
  ];
}

function buildCustomerSupportWidgetConversation(): ChatMessage[] {
  const messages: Array<ChatMessage & { createdAt?: string }> = [
    {
      id: "widget-user-1",
      role: "user",
      createdAt: "2026-03-27T15:08:00Z",
      parts: [
        textPart(
          "Hi, my order says delivered but I never received it. Can you help?",
        ),
        filePart("delivery-details.pdf", 182000),
      ],
    },
    {
      id: "widget-assistant-1",
      role: "assistant",
      createdAt: "2026-03-27T15:08:18Z",
      parts: [
        textPart(
          "I can help with that. Can you confirm the delivery address and a good phone number in case the carrier needs it?",
        ),
      ],
    },
    {
      id: "widget-user-2",
      role: "user",
      createdAt: "2026-03-27T15:08:54Z",
      parts: [textPart("Address is 88 Larch St, and my phone is 555-0142.")],
    },
    {
      id: "widget-assistant-2",
      role: "assistant",
      createdAt: "2026-03-27T15:09:20Z",
      parts: [
        textPart(
          "Thanks. I see the carrier marked it delivered yesterday at 4:40pm with no signature required. I can open a carrier investigation right now and, once that is filed, offer a replacement or refund.",
        ),
      ],
    },
    {
      id: "widget-assistant-3",
      role: "assistant",
      createdAt: "2026-03-27T15:10:01Z",
      parts: [
        textPart(
          "Would you prefer a replacement or a refund? If you want, I can also have the carrier re-check the drop-off location.",
        ),
      ],
    },
    {
      id: "widget-user-3",
      role: "user",
      createdAt: "2026-03-27T15:10:30Z",
      parts: [textPart("Replacement please, and yes check the drop-off.")],
    },
    {
      id: "widget-assistant-4",
      role: "assistant",
      createdAt: "2026-03-27T15:11:02Z",
      parts: [
        textPart(
          "Got it. I will start a carrier investigation and send a replacement today. I will follow up once I have the carrier confirmation.",
        ),
      ],
    },
  ];
  return messages as ChatMessage[];
}

function buildEngineeringPlanConversation(): ChatMessage[] {
  return [
    {
      id: "eng-user-1",
      role: "user",
      parts: [
        textPart(
          "We need to add rate limiting and request metrics to the API gateway. Can you plan the rollout and show what you would change?",
        ),
      ],
    },
    {
      id: "eng-assistant-1",
      role: "assistant",
      parts: [
        textPart("Drafting a rollout plan and scoping the changes."),
        toolPart("PlanWrite", {
          toolCallId: "plan-1",
          state: "output-available",
          input: {
            plan: {
              id: "plan-1",
              title: "API gateway rate limiting + metrics rollout",
              summary:
                "1. Audit current gateway middleware to locate request lifecycle hooks and identify where to add limiter + metrics.\n2. Implement rate limiting with configurable burst/limit (per API key + IP fallback).\n3. Add request metrics (latency, status codes, rate-limit rejections) and export via existing metrics pipeline.\n4. Roll out behind a feature flag with staged enablement (internal -> 10% -> 50% -> 100%).\n5. Add dashboards + alerts for limiter hits and error budgets, then document the change.",
            },
            approved: true,
          },
          output: { ok: true },
        }),
        toolPart("Task", {
          toolCallId: "eng-task",
          state: "output-available",
          input: {
            description:
              "Locate gateway hooks, add limiter + metrics, and prepare rollout notes",
          },
          output: { totalDurationMs: 9320 },
        }),
        toolPart("Grep", {
          toolCallId: "eng-task:1",
          state: "output-available",
          input: { pattern: "gateway", path: "services" },
          output: {
            results: [
              {
                source: "repo",
                title: "services/gateway/src/middleware/metrics.ts",
                date: "repo",
              },
              {
                source: "repo",
                title: "services/gateway/src/middleware/rate-limit.ts",
                date: "repo",
              },
            ],
            tabs: [{ source: "repo", label: "Repo", count: 2 }],
          },
        }),
        toolPart("Read", {
          toolCallId: "eng-task:2",
          state: "output-available",
          input: { file_path: "/services/gateway/src/middleware/metrics.ts" },
          output: { content: "..." },
        }),
        toolPart("Bash", {
          toolCallId: "eng-task:3",
          state: "output-available",
          input: { command: "pnpm -C services/gateway test" },
          output: { stdout: "PASS gateway-rate-limit.test.ts\n", exitCode: 0 },
        }),
      ],
    },
    {
      id: "eng-assistant-2",
      role: "assistant",
      parts: [
        textPart(
          "## Rollout summary\n\n**What changes**\n- Add a token-bucket limiter (per API key, IP fallback).\n- Emit metrics: request latency, status code counts, and rate-limit rejects.\n- Gate via feature flag with staged rollout.\n\n**Config sketch**\n```ts\nexport const rateLimit = {\n  limit: 120,\n  windowSeconds: 60,\n  burst: 20,\n};\n```\n\n**Monitoring**\n| Metric | Purpose |\n| --- | --- |\n| gateway.rate_limit.rejected | Track blocks by key/IP |\n| gateway.request.duration_ms | Latency distribution |\n| gateway.status_codes | Error budget watch |\n\nIf you want, I can draft the dashboard panels next.",
        ),
      ],
    },
  ];
}

export default function UseCasesPage() {
  const messages = useMemo(() => buildConversation(), []);
  const supportMessages = useMemo(() => buildCustomerSupportConversation(), []);
  const widgetMessages = useMemo(() => buildCustomerSupportWidgetConversation(), []);
  const engineeringMessages = useMemo(() => buildEngineeringPlanConversation(), []);
  const { previousHref, nextHref } = getDocNav("/docs/use-cases");
  // Note: no autoFocus here. These are static read-only transcripts, and
  // autoFocus on an InputBar near the bottom of the page would make the
  // browser scroll the outer <main> container down to reveal the focused
  // field, defeating initialScrollBehavior="top".
  const InputBarSlot = (props: React.ComponentProps<typeof InputBar>) => (
    <InputBar {...props} />
  );
  const WidgetInputBarSlot = (props: React.ComponentProps<typeof InputBar>) => (
    <InputBar {...props} onAttach={() => {}} />
  );

  return (
    <DocPageShell
      sections={[
        { id: "coding-agent", label: "Coding agent" },
        { id: "support-workflow", label: "Internal customer support" },
        { id: "support-widget", label: "Support chat widget" },
        { id: "engineering-plan", label: "Engineering plan" },
      ]}
    >
      <header className="space-y-2">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">Use cases</h1>
          <DocNavButton
            title="Use cases"
            description="Realistic scenarios built with AI UI Kit components."
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          Realistic scenarios built with AI UI Kit components.
        </p>
      </header>

      <div id="coding-agent" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Coding agent
        </div>
        <p className="text-base text-muted-foreground">
          A realistic coding conversation with planning, tools, diffs, and
          tests.
        </p>
        <div
          style={
            { "--ae-input-focus-outline": "var(--mantine-color-cyan-5)" } as React.CSSProperties
          }
        >
          <div className="border border-border rounded-lg overflow-hidden bg-background h-[680px]">
            <AgentChat
              messages={messages}
              onSend={() => {}}
              status="ready"
              onStop={() => {}}
              slots={{ InputBar: InputBarSlot }}
              showCopyToolbar={false}
              initialScrollBehavior="top"
            />
          </div>
        </div>
      </div>

      <div id="support-workflow" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Internal customer support
        </div>
        <p className="text-base text-muted-foreground">
          A support workflow that verifies billing, issues a refund, and drafts
          the response.
        </p>
        <div className="border border-border rounded-lg overflow-hidden bg-background h-[560px]">
          <AgentChat
            messages={supportMessages}
            onSend={() => {}}
            status="ready"
            onStop={() => {}}
            slots={{ InputBar: InputBarSlot }}
            showCopyToolbar={true}
            initialScrollBehavior="top"
          />
        </div>
      </div>

      <div id="support-widget" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Support chat widget
        </div>
        <p className="text-base text-muted-foreground">
          A lightweight web chat experience handling a delivery issue.
        </p>
        <div className="border border-border rounded-lg overflow-hidden bg-background h-[520px]">
          <AgentChat
            messages={widgetMessages}
            onSend={() => {}}
            status="ready"
            onStop={() => {}}
            slots={{ InputBar: WidgetInputBarSlot }}
            initialScrollBehavior="top"
          />
        </div>
      </div>

      <div id="engineering-plan" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Engineering plan
        </div>
        <p className="text-base text-muted-foreground">
          Plan and roll out rate limiting plus request metrics on the API
          gateway.
        </p>
        <div className="border border-border rounded-lg overflow-hidden bg-background h-[560px]">
          <AgentChat
            messages={engineeringMessages}
            onSend={() => {}}
            status="ready"
            onStop={() => {}}
            slots={{ InputBar: InputBarSlot }}
            initialScrollBehavior="top"
          />
        </div>
      </div>
    </DocPageShell>
  );
}
