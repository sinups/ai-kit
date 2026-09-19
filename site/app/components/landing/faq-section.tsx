import { INSTALL_COMMAND } from "@/app/lib/package-info";
import { PACKAGE_NAME } from "@/app/lib/site";

export const FAQ = [
  {
    question: "What is AI UI Kit?",
    answer: `AI UI Kit (${PACKAGE_NAME}) is an open-source React UI kit for agent products, built on Mantine 9. It has the agent chat (streaming Markdown messages, tool call cards, tool approval UI and the composer) and the screens around it: model settings, MCP servers, agents, skills, permissions, hooks, sessions, background tasks and diff review.`,
  },
  {
    question: "How do I install it?",
    answer: `Run ${INSTALL_COMMAND}, import @mantine/core/styles.css and ${PACKAGE_NAME}/styles.css once at the app root, and render the components inside MantineProvider. A coding agent can do it from the prompt in the "Set up with your agent" section above.`,
  },
  {
    question: "What does it work with?",
    answer:
      "React 19 and Mantine 9. Chat messages are structurally compatible with UIMessage from the Vercel AI SDK, so the output of useChat() can be passed to AgentChat directly, without a dependency on the ai package. The kit makes no network requests: it renders the state you pass and reports what the user does through callbacks, so any transport or model backend works.",
  },
  {
    question: "Does it show MCP tool calls?",
    answer:
      "Yes. Tool calls render as cards or as quiet rows, with Allow and Deny under any call. toolCatalog, toolArgs and toolOutputs turn MCP calls into readable titles, arguments and results, and the MCP module has the server list, a server wizard and tool details.",
  },
  {
    question: "What is the license?",
    answer:
      "MIT. AI UI Kit is a fork of Agent Elements by 21st.dev (MIT), rebuilt on Mantine.",
  },
];

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="border-t border-border px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <h2
          id="faq-title"
          className="text-balance text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em] text-foreground"
        >
          Questions, answered.
        </h2>
        <dl className="flex flex-col divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <div key={item.question} className="flex flex-col gap-2 py-5">
              <dt className="text-lg font-medium tracking-[-0.02em] text-foreground">{item.question}</dt>
              <dd className="text-pretty text-[15px] leading-relaxed text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
