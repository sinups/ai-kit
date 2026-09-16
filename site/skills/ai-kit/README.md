# AI UI Kit skill

Source for the `sinups/ai-kit` skill referenced on the
[Skills](https://sinups.github.io/ai-kit/docs/skills) page.

A **skill** is a bundle of project-aware context an AI assistant (Claude Code,
Cursor, etc.) loads when it detects a project that uses `@sinups/ai-kit`,
so it picks the right components, prop shapes, and composition patterns instead
of hallucinating.

## Files

- [`SKILL.md`](./SKILL.md): the skill content. YAML frontmatter at the top is
  the canonical Claude Code / skills.sh format: `name` + `description` drive
  when the skill is triggered, the markdown body is loaded as context.

## Distribution

The [skills.sh](https://skills.sh) CLI identifies skills by GitHub
`<owner>/<repo>`, so the install command is:

```bash
npx skills add sinups/ai-kit
```

The CLI searches standard locations (`skills/`, root `SKILL.md`,
`.claude/skills/`, etc.) recursively, so having this file committed is enough.

## Manual install for Claude Code

```bash
mkdir -p ~/.claude/skills/ai-kit
curl -L https://raw.githubusercontent.com/sinups/ai-kit/master/site/skills/ai-kit/SKILL.md \
  -o ~/.claude/skills/ai-kit/SKILL.md
```

## Maintenance

Keep [`SKILL.md`](./SKILL.md) in sync with the component catalog in
[`app/data/component-docs.ts`](../../app/data/component-docs.ts) and the
package exports in [`package/src/index.ts`](../../../package/src/index.ts).

## Credits

Derived from the Agent Elements skill by 21st.dev (MIT).
