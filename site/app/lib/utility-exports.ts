import fs from "node:fs";
import path from "node:path";

export type UtilityExport = {
  name: string;
  kind: "hook" | "function";
  signature: string;
  description: string;
};

export type UtilityGroup = {
  title: string;
  items: UtilityExport[];
};

const SOURCE_ROOT = path.join(process.cwd(), "../package/src");

const CHAT_FOLDERS = new Set([
  "AgentChat",
  "AgentStatus",
  "ChatNotices",
  "CodeBlock",
  "CompactBoundary",
  "ContextEventRow",
  "ContextUsage",
  "ErrorMessage",
  "HookActivity",
  "Markdown",
  "MessageList",
  "TurnSummary",
  "UserMessage",
  "input",
  "question",
  "elicitation",
]);

const GROUP_TITLES: Record<string, string> = {
  chat: "Chat",
  tools: "Tools",
  primitives: "Primitives",
  mcp: "MCP",
  agents: "Agents",
  skills: "Skills",
  permissions: "Permissions",
  "hooks-config": "Hooks configuration",
  sessions: "Sessions",
  "message-actions": "Message actions",
  tasks: "Tasks",
  diff: "Diff",
  "model-settings": "Model settings",
  help: "Help",
  memory: "Memory",
  theme: "Theme",
  launcher: "Launcher",
  shared: "Shared utilities",
};

function groupKey(modulePath: string): string {
  const folder = modulePath.split("/")[0] ?? "";
  if (CHAT_FOLDERS.has(folder)) return "chat";
  if (["utils", "hooks", "styles", "icons"].includes(folder)) return "shared";
  return folder;
}

function resolveModule(modulePath: string): string | null {
  const base = path.join(SOURCE_ROOT, modulePath);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Reads a balanced run of brackets starting at `start`, which must point at an opening bracket */
function readBalanced(text: string, start: number): number {
  const open = text[start];
  const close = open === "(" ? ")" : open === "<" ? ">" : "}";
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return text.length - 1;
}

/** Reads a return type annotation up to the function body or arrow */
function readReturnType(text: string, start: number, stopAtArrow: boolean): string {
  let depth = 0;
  let type = "";
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i] ?? "";
    if (depth === 0) {
      if (stopAtArrow && text.startsWith("=>", i)) break;
      const trimmed = type.trim();
      if (!stopAtArrow && ch === "{" && trimmed && !/[:|&(<,]$|=>$/.test(trimmed)) break;
      if (ch === ";" || ch === "=") break;
    }
    if ("({[<".includes(ch)) depth += 1;
    if (")}]>".includes(ch) && !(ch === ">" && text[i - 1] === "=")) depth -= 1;
    type += ch;
  }
  return type.replace(/\s+/g, " ").trim();
}

function readJsDoc(text: string, index: number): string {
  const before = text.slice(0, index).trimEnd();
  if (!before.endsWith("*/")) return "";
  const start = before.lastIndexOf("/**");
  if (start === -1) return "";
  return before
    .slice(start + 3, before.length - 2)
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .filter((line) => !line.startsWith("@"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/,?\s+\)/g, ")")
    .replace(/,\s*\}/g, " }")
    .trim();
}

function extractFunction(text: string, name: string): Omit<UtilityExport, "name" | "kind"> | null {
  const fnMatch = new RegExp(`export (?:async )?function ${name}\\b`).exec(text);
  if (fnMatch) {
    let i = fnMatch.index + fnMatch[0].length;
    let generics = "";
    if (text[i] === "<") {
      const end = readBalanced(text, i);
      generics = text.slice(i, end + 1);
      i = end + 1;
    }
    const paramsStart = text.indexOf("(", i);
    const paramsEnd = readBalanced(text, paramsStart);
    const params = text.slice(paramsStart, paramsEnd + 1);
    let returnType = "";
    const rest = text.slice(paramsEnd + 1).trimStart();
    if (rest.startsWith(":")) {
      returnType = readReturnType(text, text.indexOf(":", paramsEnd) + 1, false);
    }
    return {
      signature: compact(`${name}${generics}${params}${returnType ? `: ${returnType}` : ""}`),
      description: readJsDoc(text, fnMatch.index),
    };
  }

  const constMatch = new RegExp(`export const ${name}\\s*(?::[^=]+)?=\\s*(?:async\\s*)?(?=[(<])`).exec(
    text,
  );
  if (constMatch) {
    let i = constMatch.index + constMatch[0].length;
    let generics = "";
    if (text[i] === "<") {
      const end = readBalanced(text, i);
      generics = text.slice(i, end + 1);
      i = end + 1;
    }
    if (text[i] !== "(") return null;
    const paramsEnd = readBalanced(text, i);
    const params = text.slice(i, paramsEnd + 1);
    const rest = text.slice(paramsEnd + 1).trimStart();
    const returnType = rest.startsWith(":")
      ? readReturnType(text, text.indexOf(":", paramsEnd) + 1, true)
      : "";
    return {
      signature: compact(`${name}${generics}${params}${returnType ? `: ${returnType}` : ""}`),
      description: readJsDoc(text, constMatch.index),
    };
  }
  return null;
}

function collectNames(indexText: string): Array<{ name: string; modulePath: string }> {
  const entries: Array<{ name: string; modulePath: string }> = [];

  for (const match of indexText.matchAll(/export \{([^}]+)\} from '\.\/(.+?)'/g)) {
    const [, names = "", modulePath = ""] = match;
    for (const raw of names.split(",")) {
      const name = raw.trim();
      if (name && !name.startsWith("type ")) entries.push({ name, modulePath });
    }
  }

  for (const match of indexText.matchAll(/export \* from '\.\/(.+?)'/g)) {
    const modulePath = match[1] ?? "";
    const file = resolveModule(modulePath);
    if (!file) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const exported of text.matchAll(/export (?:async )?(?:function|const) ([a-z]\w*)/g)) {
      if (exported[1]) entries.push({ name: exported[1], modulePath });
    }
  }

  return entries;
}

let cache: UtilityGroup[] | null = null;

export function getUtilityGroups(): UtilityGroup[] {
  if (cache) return cache;
  const indexText = fs.readFileSync(path.join(SOURCE_ROOT, "index.ts"), "utf8");
  const groups = new Map<string, UtilityExport[]>();
  const seen = new Set<string>();

  for (const { name, modulePath } of collectNames(indexText)) {
    if (seen.has(name) || !/^[a-z]/.test(name)) continue;
    const file = resolveModule(modulePath);
    if (!file) continue;
    const extracted = extractFunction(fs.readFileSync(file, "utf8"), name);
    if (!extracted) continue;
    seen.add(name);
    const key = groupKey(modulePath);
    const items = groups.get(key) ?? [];
    items.push({ name, kind: /^use[A-Z]/.test(name) ? "hook" : "function", ...extracted });
    groups.set(key, items);
  }

  cache = Object.keys(GROUP_TITLES)
    .filter((key) => groups.has(key))
    .map((key) => ({
      title: GROUP_TITLES[key] ?? key,
      items: (groups.get(key) ?? []).sort(
        (a, b) => Number(b.kind === "hook") - Number(a.kind === "hook") || a.name.localeCompare(b.name),
      ),
    }));
  return cache;
}
