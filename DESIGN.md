# Design system

The rules below were measured from the chat components of the first release and apply to every
component in the kit. File references are relative to `package/src`. Token values are declared in
`styles/vars.module.css`; theme behavior is implemented in `theme/`. A visual change to an existing
component that was not intended is a bug and is caught by `yarn test:visual`.

## Principles

1. **Light and open.** Few borders and containers: a surface is the page background, a card is
   drawn only around a truly separate entity, dividers are thin and rare. Space, not lines,
   separates zones.
2. **Hierarchy through type.** Text is small (xs/sm), section titles are xs/500 muted (no
   uppercase), secondary text is `--ae-fg-muted`. The largest text is sm/500.
3. **Ghost controls.** Secondary buttons have no border and show a soft fill on hover; segmented
   controls and tabs are text with a soft selected fill or a 2px accent indicator; tags are soft
   `--ae-bg-secondary` labels without outlines. One primary action per surface.
4. **Soft statuses.** Errors and warnings are an icon, a colored title and a 2px bar in the status
   color, not a filled box. Color is reserved for the primary action, statuses and diff.
5. **Three control heights.** 20px inside cards and tool footers, 24px in notices and the composer,
   28px for triggers, tabs and inputs.
6. **Same component in a 360px widget and a 900px page.** Layout adapts to the component width
   (see `ARCHITECTURE.md`), sizes do not grow with the viewport.
7. **Both color schemes are designed, not derived.** Every neutral has a light and a dark value in
   `styles/vars.module.css`.
8. **Built from tokens, not from the Mantine look.** Stock Mantine components are fine for
   behavior; the kit theme gives them this language (see Theme).

## Tokens

All tokens are declared in `styles/vars.module.css`. Components use tokens only: no hex values,
no Mantine palette colors (`color="red"`, `c="dimmed"`) for kit surfaces.

### Neutrals

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ae-bg` | `#fff` | `#0a0a0a` | Page and card body background |
| `--ae-bg-secondary` | `#f0f0f0` | `#242424` | Hover fill of text buttons, nav buttons |
| `--ae-bg-tertiary` | `#f8f8f8` | `#141414` | Info bar and notice background, segmented track |
| `--ae-muted` | `#f5f5f5` | `#262626` | Round icon button hover, attachment pill, skeleton |
| `--ae-fg` | `#1a1a1a` | `#fafafa` | Primary text |
| `--ae-fg-muted` | `#737373` | `#8c8c8c` | Secondary text, tool row labels, text buttons |
| `--ae-fg-subtle` | `#a3a3a3` | `#71717a` | Shimmer base, tertiary text |
| `--ae-border` | `#e4e4e7` | `#2a2a2a` | All 1px borders and dividers |
| `--ae-tool-bg` | `#f5f5f5` | `#141414` | Card header and footer |
| `--ae-tool-border` | `#e4e4e7` | `#2a2a2a` | Card border |
| `--ae-tool-color` / `-muted` | `#1a1a1a` / `#737373` | `#fafafa` / `#8c8c8c` | Text inside cards |
| `--ae-code-bg` / `--ae-code-color` | `#1e1e1e` / `--mantine-color-text` | `#0a0a0a` / `#d4d4d4` | Code surfaces |
| `--ae-icon-idle` | `#a3a3a3` | `#71717a` | Idle icons (send, attach) |
| `--ae-input-*` | bg `#fff`, border `#e4e4e7`, color `#1a1a1a`, placeholder `#a3a3a3` | bg `#0a0a0a`, border `#2a2a2a`, color `#fafafa`, placeholder `#71717a` | Composer field |
| `--ae-user-message-bg` / `-text` | `#f5f5f5` / `#1a1a1a` | `#1a1a1a` / `#fafafa` | User bubble |

Opacity steps on `--ae-fg` are used for picker triggers and options: `0.06` hover fill, `0.2-0.4`
secondary text, `0.6` check icon (`input/ModelPicker.module.css`). `--ae-hover` is
`--mantine-color-default-hover`.

### Accents

| Token | Value | Role |
|---|---|---|
| `--ae-primary` / `-hover` / `-contrast` | Mantine primary filled / filled hover / contrast | Primary buttons, checked badges, drag-over ring |
| `--ae-send-button-bg` / `-color` | `--ae-primary` / `--ae-primary-contrast` | Send button and text on primary fills |
| `--ae-error-border` / `--ae-error-bg` | red 6 at 0.3 / 0.1 | Error cards |
| `--ae-warning-border` / `--ae-warning-bg` | yellow 6 at 0.35 / 0.1 | Warning cards and notices |
| `--ae-danger` / `--ae-danger-fill` | Mantine `red` text / `red-9` | Destructive text and filled destructive buttons (white text ≥ 4.5:1 in both schemes) |
| `--ae-success` / `--ae-warning` / `--ae-info` | Mantine `green` / `orange` / `blue` text | Status icons and text |
| `--ae-terminal-prompt` | `#d97706` / `#fbbf24` | `$` in bash cards |
| `--ae-diff-added-*` / `--ae-diff-removed-*` | green / red: bg 0.1 (dark 0.15), border 0.5 (dark 0.4), text `#15803d` / `#dc2626` (dark `#4ade80` / `#f87171`) | Diff lines and stats |
| `--ae-diff-added-highlight` / `--ae-diff-removed-highlight` | green 0.3 / red 0.25 (dark 0.35 / 0.35) | Changed words inside a replaced line |

### Radii

| Token | Default | Where |
|---|---|---|
| `--ae-radius`, `--ae-message-radius`, `--ae-input-radius` | `--mantine-radius-lg` | Composer, info bar, user message |
| `--ae-message-radius-inner` | message radius minus `--ae-message-radius-inner-offset` (4px) | Content inset inside a rounded bubble |
| `--ae-tool-radius` | 10px | Tool cards, tool rows, popover dropdowns |
| `--ae-notice-radius` | 8px | Error and warning cards |
| `--ae-row-radius` | 6px | Menu options, picker triggers, suggestions, inputs, attachment thumbs |
| `--ae-control-radius` | `--mantine-radius-sm` | 20px and 24px buttons, badges |
| 50% | — | 28px round icon buttons (`input/SendButton.module.css`, `input/AttachmentButton.module.css`) |

`AiKitProvider` rewrites these tokens for its `radius` setting (see Theme).

### Control heights and layout

| Token | Default | Where |
|---|---|---|
| `--ae-control-height-xs` | 20px | Buttons inside cards and tool footers |
| `--ae-control-height-sm` | 24px | Buttons in notices and the composer |
| `--ae-control-height-md` | 28px | Triggers, tabs, inputs |
| `--ae-row-height` | 28px | Menu and list rows |
| `--ae-max-width` | 420px | Default message column width (`contentWidth`) |
| `--ae-context-padding` | 10px | Padding of the composer attachments strip; attachment radius derives from it |
| `--ae-user-message-x` / `-y` | 14px / 10px | User bubble padding |
| `--ae-panel-header-height` | `auto` | Header row of panes (48px inside layout inspectors) |

`compact` density sets the control heights to 20/22/24px, rows to 24px, context padding to 8px and
user bubble padding to 12px / 8px.

### Typography

| Token | Value | Use |
|---|---|---|
| `--ae-font-size-2xs` | 10px | Rare captions |
| `--ae-font-size-xxs` | 11px | Mono stats (`tools/EditTool.module.css`) |
| `--ae-font-size-xs` + `--ae-line-height-xs` | Mantine xs / 16px | Card headers, buttons, menus, info bar, badges text |
| `--ae-font-size-sm` + `--ae-line-height-sm` | Mantine sm / 20px | Message text, tool rows, question options, plan body |
| `--ae-font-size-md` | Mantine md | Rare; not used for kit surface text |
| `--ae-font-mono` | Mantine monospace | Commands, code, paths, stats |

Weights: 400 body, 450 tool row label (`ToolRowBase/ToolRowBase.module.css`), 500 titles,
primary buttons, picker labels. There are no headings: the largest text is sm/500.

### Motion

| Name | Definition | Use |
|---|---|---|
| `--ae-anim-shimmer` | background-position sweep, 2s linear infinite | In-progress labels (`TextShimmer/TextShimmer.module.css`) |
| `--ae-anim-loading-dots` | opacity 0 → 1 → 0, 1.4s, delays 0.2/0.4/0.6s | "Waiting…" dots (`tools/ToolApprovalFooter.module.css`) |
| `--ae-anim-blink` | 1s step-end | Typing caret (`input/InputBar.module.css`) |
| `--ae-anim-spin` | 360deg | Spinners |
| `--ae-anim-appear` | opacity 0 → 1 with 4px of travel, 150ms ease-out | Messages and parts that arrive after mount (`MessageList` with `animateAppearance`) |

Transitions are `150ms ease` for color and background, `150ms ease-out` for expand, collapse and
chevrons (`ToolRowBase/ToolRowBase.module.css`, `input/InputBar.module.css`), `200ms ease-out`
for the attachments grid, `75ms` for the focus ring. Pressed buttons scale to
`0.98` (`tools/ToolApprovalFooter.module.css`); disabled controls use `opacity: 0.6`.

## Sizes

| Element | Height | Padding | Text | Reference |
|---|---|---|---|---|
| Card header | 28px | 0 8px 0 10px | xs / 16, `--ae-fg-muted` | `tools/BashTool.module.css` |
| Question header, tab bar | 28px | 0 12px | xs / 16 | `question/QuestionHeader.module.css` |
| Tool row | 20px line | gap 4px, 12px icon | sm / 20, label 450, detail `alpha(fg-muted,.6)` | `ToolRowBase/ToolRowBase.module.css` |
| Card footer | auto | 4px 8px 4px 12px | xs / 16 | `tools/ToolApprovalFooter.module.css` |
| Primary / text button (card) | 20px | 0 6px | xs / 16, primary 500 | `tools/ToolApprovalFooter.module.css` |
| Notice / composer button | 24px | 0 8px (0 10px with sm text) | xs or sm, 500 | `input/InputBar.module.css`, `question/QuestionPrompt.module.css` |
| Close / nav icon button | 24px (20px in headers) | — | 14px icon | `input/InputBar.module.css`, `question/QuestionHeader.module.css` |
| Picker trigger | 28px | 0 8px, radius 6px | xs / 16, 500 label | `input/ModelPicker.module.css` |
| Round icon button | 28px circle | — | 14-16px icon | `input/SendButton.module.css` |
| Suggestion pill | 28px | 0 8px, 1px border, radius 6px | sm / 20, `--ae-fg-muted` | `input/Suggestions.module.css` |
| Info bar | 34px | 0 12px | xs / 16, title 500, description `alpha(fg-muted,.8)` | `input/InputBar.module.css` |
| Menu option | auto | 6px 8px, radius 6px | xs / 16, 14px icon | `input/ModeSelector.module.css` |
| Popover dropdown | auto | 4px, min-width 180px, 1px border, radius 10px | — | `input/InputPopover.module.css` |
| Text input | 28px | 0 8px, 1px border, radius 6px | sm | `question/QuestionPrompt.module.css` |
| Composer field | min 44px | 12px 12px 0 14px | sm / 22px | `input/InputBar.module.css` |
| Count / choice badge | 20px, min-width 20px | 0 4px, 1px border, radius sm | sm / 500, `--ae-tool-color-muted` | `question/QuestionPrompt.module.css` |
| Attachment pill | 40px | 4px 8px 4px 4px | xs | `input/FileAttachment.module.css` |

Icons: 12px in tool rows (`ToolRowBase/ToolRowBase.module.css`), 14px in menus and buttons,
16px in card headers and toolbars; `stroke={2}` where the default looks thin (`@tabler/icons-react`).

## Spacing

### 1. Measured values

188 spacing declarations in the 26 CSS modules of the first release. Frequency of values:

| px | uses | typical role |
|---|---|---|
| 1 | 4 | option list gap in QuestionPrompt, caret offset |
| 2 | 8 | context items bottom, list item inline start, ContextUsage trigger |
| 4 | 31 | icon↔label in rows, toolbar button groups, tool row header gap, attachment inset |
| 6 | 21 | tool body y, headerContent gap, bubble y, dropdown option y, footer gaps |
| 8 | 59 | **base unit**: turns gap, row content gap, code body y, control x-padding, suggestions gap |
| 10 | 10 | tool/code header and body x (optical: aligns text with the 1px border + 9px) |
| 12 | 28 | blocks inside an assistant reply, input insets, card x (Question), table cell x |
| 14 | 4 | user bubble x, textarea left inset (optical, larger radius) |
| 16 | 10 | column x-padding, error card x, empty state, hr, suggestions top |
| 20 | 1 | ordered list indent |
| 24 | 2 | column y-padding |
| 70 | 1 | user bubble start offset (layout, not spacing) |

**Scale:** `2 · 4 · 6 · 8 · 12 · 16 · 24` plus two optical insets `10` and `14`. Nothing in these modules uses Mantine `xs=10 / sm=12 / md=16 / lg=20 / xl=32` spacing props; everything is explicit.

#### Roles

| Role | Value | Where |
|---|---|---|
| Inside a control (icon ↔ label, chip) | 4–6 gap, 0 8 padding | ToolRowBase `.row` 4, BashTool `.headerContent` 6, `.infoBarAction` 0 8 |
| Card header | 0 8 0 10 (h 28) | code block, BashTool header |
| Card body | 6–8 y · 10 x | BashTool body 6/10, code body 8/10 |
| Standalone card | 8–10 y · 12–16 x | QuestionPrompt 8/12, ErrorMessage 10/16 |
| Rows of a list | 0–1 gap, row itself 6/8 padding | QuestionPrompt options gap 1 + option 6/8 |
| Tool calls in a group | 8 gap | ToolGroup `.list` |
| Blocks inside one reply (text, tool, code) | 12 gap | MessageList `.assistantParts` |
| Between turns | 8 gap | `.turns`, `.turn` |
| Column edges | 24 y · 16 x | MessageList `.content` |
| Composer insets | 0 12 12 root, 12 12 0 14 field, 4 8 8 toolbar | InputBar |
| Composer ↔ feed | breathing space `max(140px, 24vh)` under the last turn | MessageList `.breathingSpace` |
| Markdown flow | p/ol bottom 8, h2 12/6, h3–h4 8/4, hr/table 12–16, first/last child reset to 0 | Markdown |

### 2. Principles

1. **The parent owns the rhythm.** Space between siblings is the container's `gap`, never a child's margin. A component has no outer margin.
2. **Continuation cancels spacing.** Parts of the same message sit on the reply's rhythm (12); a tool result sits flush under its call (0, same surface); a follow-up line of the same row uses the row gap (4), not a new block gap.
3. **Homogeneous items use `gap`.** Lists of rows, tool calls, chips, buttons.
4. **Only surfaces pad.** Padding belongs to things with a background or border (card, bubble, popover, composer). Layout wrappers (`Stack`, `Group`, `Box`) have no padding unless they are the surface.
5. **One left edge.** Titles, rows, helper text and actions inside a surface start at the same inset. Icons hang in their own column; text aligns with text.
6. **Optical exceptions are named.** 10 (tool/code inset) and 14 (bubble/composer inset) exist because of radius and border, and are tokens, not ad-hoc numbers. Negative margins only for hover bleed (option row −8 with +8 padding), always paired.
7. **Composer takes at most half the viewport** (textarea `maxRows`, attachments strip scrolls).
8. **No "just in case" margin.** `mt={4}` to push a button group away from text means the parent gap is wrong.

### 3. Tokens

Declared in `styles/vars.module.css`; `theme.spacing` of the kit subtree uses the same scale:

```css
--ae-space-3xs: rem(2px);
--ae-space-2xs: rem(4px);
--ae-space-xs:  rem(6px);
--ae-space-sm:  rem(8px);
--ae-space-md:  rem(12px);
--ae-space-lg:  rem(16px);
--ae-space-xl:  rem(24px);
--ae-space-2xl: rem(32px);

--ae-inset-tool-x:   rem(10px);   /* tool and code header/body */
--ae-inset-bubble-x: rem(14px);   /* user bubble, composer field */
--ae-control-gap:    var(--ae-space-2xs);
--ae-row-gap:        var(--ae-space-2xs);
--ae-block-gap:      var(--ae-space-md);   /* parts of one reply, sections of a detail pane */
--ae-turn-gap:       var(--ae-space-sm);
--ae-surface-pad:    var(--ae-space-md);   /* cards, popovers, panes */
--ae-column-pad-x:   var(--ae-space-lg);
--ae-column-pad-y:   var(--ae-space-xl);
```

Mantine props inside the kit: `createAiKitTheme` sets `theme.spacing` to `{ xs: 6, sm: 8, md: 12, lg: 16, xl: 24 }`, so `gap="xs"` lands on the kit scale. The chat components of the first release use explicit pixel values (`gap={10}`) so they keep their original look regardless of the theme scale.

### 4. Encapsulation rules

- A component's root has **no margin**. The only exceptions are prose (Markdown children reset first/last) and the code block inside prose, which gets its vertical rhythm from Markdown, not from its own root.
- A surface component pads itself with `--ae-surface-pad` (or the named inset) and exposes no `p` override by default.
- Inspector panels (`DiffReview`, `BackgroundTasksPanel`) take their side inset from `--ae-panel-inset`, falling back to `--ae-surface-pad` (12px) when used alone; a layout sets it once on the pane (`ChatWithInspector` uses `--ae-column-pad-x`, 16px, the chat column inset) so headers, toolbars and rows share one edge.
- Layout-only components (EntityList, SettingsLayout, MasterDetail panes, Wizard frame) **do not pad**; the host surface or pane decides. Panes get one inset from the container (`MasterDetail` pane padding), not each child.
- A group of related controls under text is placed by the parent `gap`, not by `mt`.
- Dividers replace gaps, they don't add to them: a `Divider` between sections sits inside a `gap=0` stack with sections padded, or inside `gap` with no section padding — never both.

### 5. Joints

| Joint | Rule | Value |
|---|---|---|
| Assistant text → tool call | reply parts gap | 12 |
| Tool call → tool call (same group) | group gap | 8 |
| Tool call → its result | same surface, body under header | 0 (body padding 6/10) |
| Text → code block (in Markdown) | prose rhythm | 8 |
| Paragraph → paragraph | prose rhythm | 8 |
| Heading → content | heading bottom | 6 (h2) / 4 (h3–h4) |
| User turn → assistant turn | turn gap | 8 |
| Last turn → composer | breathing space, not margin on composer | `max(140px, 24vh)` |
| Section title → its list | title row gap | 4 |
| List row → list row | row gap | 0–2 (rows carry own 6–8 y padding) |
| Field → helper/error text | Mantine Input wrapper | 4 (Input description/error) |
| Field → field | form stack gap | 12 |
| Card body → card footer (actions) | footer inside surface, separated by gap or divider | 8 (gap) or 0 + divider |
| Detail pane: header → metadata → content | pane stack gap | 12 |
| Menu / sidebar rows | Mantine NavLink/Menu.Item own padding, list gap | 0–2 |
| Popover title → rows | one left edge = popover inset | 0 x-offset difference |
| Alert inside a padded pane | block gap, no extra margin | 12 |


## Patterns

### Card (tool, plan, diff)

```css
.card { border: rem(1px) solid var(--ae-border); border-radius: var(--ae-tool-radius); background-color: var(--ae-tool-bg); overflow: hidden; }
.header { display: flex; align-items: center; justify-content: space-between; height: rem(28px); padding: 0 rem(8px) 0 rem(10px); }
.title { font-size: var(--ae-font-size-xs); line-height: var(--ae-line-height-xs); color: var(--ae-fg-muted); }
.body { border-top: rem(1px) solid var(--ae-border); background-color: var(--ae-bg); padding: rem(6px) rem(10px); }
.footer { border-top: rem(1px) solid var(--ae-border); background-color: var(--ae-tool-bg); padding: rem(4px) rem(8px) rem(4px) rem(12px); }
```

Header on `--ae-tool-bg`, body on `--ae-bg`, footer back on `--ae-tool-bg` with 20px actions
(`tools/BashTool.module.css`, `tools/PlanTool.module.css`).

### Buttons

- **Primary:** 20px, `--ae-primary` fill, `--ae-send-button-color` text, xs/500, hover
  `alpha(var(--ae-primary), 0.9)`, active `scale(0.98)` (`tools/ToolApprovalFooter.module.css`).
- **Muted text button:** same box, transparent, `--ae-fg-muted`, hover text `--ae-tool-color` and
  fill `alpha(var(--ae-bg-secondary), 0.5)`.
- **Notice action:** 24px, otherwise the same (`input/InputBar.module.css`). Only one primary
  action per surface; the rest are muted.

### Tool row (`ToolRowBase`)

A single line: 12px icon, label (sm, 450, `--ae-fg-muted`), detail (ellipsis,
`alpha(--ae-fg-muted, 0.6)`), chevron rotating 90deg in 150ms ease-out; expanded content sits
below with an 8px gap (`ToolRowBase/ToolRowBase.module.css`).

### Pickers and menus

Trigger: 28px, xs, `alpha(fg, 0.4)` text with 500 label, hover `alpha(fg, 0.06)`. Dropdown: 10px
radius, 4px padding, 1px border, no shadow. Option: 6px 8px, 6px radius, hover and active
`alpha(fg, 0.06)`, description `alpha(fg, 0.4)`, check `alpha(fg, 0.6)`
(`input/ModelPicker.module.css`, `input/ModeSelector.module.css`, `input/InputPopover.module.css`).

### Notices

Info bar inside the composer: 34px, `--ae-bg-tertiary`, xs text with a 500 title and a muted
description, 24px primary action and 24px close icon (`input/InputBar.module.css`).
Standalone notices (`ChatNotices/NoticeBar.module.css`) reuse the same values.

### Error card

1px `--ae-error-border`, `--ae-error-bg`, 8px radius, 10px 16px padding, sm/20 with a 500 title
and muted message (`ErrorMessage/ErrorMessage.module.css`). Warnings swap in `--ae-warning-*`.

### Empty chat (welcome)

The welcome block (`AgentChat/ChatWelcome`) sits between two spacers in the transcript area: the
top one takes 2 parts of the free space, the bottom one 1 part capped at 160px (32px,
`--ae-space-2xl`, in containers narrower than 600px). It keeps the text column's left edge and
scrolls when there is no room. Title sm/500, description sm muted, 48px avatar.

### Settings and lists

`SettingsSection` has no border: sections are separated by spacing, rows inside by dividers.
`SettingsLayout` keeps one left edge per column (16px) and a 48px header row, so the navigation
title and the first section title share a baseline. `EntityListItem` never truncates badges: the
title truncates, and at 20rem of body width the badges move under the title. `TaskStatusPill` is
blue while tasks run or wait and gray otherwise; only the failed count uses `--ae-danger`.

### Attachments and suggestions

Attachment pill: `alpha(--ae-muted, 0.5)`, radius derived from the composer radius, remove button
revealed on hover (`input/FileAttachment.module.css`). Suggestion pill: 28px outline, muted
text, hover fill `alpha(--ae-bg-secondary, 0.4)` (`input/Suggestions.module.css`).

## Theme

The kit is themed through the standard Mantine theme object
(`node_modules/@mantine/core/lib/core/MantineProvider/theme.types.d.ts`). A host that already
configured `primaryColor`, `defaultRadius` and fonts gets the kit in its accent and radii without
extra configuration: `--ae-primary*` point at `--mantine-primary-color-*`, `--ae-font-*` at
`--mantine-font-*`, and kit radii follow `defaultRadius`.

### Options

The constructor offers few options, each checked in both schemes and in every combination
(`theme/Matrix` story).

| Option | Values | Theme field |
|---|---|---|
| Accent | Default (host `primaryColor`), `gray` (Neutral), `blue`, `indigo`, `violet`, `grape`, `pink` | `primaryColor` + `primaryShade` from `AI_KIT_ACCENT_SHADES`; kit theme has `autoContrast: true`, `luminanceThreshold: 0.3` |
| Radius | `sharp`, `default`, `round` | `defaultRadius` = `xs`, `md` (Mantine default), `lg`; kit radii in `theme.other.aiKit.radii` |
| Density | `default`, `compact` | `theme.other.aiKit.density` → `controlHeights` |
| Mode | `light`, `dark`, `auto` | `useMantineColorScheme` (host `colorSchemeManager` / `forceColorScheme` win) |

Fonts are not an option: `--ae-font-*` reference `fontFamily`, `fontFamilyMonospace`, `fontSizes`
and `lineHeights` of the host theme. Custom accents (any palette or CSS color) are for developers
through the `theme` prop, not the panel.

Radius steps scale every kit radius together and keep small controls from turning into capsules:

| Step | Composer | Cards, dropdowns | Notices | Rows, inputs | Buttons, badges |
|---|---|---|---|---|---|
| `sharp` | 8px | 6px | 4px | 4px | 2px |
| `default` | `radius-lg` | 10px | 8px | 6px | `radius-sm` |
| `round` | 22px | 14px | 10px | 8px | 6px |

Density `default` is the original chat surface (20/24/28px controls, 28px rows); `compact` is 20/22/24px controls and
24px rows with 8px context padding; 20px text buttons never shrink below their 16px line height.

### Contrast rule

Readability on the accent is checked, not assumed. `theme/ai-kit-contrast.test.ts` resolves the
real theme colors for every accent × scheme and fails when:

- text or icons on the filled color (primary buttons, checked checkboxes and chips, completed
  stepper steps, filled badges) are below **4.5:1**, including on the hover shade;
- tinted text of `light`, `outline` and `subtle` variants on `--ae-bg` is below **4.5:1**;
- the fill against `--ae-bg` and against the 10% `--ae-fg` track (selected borders,
  progress, switch) is below **3:1**;
- white text on `--ae-danger-fill` (filled `red` buttons: ConfirmDialog, invalid settings
  notice) is below **4.5:1**, or the danger fill against `--ae-bg` is below **3:1**, in either
  scheme. Mantine's `red.filled` (red 6) gives about 3.3:1 in light, so the token is red 9.

An accent that fails gets another `primaryShade` or leaves the list. The host's own
`primaryColor` ("Default") is not checked: the kit keeps the host's choice.

`theme.other.aiKit` is typed through module augmentation of `MantineThemeOther`
(`AiKitThemeOther`: `density`, `radii`, `controlHeights`, `contextPadding`, `userMessagePadding`).
Explicit values there win over the ones derived from `defaultRadius` and density.

### The kit theme (`createAiKitTheme(overrides?)`)

- `fontWeights.medium = '500'` (Mantine 9 uses 600; the kit language is 500).
- `cursorType: 'pointer'`, `autoContrast: true`, `luminanceThreshold: 0.3`, `respectReducedMotion: true`.
- `activeClassName`: pressed controls scale to 0.98. `focusClassName` stays Mantine's (the kit
  has no own focus ring for buttons).
- `spacing`: `xs 6`, `sm 8`, `md 12`, `lg 16`, `xl 24` (see Spacing).
- `variantColorResolver` (`aiKitVariantColorResolver`) is the single place that maps variants:
  `filled` → primary fill (red → `--ae-danger-fill` with white text, same color on hover);
  `light` → soft tag without border (`alpha(fg, 0.08)` for gray, 10% tint of the tone text
  otherwise, error and warning tokens for red and yellow); `outline` / `default` → ghost button
  (no border, transparent, `alpha(fg, 0.08)` on hover); `subtle` → muted text button with the
  same ghost hover; `transparent` → muted text button without a hover fill.
- Disabled: `Button` and `ActionIcon` in `subtle`, `transparent`, `default`, `outline` and
  `light` keep their own background (transparent for ghosts, the tint for `light`) and text color
  at `opacity: 0.6` instead of Mantine's gray disabled fill; `filled` keeps Mantine's disabled
  look. Components that resolve variants: `Button`,
  `ActionIcon`, `Badge`, `Alert`, `ThemeIcon`, `Avatar`, `Chip`, `EmptyState`, `Menu`, `NavLink`,
  `Tooltip`.
- `components.*` through `classNames` / `vars` / `defaultProps`:
  - surfaces: `Paper` and `Card` have the page background, no shadow, a thin `--ae-border` and
    10px radius only with `withBorder`; `Divider` is `--ae-border`; `Modal`, `Drawer`, `Menu`,
    `Popover` and `Combobox` dropdowns are 1px bordered, 10px, no shadow;
  - type: `Title` is xs/500 `--ae-fg-muted`; `Text c="dimmed"` is `--ae-fg-muted`; `EmptyState`
    title sm/500, description xs muted, 32px indicator;
  - controls: `SegmentedControl` without track, shadow or item separators (`withItemsBorders:
    false` by default and the separator pseudo-element removed even when a component passes it),
    selected segment `alpha(fg, 0.06)`, xs/500 labels; `Tabs` are
    text tabs with a 2px accent indicator and a barely visible list line; `Badge` defaults to
    `variant="light" color="gray"`, xs, no uppercase; `Chip` unselected has no border;
    `NavLink` active `alpha(fg, 0.06)`;
  - statuses: `Alert` has no fill and no box, an icon and title in the status color and a 2px
    start bar;
  - inputs: `TextInput`, `Textarea`, `Select`, `MultiSelect`, `TagsInput`, `NumberInput`,
    `PasswordInput`, `Autocomplete` are 28px, 6px radius, `--ae-border`, accent focus;
    `Checkbox`, `Radio`, `Switch` in tone; `Checkbox` and `Radio` without an explicit `size` are
    16px (radio dot 6px) to match their xs/16 labels;
  - field labels: every `Input.Wrapper` (`InputWrapper` in the theme), which also covers
    `Radio.Group`, `Checkbox.Group`, `Switch.Group` and custom fields, has an xs/16/500
    `--ae-fg` label, xs `--ae-fg-muted` description and xs `--ae-danger` error, the same as
    `TextInput` labels; components need no local label class;
  - `Stepper`: 24px icons with a 1px `--ae-border` ring; the active step has an accent ring;
    completed steps are filled with the accent and show the check in
    `--mantine-primary-color-contrast` (`--stepper-icon-color`);
  - `DataList` (horizontal): label and value are top-aligned and each at least 20px
    (`--ae-control-height-xs`) with centered content, so the label sits on the first line of a
    tall value (a 28px context ring, a two-line memory list) instead of its baseline;
  - `Kbd`: xs/16 mono, weight 500, `--ae-fg` on `--ae-bg-tertiary`, 1px `--ae-border` with a 2px
    bottom edge;
  - `Code`: inline code is xxs mono on `alpha(fg, 0.06)`; `Code block` is a light surface,
    `--ae-bg-tertiary`, 6px radius, xs/16 (export previews, task output, `ShellOutput` panel);
  - `ScrollArea` (also `ScrollArea.Autosize`): 8px scrollbar without a track fill, thumb
    `alpha(fg, 0.2)` (0.35 when the scrollbar is hovered), shown only while the pointer is over
    the area or focus is inside it (always on touch devices); an explicit `scrollbarSize` wins;
  - also `Table`, `Accordion`, `Progress`, `Loader`, `Skeleton`, `Tooltip`. Button sizes: `xs`/`compact-xs` → 20px, `sm`/`compact-sm` → 24px, `md` → 28px.
- Dialogs: Mantine's focus trap focuses the first `[data-autofocus]` element, otherwise the
  first tabbable one, which is the close button and shows a focus ring as soon as a dialog opens.
  Kit dialogs without a natural first field (`WizardModal`, `RewindDialog`, `McpImportDialog`,
  `ExportDialog`) put `<FocusTrap.InitialFocus />` at the start of the body: focus lands inside
  the dialog, Tab moves to the first control and Shift+Tab to the close button. A dialog whose
  first field should take focus marks it with `data-autofocus` instead (ConfirmDialog, command
  palette, list searches).
- Theme rules live under the global `.ae-kit` class (the provider wrapper and its portals), so
  they win over Mantine's own rules regardless of stylesheet order.
- **Classes add up.** A component's own `className`, `classNames` and `vars` are merged with the
  kit styles, as usual in Mantine. Opt out explicitly with `unstyled`, `variant="unstyled"` or
  `data-ai-kit-unstyled` (`isAiKitThemed`). Host UI rendered inside the kit subtree (a toolbar, a
  story harness) goes into `<AiKitHostScope>`, which restores the host theme and CSS variables.

Use it globally when the whole app should speak the kit language:
`<MantineProvider theme={mergeAiKitTheme(appTheme)}>` (host values win), with the `ae-kit` class
(`AI_KIT_SCOPE_CLASS`) on the app root element; portals get it from the theme. To read the resolved
theme outside components:

```ts
import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
const theme = mergeMantineTheme(DEFAULT_THEME, mergeAiKitTheme(appTheme));
const kit = getAiKitOther(theme); // radii, controlHeights, density
```

### `AiKitProvider` (recommended)

```tsx
<MantineProvider theme={appTheme}>
  <AiKitProvider accent="violet" radius="round" density="compact" persistKey="my-app-kit-theme">
    <McpSettingsPanel {...props} />
    <AiKitThemeCustomizer />
  </AiKitProvider>
</MantineProvider>
```

- A nested `MantineThemeProvider` (inherits the host theme) with `createAiKitTheme`: the host's
  own components outside the provider keep the host look.
- `accent`, `radius`, `density`, `colorScheme` are written to the fields above. Unset means "keep
  the host value".
- Mantine writes CSS variables only at the document root, so the provider re-declares the ones
  that differ between the host and the kit theme (`--mantine-primary-color-*`,
  `--mantine-font-weight-medium`, `--mantine-radius-default`, ...) plus kit surfaces
  (`--mantine-color-body`, `-text`, `-dimmed`, `-default-*` → `--ae-*`) and changed `--ae-*` tokens
  in a scoped stylesheet. Kit portals (menus, modals) get the same scope class through
  `components.Portal.defaultProps`.
- `AiKitHostScope` renders its children with the host theme inside the kit subtree.
- `theme?: MantineThemeOverride` is merged last; `tokens?: Partial<Record<AeToken, string>>`
  overrides any `--ae-*` token.
- `useAiKitTheme()` returns `settings`, `defaults`, `setSettings(patch)`, `reset()` and `aiKit`
  (`theme.other.aiKit` resolved from `useMantineTheme()`). `persistKey` saves changes to
  localStorage (read after mount, failures ignored).
- `AiKitThemeCustomizer`: Color, Radius, Density and Mode as 28px pills (options in the table
  above); uses the nearest provider,
  or `value`/`onChange` (controlled) and `defaultValue` (uncontrolled); `sections` hides parts,
  `labels` translates.

### What the theme cannot fix

Palette colors passed as props to non-variant styles (`c="dimmed"` is remapped, but `c="red"`,
`c="teal"`, `color` on `Text`/icons), `Title order` used as a big heading when the component also
passes `size`/`fz`, `fw={600|700}` and `fz`/`size="md|lg"` on `Text`, `EmptyState` sizes, and
hand-made controls built from `Box` or `UnstyledButton`. These need edits in the component.

## Checklist for a new component

1. Surfaces, borders and text use `--ae-*` tokens or theme variants; no hex, no palette `c=` on kit
   surfaces.
2. Text is xs/16 or sm/20; the largest title is sm/500. No `Title` above that.
3. Controls are 20, 24 or 28px; radius sm for buttons and badges, 6px for rows and inputs, 10px for
   cards and dropdowns.
4. At most one primary action per surface.
5. Cards follow header / body / footer; lists follow the menu option row.
6. Icons are 12, 14 or 16px from `@tabler/icons-react`.
7. Hover uses `alpha(fg, 0.06)` or `--ae-bg-secondary`; press `scale(0.98)`; disabled `opacity 0.6`;
   transitions 150ms.
8. Works at 360px and 900px of its own width.
9. Checked in both color schemes against the closest existing kit component.

## Visual check

- Stories are screenshotted in the light and dark theme and compared with the same story on the
  base branch: `yarn test:visual:baseline` records baselines from the base Storybook (port 8272)
  into the git-ignored `package/__visual__/`, then `yarn test:visual` compares this branch
  (`yarn storybook`, port 8271). A change to an existing component that moves pixels fails the
  check; describe intended changes in the pull request. CONTRIBUTING.md describes the local setup.
- New components have no baseline on the base branch and are skipped: compare them next to the
  closest existing pattern (card, picker, info bar, error card) at 360px and 900px in both
  schemes, and check heights, type and colors against the tables above.
- `theme/Matrix` in Storybook shows kit components in every accent, radius and density
  combination in both schemes.
- Storybook paints the canvas with `--ae-bg` for stories wrapped in `AiKitProvider`, so dark kit
  stories sit on `#0a0a0a` like kit surfaces; host-themed stories (components that exist on main)
  keep Mantine's body color and match their baselines.
