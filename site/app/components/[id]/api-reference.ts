import fs from "node:fs";
import path from "node:path";

export type ApiProp = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
};

type PropsDeclaration = {
  body: string;
  bases: string[];
};

const SOURCE_DIRS = ["../package/src"];

const FALLBACK_TYPE_FILES = ["../package/src/types.ts"];

export function getComponentProps(componentName: string): ApiProp[] | null {
  const sourceFile = findComponentSource(componentName);
  const candidateFiles = [
    ...(sourceFile ? [sourceFile] : []),
    ...FALLBACK_TYPE_FILES.map((relPath) => path.join(process.cwd(), relPath)),
  ];

  for (const file of candidateFiles) {
    if (!fs.existsSync(file)) continue;
    const props = collectProps(fs.readFileSync(file, "utf8"), `${componentName}Props`);
    if (props) return props.length > 0 ? props : null;
  }
  return null;
}

function collectProps(text: string, typeName: string, seen = new Set<string>()): ApiProp[] | null {
  if (seen.has(typeName)) return [];
  seen.add(typeName);

  const declaration = extractPropsDeclaration(text, typeName);
  if (!declaration) return null;

  const props: ApiProp[] = parseMembers(declaration.body).map((prop) => ({
    ...prop,
    description: findMemberDoc(declaration.body, prop.name),
  }));
  const own = new Set(props.map((prop) => prop.name));

  for (const base of declaration.bases) {
    const match = base.match(/^(?:Omit<\s*(\w+)\s*,([^>]*)>|(\w+))$/);
    const baseName = match?.[1] ?? match?.[3];
    if (!baseName) continue;
    const omitted = new Set([...(match?.[2] ?? "").matchAll(/'(\w+)'|"(\w+)"/g)].map((m) => m[1] ?? m[2]));
    const baseText = extractPropsDeclaration(text, baseName) ? text : findDeclarationText(baseName);
    if (!baseText) continue;
    for (const prop of collectProps(baseText, baseName, seen) ?? []) {
      if (own.has(prop.name) || omitted.has(prop.name)) continue;
      own.add(prop.name);
      props.push(prop);
    }
  }
  return props;
}

/** JSDoc of a top-level member: formatted sources indent members of the declaration by two spaces */
function findMemberDoc(body: string, name: string): string | undefined {
  const match = new RegExp(`\\n  /\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*\\n  (?:readonly )?${name}\\??:`).exec(`\n${body}`);
  if (!match?.[1]) return undefined;
  const text = match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").replace(/^@deprecated\s*/, "Deprecated. "))
    .filter((line) => !line.startsWith("@"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

function parseMembers(source: string): ApiProp[] {
  const block = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

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
  return props;
}

function extractPropsDeclaration(text: string, typeName: string): PropsDeclaration | null {
  const patterns = [
    new RegExp(`type ${typeName}(?:<[^>]*>)?\\s*=\\s*\\{`),
    new RegExp(`interface ${typeName}(?:<[^>]*>)?(?:\\s+extends([^{]+))?\\s*\\{`),
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
        return { body: text.slice(openBrace + 1, i), bases: splitBases(match[1] ?? "") };
      }
    }
  }

  return null;
}

function splitBases(clause: string): string[] {
  const bases: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of clause) {
    if (ch === "<") depth += 1;
    if (ch === ">") depth -= 1;
    if (ch === "," && depth === 0) {
      bases.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) bases.push(current.trim());
  return bases;
}

function findDeclarationText(typeName: string): string | null {
  for (const relDir of SOURCE_DIRS) {
    const found = findInDir(path.join(process.cwd(), relDir), (text) =>
      extractPropsDeclaration(text, typeName) !== null,
    );
    if (found) return fs.readFileSync(found, "utf8");
  }
  return null;
}

function findInDir(dir: string, predicate: (text: string) => boolean): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findInDir(fullPath, predicate);
      if (nested) return nested;
      continue;
    }
    if (!/\.tsx?$/.test(entry.name) || /\.(test|story)\.tsx?$/.test(entry.name)) continue;
    if (predicate(fs.readFileSync(fullPath, "utf8"))) return fullPath;
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

function findNamedFile(dir: string, fileName: string): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findNamedFile(fullPath, fileName);
      if (nested) return nested;
    } else if (entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

function findComponentInDir(dir: string, componentName: string): string | null {
  const named = findNamedFile(dir, `${componentName}.tsx`);
  if (named) return named;
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
