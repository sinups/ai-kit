export type ComponentPageApiProp = {
  name: string;
  type: string;
  required: boolean;
};

export type ComponentPageMarkdownData = {
  title: string;
  description?: string;
  url?: string;
  code?: string;
  usage?: string;
  examples?: Array<{ title: string; code: string }>;
  apiProps?: ComponentPageApiProp[] | null;
  installCommand?: string;
};

function addCodeBlock(lines: string[], content: string, language = "tsx") {
  lines.push("```" + language);
  lines.push(content.trim());
  lines.push("```");
}

export function buildComponentPageMarkdown({
  title,
  description,
  url,
  code,
  usage,
  examples,
  apiProps,
  installCommand,
}: ComponentPageMarkdownData) {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  if (description) {
    lines.push("", description.trim());
  }

  if (url) {
    lines.push("", `**URL:** ${url}`);
  }

  if (code) {
    lines.push("", "---", "");
    addCodeBlock(lines, code);
  }

  if (installCommand) {
    lines.push("", "## Getting Started", "");
    addCodeBlock(lines, installCommand, "bash");
  }

  if (usage) {
    lines.push("", "## Usage", "", usage.trim());
  }

  if (examples && examples.length > 0) {
    lines.push("", "## Examples");
    for (const example of examples) {
      lines.push("", `### ${example.title}`, "");
      addCodeBlock(lines, example.code);
    }
  }

  if (apiProps && apiProps.length > 0) {
    lines.push("", "## API Reference", "");
    lines.push("| Prop | Type | Required |", "| --- | --- | --- |");
    for (const prop of apiProps) {
      const type = prop.type ? `\`${prop.type}\`` : "-";
      const required = prop.required ? "Yes" : "No";
      lines.push(`| ${prop.name} | ${type} | ${required} |`);
    }
  }

  return lines.join("\n").trim() + "\n";
}
