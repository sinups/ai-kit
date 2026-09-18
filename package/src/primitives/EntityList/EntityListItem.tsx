import React, { createContext, memo, useContext } from 'react';
import { ActionIcon, Group, Menu, NavLink, Text, type MantineColor } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import classes from './EntityList.module.css';

export interface EntityListItemAction {
  /** Menu item label */
  label: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Called when the menu item is clicked */
  onClick: () => void;
  /** Menu item color, for example `red` for destructive actions */
  color?: MantineColor;
  /** Disables the menu item */
  disabled?: boolean;
}

export interface EntityListItemLabels {
  /** Accessible label of the actions menu button, `Actions` by default */
  actions: string;
}

export const DEFAULT_ENTITY_LIST_ITEM_LABELS: EntityListItemLabels = {
  actions: 'Actions',
};

export interface EntityListItemProps {
  /** Main line of the row */
  title: React.ReactNode;
  /** Secondary text, clamped to `descriptionLines` lines */
  description?: React.ReactNode;
  /** Icon or avatar rendered on the left */
  icon?: React.ReactNode;
  /** Status slot rendered next to the title, for example a status badge */
  status?: React.ReactNode;
  /** Content aligned to the right before the actions menu: time, counters */
  meta?: React.ReactNode;
  /** Badges rendered after the title */
  badges?: React.ReactNode;
  /** Per-item actions shown in a menu, opening the menu does not select the row */
  actions?: EntityListItemAction[];
  /** Renders the row in the active state */
  selected?: boolean;
  /** Dims the row and blocks clicks */
  disabled?: boolean;
  /** Maximum number of description lines, `2` by default */
  descriptionLines?: number;
  /** Maximum number of title lines before the ellipsis, `1` by default; `2` suits long names */
  titleLines?: number;
  /** Called when a standalone row is clicked and makes it focusable; ignored inside `EntityList`, which selects through `onSelect` */
  onClick?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<EntityListItemLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const EntityListOptionContext = createContext(false);

const SOFT_ACTIVE_VARS = {
  root: {
    '--nl-bg': 'color-mix(in srgb, var(--ae-fg) 6%, transparent)',
    '--nl-hover': 'color-mix(in srgb, var(--ae-fg) 6%, transparent)',
    '--nl-color': 'var(--ae-fg)',
  },
  children: {},
};

function softActiveVars() {
  return SOFT_ACTIVE_VARS;
}

function stopPropagation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export const EntityListItem = memo(function EntityListItem({
  title,
  description,
  icon,
  status,
  meta,
  badges,
  actions,
  labels: labelsProp,
  selected = false,
  disabled = false,
  descriptionLines = 2,
  titleLines = 1,
  onClick,
  className,
  style,
}: EntityListItemProps) {
  const labels = { ...DEFAULT_ENTITY_LIST_ITEM_LABELS, ...labelsProp };
  const insideList = useContext(EntityListOptionContext);
  const hasActions = !!actions && actions.length > 0;
  const interactive = !!onClick && !disabled && !insideList;

  const rightSection =
    meta || hasActions ? (
      <Group gap="xs" wrap="nowrap">
        {meta && (
          <Text component="div" size="xs" c="dimmed" className={classes.meta}>
            {meta}
          </Text>
        )}
        {hasActions && (
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={labels.actions}
                disabled={disabled}
                onClick={stopPropagation}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown onClick={stopPropagation} onKeyDown={stopPropagation}>
              {actions.map((action) => (
                <Menu.Item
                  key={action.label}
                  leftSection={action.icon}
                  color={action.color}
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  {action.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    ) : undefined;

  return (
    <NavLink
      component="div"
      active={selected}
      vars={softActiveVars}
      disabled={disabled}
      leftSection={icon}
      rightSection={rightSection}
      disableRightSectionRotation
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (event: React.KeyboardEvent<HTMLElement>) => {
              if (
                event.target === event.currentTarget &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cx(classes.item, className)}
      style={style}
      classNames={{ body: classes.itemBody, label: classes.itemLabel }}
      label={
        <Group gap={6} wrap="nowrap" className={classes.labelRow}>
          <Text
            component="span"
            size="sm"
            fw={500}
            truncate={titleLines > 1 ? undefined : 'end'}
            lineClamp={titleLines > 1 ? titleLines : undefined}
            data-lines={titleLines > 1 ? titleLines : undefined}
            className={classes.title}
          >
            {title}
          </Text>
          {(status || badges) && (
            <Group gap={6} wrap="nowrap" className={classes.badges}>
              {status}
              {badges}
            </Group>
          )}
        </Group>
      }
      description={
        description ? (
          <Text component="span" size="xs" c="dimmed" lineClamp={descriptionLines}>
            {description}
          </Text>
        ) : undefined
      }
    />
  );
});

EntityListItem.displayName = 'EntityListItem';
