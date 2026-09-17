import React, { memo } from 'react';
import { Box, Button, Divider, EmptyState, Group, rem, ScrollArea, Splitter } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconArrowLeft, IconLayoutSidebarRight } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import classes from './MasterDetail.module.css';

const DEFAULT_BREAKPOINT = 720;

export interface MasterDetailProps {
  /** List pane content */
  list: React.ReactNode;
  /** Detail of the selected item, `null` when nothing is selected */
  detail: React.ReactNode | null;
  /** When narrow, shows the detail instead of the list, `true` whenever `detail` is set by default */
  detailOpen?: boolean;
  /** Called by the back button shown above the detail when narrow, the button is rendered only when set */
  onBack?: () => void;
  /** Back button label, `Back` by default */
  backLabel?: string;
  /** List pane width in px when wide, `320` by default */
  listWidth?: number;
  /** Component width in px from which list and detail sit side by side, `720` by default */
  breakpoint?: number;
  /** Lets the user drag the border between the panes when wide */
  resizable?: boolean;
  /** Shown in the detail pane when wide and `detail` is `null`, an empty state with `emptyTitle` and `emptyDescription` by default */
  emptyDetail?: React.ReactNode;
  /** Title of the default empty detail, `Select an item` by default */
  emptyTitle?: React.ReactNode;
  /** Description of the default empty detail, `Its details will appear here` by default */
  emptyDescription?: React.ReactNode;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** List and detail: two panes when wide, one pane with a back action when narrow; fills the parent height */
export const MasterDetail = memo(function MasterDetail({
  list,
  detail,
  detailOpen,
  onBack,
  backLabel = 'Back',
  listWidth = 320,
  breakpoint = DEFAULT_BREAKPOINT,
  resizable = false,
  emptyDetail,
  emptyTitle = 'Select an item',
  emptyDescription = 'Its details will appear here',
  className,
  style,
}: MasterDetailProps) {
  const { ref, width } = useElementSize();
  const measured = width > 0;
  const isWide = width >= breakpoint;
  const hasDetail = detail !== null && detail !== undefined;
  const showDetail = hasDetail && (detailOpen ?? true);

  const listPane = (
    <ScrollArea className={classes.pane} type="auto" data-pane="list">
      {list}
    </ScrollArea>
  );

  const detailPane = (
    <ScrollArea className={classes.pane} type="auto" data-pane="detail">
      {hasDetail
        ? detail
        : (emptyDetail ?? (
            <EmptyState
              className={classes.empty}
              icon={<IconLayoutSidebarRight />}
              title={emptyTitle}
              description={emptyDescription}
            />
          ))}
    </ScrollArea>
  );

  const listColumn = (
    <Box className={classes.list} hidden={!isWide && showDetail} data-column="list">
      {listPane}
    </Box>
  );

  const detailColumn = (
    <Box className={classes.detail} hidden={!isWide && !showDetail} data-column="detail">
      {onBack && (
        <Box className={classes.back} hidden={isWide || !showDetail}>
          <Group px="xs" py={4}>
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={onBack}
            >
              {backLabel}
            </Button>
          </Group>
        </Box>
      )}
      {detailPane}
    </Box>
  );

  const narrowPaneStyle = isWide ? undefined : { flexGrow: 1, flexBasis: 0 };

  let content: React.ReactNode = null;
  if (!resizable) {
    content = (
      <Box className={classes.panes}>
        {listColumn}
        <Divider orientation="vertical" className={classes.divider} hidden={!isWide} />
        {detailColumn}
      </Box>
    );
  } else if (measured) {
    content = (
      <Splitter className={classes.fill} classNames={{ handle: classes.handle }}>
        <Splitter.Pane
          defaultSize={`${listWidth}px`}
          min={`${Math.round(listWidth * 0.6)}px`}
          max={`${listWidth * 2}px`}
          className={classes.splitterPane}
          hidden={!isWide && showDetail}
          style={narrowPaneStyle}
        >
          {listColumn}
        </Splitter.Pane>
        <Splitter.Pane
          defaultSize={100}
          className={classes.splitterPane}
          hidden={!isWide && !showDetail}
          style={narrowPaneStyle}
        >
          {detailColumn}
        </Splitter.Pane>
      </Splitter>
    );
  }

  return (
    <Box
      ref={ref}
      className={cx(classes.root, className)}
      style={{ '--ae-master-detail-list-width': rem(listWidth), ...style } as React.CSSProperties}
      data-layout={measured ? (isWide ? 'wide' : 'narrow') : undefined}
      data-measuring={(!measured && breakpoint !== DEFAULT_BREAKPOINT) || undefined}
    >
      {content}
    </Box>
  );
});
