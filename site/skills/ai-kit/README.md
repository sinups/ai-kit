# AI UI Kit skill

Source for the `sinups/ai-kit` skill referenced on the
[Skills](https://sinups.github.io/ai-kit/docs/skills) page.

A **skill** is a bundle of project-aware context an AI assistant (Agent CLI and
other coding assistants) loads when it detects a project that uses `@sinups/ai-kit`,
so it picks the right components, prop shapes, and composition patterns instead
of guessing them.

## Files

- [`SKILL.md`](./SKILL.md): the skill content. YAML frontmatter at the top is
  the canonical Agent CLI / skills.sh format: `name` + `description` drive
  when the skill is triggered, the markdown body is loaded as context.

## Distribution

The [skills.sh](https://skills.sh) CLI identifies skills by GitHub
`<owner>/<repo>`, so the install command is:

```bash
npx skills add sinups/ai-kit
```

The CLI searches standard locations (`skills/`, root `SKILL.md`,
`.agent/skills/`, etc.) recursively, so having this file committed is enough.

## Manual install for Agent CLI

```bash
mkdir -p ~/.agent/skills/ai-kit
curl -L https://raw.githubusercontent.com/sinups/ai-kit/main/site/skills/ai-kit/SKILL.md \
  -o ~/.agent/skills/ai-kit/SKILL.md
```

## Maintenance

Keep [`SKILL.md`](./SKILL.md) in sync with the package exports in
[`package/src/index.ts`](../../../package/src/index.ts) and the prop types of the
components it names. The skill points assistants at `llms-full.txt`, which the site
generates from the component docs (`site/app/data/component-docs*.ts`), the sidebar and
the package source, so the catalog there stays current on every site build.

## Credits

Derived from the Agent Elements skill by 21st.dev (MIT).
