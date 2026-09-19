# Contributing

## Setup

Use the Node version from `.nvmrc` and Yarn 4 (Corepack):

```bash
corepack enable
yarn install
```

| Command | What it does |
| --- | --- |
| `yarn storybook` | Storybook dev server on http://localhost:8271 |
| `yarn dev` | Documentation site on http://localhost:4100 |
| `yarn jest` | Unit and component tests (jsdom) |
| `yarn jest package/src/mcp` | Tests whose path matches |
| `yarn typecheck` | TypeScript for the package and the site |
| `yarn check:examples` | Type-check the code shown on the docs site: every `code` block and every generated example file |
| `yarn lint` | oxlint and stylelint |
| `yarn format:write` | Format the package, scripts and Storybook config |
| `yarn test` | Dependency check, format check, typecheck, lint, site lint, docs example check and jest |
| `yarn build` | Build `package/dist`; the site reads the built package |
| `yarn pack:preview` | Build and pack exactly what `npm publish` uploads into `.pack/`: the tarball, its unpacked contents and a size summary |
| `yarn size` | JS and CSS gzip of the main entries (`AgentChat`, `MessageList`, `InputBar`, settings panels, primitives, launcher, provider) and `import *` against budgets; run after `yarn build`. `yarn size --json` also rewrites `site/app/data/bundle-size.json` for the Bundle size page |
| `yarn site:build` | Build the documentation site |
| `yarn test:storybook` | Play functions and render checks against a running Storybook |
| `yarn test:visual:baseline` | Record visual baselines from the base branch Storybook (port 8272) into `package/__visual__/` |
| `yarn test:visual` | Compare the current branch Storybook (port 8271) with those baselines |

Jest transforms files with `esbuild-jest`. A file that contains the substring `ock(`, for
example `jest.mock(` or `CodeBlock(`, is routed to Babel and fails to parse. Rename the identifier
or move the mock.

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
for breaking changes. The changelog and GitHub release notes are generated from these titles: `feat`, `fix`,
`perf`, `revert`, `docs` and `deps` are listed, `chore`, `ci`, `build`, `test`, `style` and `refactor` are hidden,
so pick the type by what a user of the package should read about.

## PR body

Use the template. Describe what changed and why, list visible changes, link the issue if there is one.

## Authorship

Commits and pull requests are authored by people. Do not add `Co-Authored-By`, "Generated with" lines, session links or any other tool attribution to commit messages or PR descriptions.

## Code rules

[ARCHITECTURE.md](./ARCHITECTURE.md) describes layers, the component contract and the files each
component has. [DESIGN.md](./DESIGN.md) describes tokens, sizes, spacing and the theme. In short:

- Dependencies point down: `styles` → `utils`/`hooks` → `primitives` → chat modules → domain modules. A primitive never imports a domain module.
- Components are presentational and controlled. No fetching, global stores or routing inside the kit.
- Async callbacks may return a promise; show the pending state and the rejection message.
- Data views handle loading, error, empty and data states.
- Layout adapts to the component's own width, checked at 360px and 900px.
- Parsing, validation, filtering and formatting live in pure `*.ts` functions with unit tests, exported from `package/src/index.ts` with the component.
- User-visible strings have English defaults and a `labels` override.
- Components are built from Mantine components, the Styles API and CSS modules. No Tailwind, no custom `<button>` or `<input>`, no inline colors or sizes in TSX. Check every prop against the Mantine 9 type definitions.
- Colors, radii and sizes come from the `--ae-*` tokens in `package/src/styles/vars.module.css`. Add a token instead of a raw value, and add its name to `AE_TOKENS` in `package/src/theme/tokens.ts`.
- Cross-file keyframes are declared as `@keyframes :global(ae-*)` in `vars.module.css` and referenced through `var(--ae-anim-*)`.
- Existing components must not change visually unless the change is intended; run `yarn test:visual` for the stories you touched.
- Importing one component must not pull in the rest of the kit. `yarn size` bundles each entry from `package/dist` with esbuild (React and Mantine external) and fails when the gzip size exceeds its budget in `scripts/check-size.ts`. Raise a budget only when the growth is intended and say so in the PR. A new runtime dependency or top-level code with side effects shows up here first.
- Every public component ships with stories (`Usage`, `Narrow`, `Wide` and state stories where they apply) and tests in `*.test.tsx`; interactive behavior gets a `Flow` story.
- Demo data stays neutral: no product or company names, open-source model names only.
- Run `yarn test` and `yarn build` before opening a PR.

## Documentation

Component reference pages are data in `site/app/data/component-docs*.ts`, previews in
`site/app/components/previews/`, and navigation in `site/app/data/sidebar.ts`. The API table of a
component page is generated from its `<Name>Props` type, and the Hooks and utilities page from the
exports of `package/src/index.ts`, so JSDoc on props and functions is user-facing text. A new public
component needs a docs entry and a sidebar item. Check the site with:

```bash
yarn build
yarn workspace ai-kit-site typecheck
yarn site:lint
yarn check:examples
yarn site:build
```

## Storybook tests

Stories double as tests. Two kinds run against a Storybook in Chromium through `@storybook/test-runner`:

- **Interaction tests** — a story's `play` function drives it with `@storybook/test` (`userEvent`, `within`, `expect`, `fn`). Every story is also smoke-tested: it must render without errors. Play functions show up in the Interactions panel of Storybook.
- **Visual tests** — each story is screenshotted in the light and dark theme at 1280×800 with animations off, fonts loaded and scroll containers at the top, and compared with the same story in the base branch (`jest-image-snapshot`, more than 20 differing pixels fails). Baselines are not stored in git: `package/__visual__/` is ignored and recorded from the base branch Storybook before each comparison. A story that does not exist in the base branch has no baseline and is skipped with a message.

Against the dev server (`yarn storybook`, port 8271):

```bash
yarn test:storybook                          # all play functions and render checks
yarn test:storybook package/src/input        # stories whose file path matches
```

Another Storybook: `STORYBOOK_URL=http://127.0.0.1:6006 yarn test:storybook`. As in CI, against the static build: `yarn storybook:build && yarn test:storybook:ci`.

Visual check against `main`, locally:

```bash
git worktree add ../ai-kit-main main
cd ../ai-kit-main && yarn install && yarn exec storybook dev -p 8272   # base Storybook, keep it running
yarn storybook                                                    # this branch on 8271, second terminal

yarn test:visual:baseline                      # record baselines from 8272 into package/__visual__/
yarn test:visual package/src/input             # compare stories whose file path matches
VISUAL_FILTER='^(input-inputbar|tools-edittool)--' yarn test:visual:baseline
VISUAL_FILTER='^(input-inputbar|tools-edittool)--' yarn test:visual package/src/input/InputBar.story package/src/tools/EditTool.story
```

`test:visual:baseline` clears `package/__visual__/` first and runs the test runner of the current checkout against the base Storybook (`STORYBOOK_URL`, default `http://127.0.0.1:8272`), so the base branch needs no test runner configuration. Refresh the baselines after `main` moves.

- CI (`.github/workflows/visual.yml`, pull requests only) checks out the base branch next to the pull request, builds both Storybooks, records baselines from the base build and compares the pull request build with them. Nothing is committed; baseline failures in the base branch do not block the pull request.
- Run visual checks on macOS: the screenshot job uses a macOS runner, and Linux renders text differently. Both Storybooks are built on Linux in separate jobs, which is platform-independent; only the comparison itself is pinned to macOS.
- In a `git worktree` the checkout has a `.git` file instead of a directory, so Storybook infers the main checkout as the project root and the test runner finds no stories. Export `STORYBOOK_PROJECT_ROOT=$PWD` for `storybook:build`, `test:storybook` and the visual scripts there.
- An intended visual change fails the check. Add the `visual-change` label to the pull request: the comparison no longer blocks it, the job summary lists the stories that differ and the diffs are still uploaded. Describe the change in the pull request and review the diff images before merging. The label also accepts every other failure of that step, so remove it once the intended change is merged.
- A failing visual test writes `storybook-visual-diff/<story>--<theme>-diff.png` and the received image to `storybook-visual-diff/received/`; CI uploads the folder as an artifact.
- Play functions live only in dedicated stories whose name ends with `Flow` (`CompletionsFlow`, `ValidationFlow`); base stories such as `Usage`, `Narrow` and `Wide` have no `play` and open untouched.
- A `Flow` story passes callbacks through `args: { onX: fn() }` and its `play` checks both the calls (`expect(args.onX).toHaveBeenCalledWith(...)`) and the visible result on the page.
- Content inside `Collapse`, `Popover`, `Spoiler` or a modal animates in: wait for it with `await waitFor(() => expect(el).toBeVisible())` or `findBy…`, never assert visibility right after the click. Portaled content (menus, popovers, modals) is queried with `within(canvasElement.ownerDocument.body)`.
- Pass callbacks to DOM handlers through a wrapper (`onClick={() => args.onX()}`), so the spy does not receive and serialize a React event.
- JSX nested inside an object prop (for example `inputBarProps={{ leftActions: <Button /> }}`) makes the Docs source snippet overflow the stack, and the story fails to render with `Maximum call stack size exceeded`. Add `parameters: { docs: { source: { type: 'code' } } }` to such a story.
- If the dev server reports `Could not parse import/exports` or `index.json` fails, save the named story file again: the dev server caches a parse error from a half-written file until the file changes. Confirm stories with `yarn storybook:build`, which indexes every story from scratch.
- Exclude an unstable story (typing animation, live timers) with `Story.tags = ['skip-visual']` or `parameters: { visual: { skip: true } }`.
