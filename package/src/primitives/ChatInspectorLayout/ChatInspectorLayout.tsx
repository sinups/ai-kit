import React, { memo, useEffect, useRef, useState } from 'react';
import { Box, Drawer, Splitter, Tabs } from '@mantine/core';
import { useElementSize, type SplitterPaneSize, type UseSplitterReturnValue } from '@mantine/hooks';
import { cx } from '../../utils/cx';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';
import classes from './ChatInspectorLayout.module.css';

export interface ChatInspectorPanel {
  /** Stable id, used as the tab value */
  id: string;
  /** Tab label; the tab bar is hidden while there is a single panel */
  label: React.ReactNode;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Panel content, for example `DiffReview` or `BackgroundTasksPanel` */
  content: React.ReactNode;
}

export type ChatInspectorLayoutLabels = {
  /** Accessible name of the inspector region and of its drawer, `Inspector` by default */
  inspector: string;
};

export const DEFAULT_CHAT_INSPECTOR_LAYOUT_LABELS: ChatInspectorLayoutLabels = {
  inspector: 'Inspector',
};

export interface ChatInspectorLayoutProps {
  /** Chat area, usually `AgentChat` with a header above it */
  children: React.ReactNode;
  /** Inspector content; ignored when `panels` is set */
  inspector?: React.ReactNode;
  /** Inspector panels rendered as tabs */
  panels?: ChatInspectorPanel[];
  /** Controlled active panel id */
  activePanelId?: string;
  /** Called when the user switches panels */
  onActivePanelIdChange?: (id: string) => void;
  /** Controlled open state of the inspector */
  opened?: boolean;
  /** Called when the inspector is opened or closed, including by dragging the pane shut */
  onOpenedChange?: (opened: boolean) => void;
  /** Open state before the first change, `true` by default */
  defaultOpened?: boolean;
  /** Width in px below which the inspector moves into a drawer, `900` by default */
  breakpoint?: number;
  /** Forces the drawer instead of measuring the layout width */
  compact?: boolean;
  /** Share of the width taken by the inspector pane in percent, `38` by default */
  defaultSize?: number;
  /** Minimum width of the chat pane, `420px` by default */
  minChatWidth?: SplitterPaneSize;
  /** Minimum width of the inspector pane, `360px` by default */
  minInspectorWidth?: SplitterPaneSize;
  /** Edge the drawer slides in from in compact mode, `bottom` by default */
  drawerPosition?: 'bottom' | 'right';
  /** Drawer size in compact mode, `92%` by default */
  drawerSize?: string;
  /** Overrides of the default English labels */
  labels?: Partial<ChatInspectorLayoutLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Chat next to a resizable, collapsible inspector; below `breakpoint` the inspector becomes a drawer. Give the root or its flex parent a height, such as `100dvh`: the panes take their height from it */
export const ChatInspectorLayout = memo(function ChatInspectorLayout({
  children,
  inspector,
  panels,
  activePanelId,
  onActivePanelIdChange,
  opened,
  onOpenedChange,
  defaultOpened = true,
  breakpoint = 900,
  compact,
  defaultSize = 38,
  minChatWidth = '420px',
  minInspectorWidth = '360px',
  drawerPosition = 'bottom',
  drawerSize = '92%',
  labels: labelsOverride,
  className,
  style,
}: ChatInspectorLayoutProps) {
  const labels = { ...DEFAULT_CHAT_INSPECTOR_LAYOUT_LABELS, ...labelsOverride };
  const { ref, width } = useElementSize();
  const splitterRef = useRef<UseSplitterReturnValue | null>(null);
  const [uncontrolledOpened, setUncontrolledOpened] = useState(defaultOpened);
  const [uncontrolledPanelId, setUncontrolledPanelId] = useState(() => panels?.[0]?.id ?? '');

  const isOpened = opened ?? uncontrolledOpened;
  const openedRef = useRef(isOpened);
  useEffect(() => {
    openedRef.current = isOpened;
  });
  const isMeasured = compact !== undefined || width > 0;
  const isCompact = compact ?? (width > 0 && width < breakpoint);
  const requestedId = activePanelId ?? uncontrolledPanelId;
  const activeId = panels?.some((panel) => panel.id === requestedId)
    ? requestedId
    : (panels?.[0]?.id ?? '');

  const setOpened = (next: boolean) => {
    if (opened === undefined) {
      setUncontrolledOpened(next);
    }
    onOpenedChange?.(next);
  };

  useEffect(() => {
    const splitter = splitterRef.current;
    if (!splitter) {
      return;
    }
    const shouldCollapse = isCompact || !isOpened;
    if (shouldCollapse && !splitter.collapsed[1]) {
      splitter.collapse(1);
    } else if (!shouldCollapse && splitter.collapsed[1]) {
      splitter.expand(1);
    }
  }, [isOpened, isCompact]);

  const setPanel = (value: string | null) => {
    if (!value) {
      return;
    }
    if (activePanelId === undefined) {
      setUncontrolledPanelId(value);
    }
    onActivePanelIdChange?.(value);
  };

  let panelContent: React.ReactNode = inspector;
  if (panels && panels.length > 1) {
    panelContent = (
      <Tabs value={activeId} onChange={setPanel} className={classes.tabs} keepMounted={false}>
        <Tabs.List className={classes.tabsList}>
          {panels.map((panel) => (
            <Tabs.Tab
              key={panel.id}
              value={panel.id}
              leftSection={panel.icon}
              className={classes.tab}
            >
              {panel.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {panels.map((panel) => (
          <Tabs.Panel key={panel.id} value={panel.id} className={classes.panelBody}>
            {panel.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    );
  } else if (panels && panels.length === 1) {
    panelContent = panels[0].content;
  }

  const inspectorRegion = (
    <Box component="section" aria-label={labels.inspector} className={classes.inspector}>
      {panelContent}
    </Box>
  );

  return (
    <Box
      ref={ref}
      className={cx(classes.root, className)}
      style={style}
      data-compact={isCompact || undefined}
    >
      <Splitter
        className={classes.splitter}
        classNames={{ handle: classes.handle }}
        splitterRef={splitterRef}
        withHandle={false}
        lineSize={1}
        handleColor="var(--ae-border)"
        onCollapseChange={(index, collapsed) => {
          if (index !== 1 || isCompact) {
            return;
          }
          if (collapsed === isOpened) {
            setOpened(!collapsed);
          }
          setTimeout(() => {
            const splitter = splitterRef.current;
            if (splitter && openedRef.current === collapsed) {
              if (collapsed) {
                splitter.expand(1);
              } else {
                splitter.collapse(1);
              }
            }
          });
        }}
      >
        <Splitter.Pane
          defaultSize={100 - defaultSize}
          min={isCompact ? undefined : minChatWidth}
          className={classes.pane}
        >
          <Box className={classes.chat}>{children}</Box>
        </Splitter.Pane>
        <Splitter.Pane
          defaultSize={defaultSize}
          min={minInspectorWidth}
          collapsible
          collapseThreshold="240px"
          className={classes.pane}
        >
          {isMeasured && !isCompact && inspectorRegion}
        </Splitter.Pane>
      </Splitter>
      {isCompact && (
        <Drawer
          opened={isOpened}
          onClose={() => setOpened(false)}
          position={drawerPosition}
          size={drawerSize}
          withCloseButton={false}
          aria-label={labels.inspector}
          classNames={{
            inner: OVERLAY_INNER_CLASS,
            content: classes.drawerContent,
            body: classes.drawerBody,
          }}
        >
          {inspectorRegion}
        </Drawer>
      )}
    </Box>
  );
});

ChatInspectorLayout.displayName = 'ChatInspectorLayout';
