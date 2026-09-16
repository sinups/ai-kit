import type { ModelOption } from "@sinups/ai-kit";

/** Sample models used across the documentation previews */
export const CLAUDE_MODELS: ModelOption[] = [
  { id: "sonnet", name: "Sonnet", version: "4.6" },
  { id: "opus", name: "Opus", version: "4.7" },
  { id: "haiku", name: "Haiku", version: "4.5" },
];

export const DEFAULT_MODEL_ID = "sonnet";
