import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Indicator,
  Portal,
  Transition,
  UnstyledButton,
  type MantineTransition,
} from '@mantine/core';
import { useReducedMotion, useUncontrolled } from '@mantine/hooks';
import { IconMessageCircle, IconX } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import {
  findLauncherFeed,
  getLauncherFocusTarget,
  getLauncherLayout,
  getLauncherVars,
  LAUNCHER_BUTTON_SIZE,
  type ChatLauncherOffset,
  type ChatLauncherPosition,
} from './launcher-layout';
import { LauncherActions, type LauncherAction } from './LauncherActions';
import { useFrozenPageScroll, useLauncherViewport } from './use-launcher-viewport';
import classes from './ChatLauncher.module.css';

export interface ChatLauncherLabels {
  /** Accessible label of the launcher button */
  open: string;
  /** Accessible label of the header close button */
  close: string;
  /** Accessible name of the panel when `title` is not a string */
  panel: string;
  /** Unread count added to the button's accessible name while the badge is shown */
  unread: (count: number) => string;
  /** Accessible label of the button while it opens the actions */
  actions: string;
  /** Accessible label of the button while the actions are open */
  closeActions: string;
}

export type ChatLauncherClassNames = Partial<
  Record<'root' | 'button' | 'panel' | 'header' | 'title' | 'body' | 'actions', string>
>;

export interface ChatLauncherProps {
  /** Panel content, usually `AgentChat` */
  children: React.ReactNode;
  /** Controlled open state */
  opened?: boolean;
  /** Initial open state when `opened` is not controlled, `false` by default */
  defaultOpened?: boolean;
  /** Called when the button, the close button or Escape changes the open state */
  onOpenedChange?: (opened: boolean) => void;
  /** Corner of the viewport, `bottom-right` by default */
  position?: ChatLauncherPosition;
  /** Distance from the viewport edges in px, `24` by default; drops to 12px when the panel only fits that way */
  offset?: ChatLauncherOffset;
  /** Panel width in px, never wider than the viewport, `380` by default */
  panelWidth?: number;
  /** Panel height in px, never taller than the viewport, `640` by default */
  panelHeight?: number;
  /** Panel header title */
  title?: React.ReactNode;
  /** Actions in the panel header before the close button */
  headerActions?: React.ReactNode;
  /** Button icon while the panel is closed */
  icon?: React.ReactNode;
  /** Second face of the button, usually an avatar, shown by `iconAnimation` */
  altIcon?: React.ReactNode;
  /** How the button alternates between `icon` and `altIcon` while it is closed, `none` by default */
  iconAnimation?: 'none' | 'swap' | 'flip' | 'cover';
  /** Diameter of the launcher button in px, `56` by default */
  buttonSize?: number;
  /** Order the actions appear in: one after another, or all at once, `sequence` by default */
  actionsMotion?: 'sequence' | 'together';
  /** Draws slow rings around the closed button to invite the first click */
  pulse?: boolean;
  /** Actions that fan out of the button instead of opening the panel on the first click */
  actions?: LauncherAction[];
  /** Diameter of an action button in px, `48` by default */
  actionSize?: number;
  /** Space between the action buttons in px, `12` by default */
  actionGap?: number;
  /** Unread messages shown as a badge on the closed button, hidden at `0` */
  unreadCount?: number;
  /** Keeps the panel content mounted while closed so the chat keeps its state, `true` by default */
  keepMounted?: boolean;
  /** Closes the panel on Escape while focus is inside the launcher, `true` by default */
  closeOnEscape?: boolean;
  /** Opens the panel full screen when it does not fit or the available width is below `fullScreenBreakpoint`, `true` by default */
  mobileFullScreen?: boolean;
  /** Available width in px below which the panel opens full screen, `520` by default */
  fullScreenBreakpoint?: number;
  /** Renders in a portal at the end of the document, `true` by default; turn off to position the launcher against a transformed container */
  withinPortal?: boolean;
  /** Stacking order of the button and the panel, `200` by default */
  zIndex?: number;
  /** Overrides of the default English labels */
  labels?: Partial<ChatLauncherLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
  /** Class names of inner elements */
  classNames?: ChatLauncherClassNames;
}

export const DEFAULT_CHAT_LAUNCHER_LABELS: ChatLauncherLabels = {
  open: 'Open chat',
  close: 'Close chat',
  panel: 'Chat',
  unread: (count) => `${count} unread`,
  actions: 'Show ways to get in touch',
  closeActions: 'Hide ways to get in touch',
};

function getActiveElement(node: Node | null): Element | null {
  const root = node?.getRootNode();
  return root instanceof ShadowRoot || root instanceof Document
    ? root.activeElement
    : document.activeElement;
}

const NO_ACTIONS: LauncherAction[] = [];

const PANEL_TRANSITION: MantineTransition = {
  in: { opacity: 1, transform: 'scale(1)' },
  out: { opacity: 0, transform: 'scale(0.9)' },
  common: { transformOrigin: 'var(--launcher-origin)' },
  transitionProperty: 'opacity, transform',
};

/** Floating chat button that opens a non-modal chat panel from its corner and keeps the chat mounted while closed */
export const ChatLauncher = memo(function ChatLauncher({
  children,
  opened: openedProp,
  defaultOpened = false,
  onOpenedChange,
  position = 'bottom-right',
  offset = 24,
  panelWidth = 380,
  panelHeight = 640,
  title,
  headerActions,
  icon,
  altIcon,
  iconAnimation = 'none',
  pulse = false,
  actions = NO_ACTIONS,
  actionSize = 48,
  actionGap = 12,
  actionsMotion = 'sequence',
  buttonSize = LAUNCHER_BUTTON_SIZE,
  unreadCount = 0,
  keepMounted = true,
  closeOnEscape = true,
  mobileFullScreen = true,
  fullScreenBreakpoint = 520,
  withinPortal = true,
  zIndex = 200,
  labels: labelsProp,
  className,
  style,
  classNames,
}: ChatLauncherProps) {
  const labels = { ...DEFAULT_CHAT_LAUNCHER_LABELS, ...labelsProp };
  const [opened, setOpened] = useUncontrolled({
    value: openedProp,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange: onOpenedChange,
  });
  const [probe, setProbe] = useState<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(opened);
  const viewport = useLauncherViewport(probe);
  const layout = getLauncherLayout({
    availableWidth: viewport.width,
    availableHeight: viewport.height,
    panelWidth,
    panelHeight,
    offset,
    mobileFullScreen,
    fullScreenBreakpoint,
  });
  const fullScreen = layout.mode === 'fullscreen';
  const reduceMotion = useReducedMotion();
  useFrozenPageScroll(probe, withinPortal && opened && fullScreen);
  const panelId = useId();
  const titleId = useId();
  const actionsId = useId();
  const [actionsOpened, setActionsOpened] = useState(false);
  const hasActions = actions.length > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openedByUser = useRef(false);
  const returnFocus = useRef(false);

  const close = useCallback(() => {
    returnFocus.current = !!panelRef.current?.contains(getActiveElement(panelRef.current));
    openedByUser.current = false;
    setOpened(false);
  }, [setOpened]);

  useEffect(() => {
    if (!opened && returnFocus.current) {
      returnFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [opened]);

  const open = () => {
    openedByUser.current = true;
    setActionsOpened(false);
    setOpened(true);
  };
  const openRef = useRef(open);
  openRef.current = open;

  const handleAction = useCallback((action: LauncherAction) => {
    setActionsOpened(false);
    action.onClick?.();
    if (action.opensChat) {
      openRef.current();
    } else {
      buttonRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (opened || !hasActions) {
      setActionsOpened(false);
    }
  }, [opened, hasActions]);

  useEffect(() => {
    if (!actionsOpened) {
      return undefined;
    }
    const insideLauncher = (target: EventTarget | null, path: EventTarget[]) =>
      path.length > 0
        ? path.includes(rootRef.current as EventTarget)
        : target instanceof Node && !!rootRef.current?.contains(target);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !closeOnEscape) {
        return;
      }
      const active = getActiveElement(rootRef.current);
      setActionsOpened(false);
      if (active instanceof Node && rootRef.current?.contains(active)) {
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!insideLauncher(event.target, event.composedPath())) {
        setActionsOpened(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [actionsOpened, closeOnEscape]);

  useEffect(() => {
    if (!opened || !closeOnEscape) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }
      if (panelRef.current?.contains(getActiveElement(panelRef.current))) {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [opened, closeOnEscape, close]);

  useEffect(() => {
    if (entered && openedByUser.current) {
      getLauncherFocusTarget(panelRef.current, bodyRef.current)?.focus();
    }
  }, [entered]);

  useEffect(() => {
    const feed = entered ? findLauncherFeed(bodyRef.current) : null;
    if (!feed) {
      return undefined;
    }
    // The feed is the last scroll container before the host page: wheel and touch at its edges must not scroll the page behind a floating panel.
    feed.style.overscrollBehaviorY = 'contain';
    return () => {
      feed.style.overscrollBehaviorY = '';
    };
  }, [entered]);

  const vars = {
    ...getLauncherVars(position, layout),
    '--launcher-z-index': String(zIndex),
    '--launcher-button-size': `${buttonSize}px`,
  } as React.CSSProperties;
  const titleIsText = typeof title === 'string';
  const showUnread = !opened && !actionsOpened && unreadCount > 0;
  const buttonLabel = actionsOpened
    ? labels.closeActions
    : hasActions
      ? labels.actions
      : labels.open;

  const launcher = (
    <Box
      ref={rootRef}
      className={cx(classes.root, classNames?.root, className)}
      style={{ ...vars, ...style }}
      data-position={position}
      data-opened={opened || undefined}
      data-actions-opened={actionsOpened || undefined}
      data-mode={layout.mode}
    >
      <div ref={setProbe} className={classes.probe} aria-hidden />
      <Transition
        mounted={opened}
        transition={PANEL_TRANSITION}
        duration={reduceMotion ? 0 : 200}
        exitDuration={reduceMotion ? 0 : 150}
        timingFunction="ease-out"
        keepMounted={keepMounted}
        onEntered={() => setEntered(true)}
        onExit={() => setEntered(false)}
      >
        {(transitionStyles) => (
          <Box
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal={false}
            aria-labelledby={titleIsText ? titleId : undefined}
            aria-label={titleIsText ? undefined : labels.panel}
            tabIndex={-1}
            className={cx(classes.panel, classNames?.panel)}
            style={transitionStyles}
          >
            <Box component="header" className={cx(classes.header, classNames?.header)}>
              <Box
                id={titleId}
                component={titleIsText ? 'h2' : 'div'}
                className={cx(classes.title, classNames?.title)}
              >
                {title}
              </Box>
              {headerActions}
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={labels.close}
                onClick={close}
                className={classes.headerClose}
              >
                <IconX size={16} />
              </ActionIcon>
            </Box>
            <Box ref={bodyRef} className={cx(classes.body, classNames?.body)}>
              {children}
            </Box>
          </Box>
        )}
      </Transition>

      <Indicator
        label={unreadCount > 99 ? '99+' : unreadCount}
        disabled={!showUnread}
        size={18}
        offset={6}
        color="red"
        className={classes.indicator}
        classNames={{ indicator: classes.badge }}
      >
        <UnstyledButton
          ref={buttonRef}
          className={cx(classes.button, classNames?.button)}
          aria-label={showUnread ? `${buttonLabel}, ${labels.unread(unreadCount)}` : buttonLabel}
          aria-expanded={hasActions && !opened ? actionsOpened : opened}
          aria-controls={hasActions && !opened ? actionsId : panelId}
          tabIndex={opened ? -1 : undefined}
          data-pulse={pulse && !opened && !actionsOpened ? '' : undefined}
          onClick={() => (hasActions ? setActionsOpened((value) => !value) : open())}
        >
          {actionsOpened ? (
            <IconX size={24} stroke={1.75} />
          ) : altIcon && iconAnimation !== 'none' ? (
            <span className={classes.faces} data-animation={iconAnimation}>
              <span className={classes.face}>
                {icon ?? <IconMessageCircle size={24} stroke={1.75} />}
              </span>
              <span className={classes.altFace}>{altIcon}</span>
            </span>
          ) : (
            (icon ?? <IconMessageCircle size={24} stroke={1.75} />)
          )}
        </UnstyledButton>
      </Indicator>

      {hasActions && (
        <LauncherActions
          id={actionsId}
          label={labels.actions}
          actions={actions}
          opened={actionsOpened}
          onAction={handleAction}
          position={position}
          size={actionSize}
          gap={actionGap}
          motion={actionsMotion}
          className={classNames?.actions}
        />
      )}
    </Box>
  );

  return withinPortal ? <Portal>{launcher}</Portal> : launcher;
});

ChatLauncher.displayName = 'ChatLauncher';
