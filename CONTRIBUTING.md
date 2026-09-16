# Contributing

## Branches and merging

- `main` is protected: no direct commits, every change goes through a pull request.
- Branch names: `<type>/<short-topic>`, for example `feat/model-picker-groups`, `fix/diff-trailing-newline`, `docs/theming-guide`.
- Pull requests are merged with **squash and merge** only. The PR title becomes the commit title on `main`, the PR body becomes the commit body. Keep both clean.
- CI must be green before merging: build, tests, lint, docs export.

## Commit and PR title format

Titles follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

- `type`: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- `scope` (optional): the area touched, for example `tools`, `input`, `markdown`, `site`, `deps`.
- `summary`: imperative, lowercase, no trailing period, at most 72 characters.
- Breaking changes: add `!` after the scope and describe the change in the body.

Examples:

```
feat(tools): add approval footer to SearchTool
fix(input): keep textarea from growing past five rows
docs(site): describe --ae-* theming tokens
```

## Releases

Do not bump versions by hand. `release-please` opens and maintains a release pull request from the commit
titles on `main`; merging it publishes the package. Use `feat` for minor bumps, `fix` for patches and `!`
for breaking changes.

## PR body

Use the template. Describe what changed and why, list visible changes, link the issue if there is one.

## Authorship

Commits and pull requests are authored by people. Do not add `Co-Authored-By`, "Generated with" lines, session links or any other tool attribution to commit messages or PR descriptions.

## Code rules

- Components are built from Mantine primitives and CSS modules. No Tailwind, no inline colors or sizes in TSX.
- Colors, radii and sizes come from the `--ae-*` tokens in `package/src/styles/vars.module.css`. Add a token instead of a raw value.
- Cross-file keyframes are declared as `@keyframes :global(ae-*)` in `vars.module.css` and referenced through `var(--ae-anim-*)`.
- Every public component ships with a story in `*.story.tsx`; behavior with a test in `*.test.tsx`.
- Run `yarn test` and `yarn build` before opening a PR.
