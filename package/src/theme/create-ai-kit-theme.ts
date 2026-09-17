import {
  Accordion,
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Code,
  Combobox,
  createTheme,
  DataList,
  Divider,
  defaultVariantColorsResolver,
  Input,
  Drawer,
  EmptyState,
  Kbd,
  Loader,
  Menu,
  mergeThemeOverrides,
  Modal,
  MultiSelect,
  NavLink,
  NumberInput,
  Paper,
  PasswordInput,
  Popover,
  Progress,
  Radio,
  rem,
  ScrollArea,
  SegmentedControl,
  Select,
  Skeleton,
  Stepper,
  Switch,
  Table,
  Tabs,
  TagsInput,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  type MantineThemeOverride,
  type VariantColorResolverResult,
  type VariantColorsResolver,
} from '@mantine/core';
import classes from './ai-kit-theme.module.css';

/** Global class on the kit subtree and its portals; kit theme styles are scoped under it */
export const AI_KIT_SCOPE_CLASS = 'ae-kit';

export type AiKitControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type CssVars = Record<string, string>;

/** Props that opt a stock component out of the kit theme */
export interface StyledProps {
  unstyled?: boolean;
  variant?: string;
  'data-ai-kit-unstyled'?: unknown;
}

/** Control heights of the main-branch language: 20px text buttons, 24px notice and composer buttons, 28px triggers */
export const AI_KIT_CONTROL_HEIGHTS: Record<AiKitControlSize, string> = {
  xs: 'var(--ae-control-height-xs)',
  sm: 'var(--ae-control-height-sm)',
  md: 'var(--ae-control-height-md)',
  lg: rem(32),
  xl: rem(36),
};

const HORIZONTAL_PADDING: Record<AiKitControlSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

const DANGER_COLORS = new Set(['red', 'pink']);
const WARNING_COLORS = new Set(['yellow', 'orange']);
const NEUTRAL_COLORS = new Set(['gray', 'dark']);

const fgAlpha = (percent: number) => `color-mix(in srgb, var(--ae-fg) ${percent}%, transparent)`;

/**
 * The theme applies to every stock component, and its own `className`, `classNames` and `vars`
 * add to the kit styles. `unstyled`, `variant="unstyled"` or `data-ai-kit-unstyled` opt a
 * component out, for example a host control rendered inside the kit.
 */
export function isAiKitThemed(props: StyledProps & Record<string, any>): boolean {
  return !props.unstyled && props.variant !== 'unstyled' && !props['data-ai-kit-unstyled'];
}

export function normalizeAiKitSize(size: string | number | undefined): AiKitControlSize {
  const base = String(size ?? 'sm').replace(/^(compact|input)-/, '');
  return base in AI_KIT_CONTROL_HEIGHTS ? (base as AiKitControlSize) : 'sm';
}

type Tone = 'danger' | 'warning' | 'neutral' | 'accent';

function getTone(color: string | undefined, primaryColor: string): Tone {
  const name = color ?? primaryColor;
  if (DANGER_COLORS.has(name)) {
    return 'danger';
  }
  if (WARNING_COLORS.has(name)) {
    return 'warning';
  }
  if (NEUTRAL_COLORS.has(name)) {
    return 'neutral';
  }
  return 'accent';
}

function toneColor(tone: Tone, color: string): string {
  if (tone === 'danger') {
    return 'var(--ae-danger)';
  }
  if (tone === 'warning') {
    return 'var(--ae-warning)';
  }
  if (tone === 'neutral') {
    return 'var(--ae-fg-muted)';
  }
  return color.startsWith('var(') || color.includes('(') || color.startsWith('#')
    ? color
    : `var(--mantine-color-${color}-text)`;
}

/**
 * Maps Mantine variants to a light, borderless language: `filled` stays the primary fill,
 * `light` becomes a soft tinted tag, `outline` and `default` become ghost buttons,
 * `subtle` and `transparent` muted text buttons; red and yellow use the error and warning tokens.
 */
export const aiKitVariantColorResolver: VariantColorsResolver = (input) => {
  const base = defaultVariantColorsResolver(input);
  const { variant, theme } = input;
  const tone = getTone(input.color, theme.primaryColor);
  const text = toneColor(tone, input.color ?? theme.primaryColor);
  const none = `${rem(1)} solid transparent`;

  const result = (value: VariantColorResolverResult): VariantColorResolverResult => value;

  switch (variant) {
    case 'filled':
      return tone === 'danger'
        ? {
            ...base,
            background: 'var(--ae-danger-fill)',
            hover: 'var(--ae-danger-fill)',
            color: 'var(--mantine-color-white)',
          }
        : base;
    case 'light': {
      const tint =
        tone === 'danger'
          ? 'var(--ae-error-bg)'
          : tone === 'warning'
            ? 'var(--ae-warning-bg)'
            : tone === 'neutral'
              ? fgAlpha(8)
              : `color-mix(in srgb, ${text} 10%, transparent)`;
      return result({ background: tint, hover: tint, color: text, border: none });
    }
    case 'outline':
      return result({
        background: 'transparent',
        hover: fgAlpha(8),
        color: text,
        border: none,
      });
    case 'default':
      return result({
        background: 'transparent',
        hover: fgAlpha(8),
        color: 'var(--ae-fg)',
        border: none,
      });
    case 'subtle':
    case 'transparent':
      return result({
        background: 'transparent',
        hover: variant === 'subtle' ? fgAlpha(8) : 'transparent',
        color: tone === 'accent' ? text : tone === 'neutral' ? 'var(--ae-fg-muted)' : text,
        hoverColor: tone === 'neutral' ? 'var(--ae-fg)' : text,
        border: none,
      });
    default:
      return base;
  }
};

export function getAiKitButtonVars(size: string | number | undefined): CssVars {
  const key = normalizeAiKitSize(size);
  return {
    '--button-height': AI_KIT_CONTROL_HEIGHTS[key],
    '--button-padding-x': rem(HORIZONTAL_PADDING[key]),
    '--button-fz': key === 'xs' ? 'var(--ae-font-size-xs)' : 'var(--ae-font-size-sm)',
    '--button-radius': 'var(--ae-control-radius)',
  };
}

export function getAiKitActionIconVars(size: string | number | undefined): CssVars {
  const key = normalizeAiKitSize(size);
  return {
    '--ai-size': AI_KIT_CONTROL_HEIGHTS[key],
    '--ai-radius': 'var(--ae-row-radius)',
  };
}

export function getAiKitBadgeVars(): CssVars {
  return {
    '--badge-height': 'var(--ae-control-height-xs)',
    '--badge-padding-x': rem(6),
    '--badge-fz': 'var(--ae-font-size-xs)',
    '--badge-radius': 'var(--ae-control-radius)',
  };
}

export function getAiKitAlertVars(): CssVars {
  return { '--alert-radius': 'var(--ae-notice-radius)' };
}

function withoutRadius(vars: CssVars, props: Record<string, any>, name: string): CssVars {
  if (props.radius === undefined) {
    return vars;
  }
  const { [name]: _radius, ...rest } = vars;
  return rest;
}

function bare<T extends Record<string, string | undefined>>(value: T) {
  return (_theme: unknown, props: StyledProps & Record<string, any>) =>
    isAiKitThemed(props) ? value : {};
}

function bareVars<T extends CssVars>(root: (props: StyledProps & Record<string, any>) => T) {
  return (_theme: unknown, props: StyledProps & Record<string, any>) => ({
    root: isAiKitThemed(props) ? root(props) : {},
  });
}

function inputVars() {
  return (_theme: unknown, props: StyledProps & Record<string, any>) => ({
    wrapper: isAiKitThemed(props)
      ? {
          '--input-height': 'var(--ae-control-height-md)',
          '--input-radius': 'var(--ae-row-radius)',
          '--input-fz': 'var(--ae-font-size-sm)',
        }
      : {},
  });
}

const INPUT_CLASS_NAMES = {
  input: classes.input,
  label: classes.inputLabel,
  description: classes.inputDescription,
  error: classes.inputError,
};

const DROPDOWN_CLASS_NAMES = { dropdown: classes.popoverDropdown };

/**
 * Mantine theme of the kit subtree, built on the standard theme object: `fontWeights.medium`,
 * `cursorType`, `autoContrast`, `respectReducedMotion`, `activeClassName` and a
 * `variantColorResolver` that speaks the main-branch language. Component extensions apply to
 * every stock component unless it opts out with `unstyled` or `data-ai-kit-unstyled`.
 */
export function createAiKitTheme(overrides?: MantineThemeOverride): MantineThemeOverride {
  const theme = createTheme({
    fontWeights: { medium: '500' },
    spacing: { xs: rem(6), sm: rem(8), md: rem(12), lg: rem(16), xl: rem(24) },
    cursorType: 'pointer',
    autoContrast: true,
    luminanceThreshold: 0.3,
    respectReducedMotion: true,
    activeClassName: classes.active,
    variantColorResolver: aiKitVariantColorResolver,
    components: {
      Button: Button.extend({
        classNames: bare({ root: classes.button }),
        vars: bareVars((props) =>
          withoutRadius(getAiKitButtonVars(props.size), props, '--button-radius')
        ),
      }),
      ActionIcon: ActionIcon.extend({
        classNames: bare({ root: classes.actionIcon }),
        vars: bareVars((props) =>
          withoutRadius(getAiKitActionIconVars(props.size), props, '--ai-radius')
        ),
      }),
      Badge: Badge.extend({
        defaultProps: { variant: 'light', color: 'gray' },
        classNames: bare({ root: classes.badge }),
        vars: bareVars((props) => withoutRadius(getAiKitBadgeVars(), props, '--badge-radius')),
      }),
      Paper: Paper.extend({
        classNames: bare({ root: classes.paper }),
        vars: bareVars((props) =>
          props.radius === undefined
            ? { '--paper-radius': 'var(--ae-tool-radius)' }
            : ({} as CssVars)
        ),
      }),
      Card: Card.extend({
        classNames: bare({ root: classes.paper }),
        vars: bareVars((props) =>
          props.radius === undefined
            ? { '--card-radius': 'var(--ae-tool-radius)' }
            : ({} as CssVars)
        ),
      }),
      Divider: Divider.extend({ classNames: bare({ root: classes.divider }) }),
      Menu: Menu.extend({
        classNames: bare({
          dropdown: classes.popoverDropdown,
          item: classes.menuItem,
          label: classes.menuLabel,
          divider: classes.menuDivider,
        }),
      }),
      Popover: Popover.extend({ classNames: bare(DROPDOWN_CLASS_NAMES) }),
      Combobox: Combobox.extend({
        classNames: bare({ ...DROPDOWN_CLASS_NAMES, option: classes.menuItem }),
      }),
      Tabs: Tabs.extend({ classNames: bare({ list: classes.tabsList, tab: classes.tab }) }),
      SegmentedControl: SegmentedControl.extend({
        classNames: bare({
          root: classes.segmented,
          indicator: classes.segmentedIndicator,
          label: classes.segmentedLabel,
          control: classes.segmentedControl,
        }),
        defaultProps: { withItemsBorders: false },
        vars: bareVars(() => ({
          '--sc-radius': 'var(--ae-row-radius)',
          '--sc-font-size': 'var(--ae-font-size-xs)',
          '--sc-padding': `${rem(4)} ${rem(8)}`,
          '--sc-shadow': 'none',
        })),
      }),
      NavLink: NavLink.extend({
        classNames: bare({
          root: classes.navLink,
          label: classes.navLinkLabel,
          description: classes.navLinkDescription,
        }),
        vars: (_theme, props) => ({
          root: isAiKitThemed(props)
            ? {
                '--nl-bg': fgAlpha(6),
                '--nl-hover': fgAlpha(6),
                '--nl-color': 'var(--ae-fg)',
              }
            : {},
          children: {},
        }),
      }),
      Alert: Alert.extend({
        classNames: bare({
          root: classes.alert,
          icon: classes.alertIcon,
          title: classes.alertTitle,
          body: classes.alertBody,
          message: classes.alertMessage,
        }),
        vars: bareVars(() => getAiKitAlertVars()),
      }),
      Modal: Modal.extend({
        classNames: bare({
          content: classes.modalContent,
          header: classes.modalHeader,
          title: classes.modalTitle,
        }),
      }),
      Drawer: Drawer.extend({
        classNames: bare({
          content: classes.modalContent,
          header: classes.modalHeader,
          title: classes.modalTitle,
        }),
      }),
      InputWrapper: Input.Wrapper.extend({
        classNames: bare({
          label: classes.inputLabel,
          description: classes.inputDescription,
          error: classes.inputError,
        }),
      }),
      ScrollArea: ScrollArea.extend({
        classNames: bare({
          root: classes.scrollArea,
          scrollbar: classes.scrollbar,
          thumb: classes.scrollThumb,
        }),
        vars: bareVars((props) =>
          props.scrollbarSize === undefined
            ? { '--scrollarea-scrollbar-size': rem(8) }
            : ({} as CssVars)
        ),
      }),
      TextInput: TextInput.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      Textarea: Textarea.extend({ classNames: bare(INPUT_CLASS_NAMES) }),
      Select: Select.extend({ classNames: bare(INPUT_CLASS_NAMES), vars: inputVars() as any }),
      MultiSelect: MultiSelect.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      TagsInput: TagsInput.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      NumberInput: NumberInput.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      PasswordInput: PasswordInput.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      Autocomplete: Autocomplete.extend({
        classNames: bare(INPUT_CLASS_NAMES),
        vars: inputVars() as any,
      }),
      Checkbox: Checkbox.extend({
        classNames: bare({
          input: classes.choiceInput,
          label: classes.choiceLabel,
          description: classes.inputDescription,
        }),
        vars: bareVars((props) => ({
          '--checkbox-radius': 'var(--ae-control-radius)',
          '--checkbox-icon-color': 'var(--mantine-primary-color-contrast)',
          ...(props.size === undefined ? { '--checkbox-size': rem(16) } : {}),
        })),
      }),
      Chip: Chip.extend({ classNames: bare({ label: classes.chipLabel }) }),
      Radio: Radio.extend({
        classNames: bare({
          radio: classes.choiceInput,
          label: classes.choiceLabel,
          description: classes.inputDescription,
        }),
        vars: bareVars((props) => ({
          '--radio-icon-color': 'var(--mantine-primary-color-contrast)',
          ...(props.size === undefined
            ? { '--radio-size': rem(16), '--radio-icon-size': rem(6) }
            : {}),
        })),
      }),
      Switch: Switch.extend({
        classNames: bare({
          track: classes.switchTrack,
          thumb: classes.switchThumb,
          label: classes.choiceLabel,
          description: classes.inputDescription,
        }),
      }),
      Title: Title.extend({
        classNames: bare({ root: classes.title }),
        vars: bareVars(() => ({
          '--title-fz': 'var(--ae-font-size-xs)',
          '--title-lh': 'var(--ae-line-height-xs)',
          '--title-fw': '500',
        })),
      }),
      Table: Table.extend({
        classNames: bare({ th: classes.tableTh, td: classes.tableTd, tr: classes.tableTr }),
      }),
      DataList: DataList.extend({
        classNames: bare({
          item: classes.dataListItem,
          itemLabel: classes.dataListLabel,
          itemValue: classes.dataListValue,
        }),
        vars: bareVars(() => ({
          '--data-list-fz': 'var(--ae-font-size-xs)',
          '--data-list-lh': 'var(--ae-line-height-xs)',
        })),
      }),
      Stepper: Stepper.extend({
        classNames: bare({
          stepIcon: classes.stepIcon,
          stepLabel: classes.stepLabel,
          stepDescription: classes.stepDescription,
          separator: classes.stepSeparator,
          verticalSeparator: classes.stepVerticalSeparator,
        }),
        vars: bareVars(() => ({
          '--stepper-icon-size': 'var(--ae-control-height-sm)',
          '--stepper-fz': 'var(--ae-font-size-xs)',
          '--stepper-spacing': rem(8),
          '--stepper-icon-color': 'var(--mantine-primary-color-contrast)',
        })),
      }),
      Accordion: Accordion.extend({
        classNames: bare({
          item: classes.accordionItem,
          control: classes.accordionControl,
          label: classes.accordionLabel,
          content: classes.accordionContent,
        }),
      }),
      Progress: Progress.extend({
        classNames: bare({ root: classes.progress }),
        vars: bareVars(() => ({ '--progress-size': rem(4) })),
      }),
      Loader: Loader.extend({
        vars: bareVars(() => ({ '--loader-color': 'var(--ae-fg-muted)' })),
      }),
      EmptyState: EmptyState.extend({
        classNames: bare({ title: classes.emptyTitle, description: classes.emptyDescription }),
        vars: bareVars(() => ({
          '--empty-state-indicator-size': rem(32),
          '--empty-state-indicator-color': 'var(--ae-fg-subtle)',
          '--empty-state-gap': rem(6),
          '--empty-state-title-fz': 'var(--ae-font-size-sm)',
          '--empty-state-description-fz': 'var(--ae-font-size-xs)',
        })),
      }),
      Kbd: Kbd.extend({ classNames: bare({ root: classes.kbd }) }),
      Code: Code.extend({ classNames: bare({ root: classes.code }) }),
      Skeleton: Skeleton.extend({ classNames: bare({ root: classes.skeleton }) }),
      Tooltip: Tooltip.extend({ classNames: bare({ tooltip: classes.tooltip }) }),
    },
  });
  return overrides ? mergeThemeOverrides(theme, overrides) : theme;
}

/**
 * Adds the kit theme under a host theme for a global setup: host values win, kit component styles
 * fill the gaps. Portals get the `ae-kit` class; put the same class on the app root element.
 */
export function mergeAiKitTheme(hostTheme?: MantineThemeOverride): MantineThemeOverride {
  const kitTheme = mergeThemeOverrides(createAiKitTheme(), {
    components: { Portal: { defaultProps: { className: AI_KIT_SCOPE_CLASS } } },
  });
  return hostTheme ? mergeThemeOverrides(kitTheme, hostTheme) : kitTheme;
}
