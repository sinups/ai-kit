import type { ModelOption } from "@sinups/ai-kit";

/** Sample models used across the documentation previews */
export const DEMO_MODELS: ModelOption[] = [
  { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" },
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" },
  { id: "mistral-small-24b", name: "Mistral Small", version: "24B" },
];

export const DEFAULT_MODEL_ID = "llama-3.3-70b";
