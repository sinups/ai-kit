import fs from "node:fs";
import path from "node:path";

export type ApiProp = {
  name: string;
  type: string;
  required: boolean;
};

const SOURCE_DIRS = ["../package/src"];

const FALLBACK_TYPE_FILES = ["../package/src/types.ts"];

export function getComponentProps(componentName: string): ApiProp[] | null {
  const sourceFile = findComponentSource(componentName);
  const candidateFiles = [
    ...(sourceFile ? [sourceFile] : []),
    ...FALLBACK_TYPE_FILES.map((relPath) => path.join(process.cwd(), relPath)),
  ];

  let block: string | null = null;
  for (const file of candidateFiles) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    block = extractPropsBlock(text, `${componentName}Props`);
    if (block) break;
  }

  if (!block) return null;

  const props: ApiProp[] = [];
  let i = 0;
  while (i < block.length) {
    const nameMatch = block.slice(i).match(/\s*(\w+)(\?)?:\s*/);
    if (!nameMatch) break;
    const nameIndex = i + (nameMatch.index ?? 0);
    const name = nameMatch[1];
    if (!name) break;
    const required = !nameMatch[2];
    i = nameIndex + nameMatch[0].length;

    let type = "";
    let depth = 0;
    while (i < block.length) {
      const ch = block[i] ?? "";
      if (ch === "{" || ch === "(" || ch === "[") depth += 1;
      if (ch === "}" || ch === ")" || ch === "]") depth -= 1;
      if (ch === ";" && depth <= 0) {
        i += 1;
        break;
      }
      type += ch;
      i += 1;
    }

    const cleaned = type.replace(/\s+/g, " ").trim();
    if (cleaned) {
      props.push({ name, required, type: cleaned });
    }
  }
  return props.length > 0 ? props : null;
}

function extractPropsBlock(text: string, typeName: string): string | null {
  const patterns = [
    new RegExp(`type ${typeName}\\s*=\\s*\\{`),
    new RegExp(`interface ${typeName}(?:\\s+extends[^{]+)?\\s*\\{`),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const openBrace = text.indexOf("{", match.index + match[0].length - 1);
    if (openBrace === -1) continue;

    let depth = 0;
    for (let i = openBrace; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      if (depth === 0) {
        return text.slice(openBrace + 1, i);
      }
    }
  }

  return null;
}

function findComponentSource(componentName: string): string | null {
  for (const relDir of SOURCE_DIRS) {
    const absDir = path.join(process.cwd(), relDir);
    const found = findComponentInDir(absDir, componentName);
    if (found) return found;
  }
  return null;
}

function findComponentInDir(dir: string, componentName: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findComponentInDir(fullPath, componentName);
      if (nested) return nested;
      continue;
    }
    if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;
    const text = fs.readFileSync(fullPath, "utf8");
    if (
      text.includes(`export function ${componentName}`) ||
      text.includes(`export const ${componentName}`) ||
      text.includes(`function ${componentName}`)
    ) {
      return fullPath;
    }
  }
  return null;
}
