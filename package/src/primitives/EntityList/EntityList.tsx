import React, { memo, useId, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  EmptyState,
  Group,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import {
  filterEntities,
  findEdgeEnabledIndex,
  findNextEnabledIndex,
  groupEntities,
} from './entity-list';
import { EntityListOptionContext } from './EntityListItem';
import classes from './EntityList.module.css';

export interface EntityListEmpty {
  /** Empty state title */
  title: React.ReactNode;
  /** Empty state description */
  description?: React.ReactNode;
  /** Call to action, for example a button that creates the first item */
  action?: React.ReactNode;
  /** Icon rendered above the title */
  icon?: React.ReactNode;
}

export interface EntityListSearch<T> {
  /** Current query */
  value: string;
  /** Called with the new query */
  onChange: (value: string) => void;
  /** Search input placeholder, `Search` by default */
  placeholder?: string;
  /** Filters items inside the list, when omitted the host filters `items` itself */
  filter?: (item: T, query: string) => boolean;
  /** Adds `data-autofocus` to the input so an enclosing Modal or Drawer focuses it on open */
  dataAutofocus?: boolean;
}

export interface EntityListFilterOption {
  /** Option value */
  value: string;
  /** Option label */
  label: string;
  /** Number of items matching the option */
  count?: number;
}

export interface EntityListFilters<T> {
  /** Selected option value */
  value: string;
  /** Called with the selected option value */
  onChange: (value: string) => void;
  /** Filter options, rendered as a segmented control when there are at most 4 and the list is wide */
  options: EntityListFilterOption[];
  /** Filters items inside the list, when omitted the host filters `items` itself */
  filter?: (item: T, value: string) => boolean;
  /** Accessible label of the filter control, `Filter` by default */
  label?: string;
}

export interface EntityListItemState {
  /** Whether the item is the selected one */
  selected: boolean;
}

export interface EntityListProps<T> {
  /** Items to render */
  items: T[];
  /** Returns a stable unique id of an item */
  getId: (item: T) => string;
  /** Renders an item, usually with `EntityListItem` */
  renderItem: (item: T, state: EntityListItemState) => React.ReactNode;
  /** Id of the selected item */
  selectedId?: string | null;
  /** Called when an item is clicked or chosen with Enter */
  onSelect?: (item: T) => void;
  /** Returns whether an item is disabled, disabled items are skipped by the keyboard and cannot be selected */
  isItemDisabled?: (item: T) => boolean;
  /** Shows skeleton rows instead of items */
  loading?: boolean;
  /** Number of skeleton rows, `4` by default */
  skeletonCount?: number;
  /** Error message, shown instead of items */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert, the button is rendered only when set */
  onRetry?: () => void;
  /** Retry button label, `Retry` by default */
  retryLabel?: string;
  /** Empty state shown when there are no items and no search query */
  empty?: EntityListEmpty;
  /** Search input above the list */
  search?: EntityListSearch<T>;
  /** Filter control above the list */
  filters?: EntityListFilters<T>;
  /** Returns the group of an item, groups get headers */
  groupBy?: (item: T) => string;
  /** Group keys rendered first in this order, other groups follow in order of appearance */
  groupOrder?: string[];
  /** Content rendered to the right of the search input, for example an add button */
  toolbar?: React.ReactNode;
  /** Text shown when the search query matches nothing, `No results` by default */
  noResults?: React.ReactNode;
  /** Accessible label of the list */
  ariaLabel?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const WIDE_FILTERS_WIDTH = 480;

function EntityListInner<T>({
  items,
  getId,
  renderItem,
  selectedId,
  onSelect,
  isItemDisabled,
  loading = false,
  skeletonCount = 4,
  error,
  onRetry,
  retryLabel = 'Retry',
  empty,
  search,
  filters,
  groupBy,
  groupOrder,
  toolbar,
  noResults = 'No results',
  ariaLabel,
  className,
  style,
}: EntityListProps<T>) {
  const baseId = useId();
  const { ref: rootRef, width } = useElementSize<HTMLDivElement>();
  const optionRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeId, setActiveId] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    const byFilter =
      filters?.filter && filters.value
        ? items.filter((item) => filters.filter!(item, filters.value))
        : items;
    return filterEntities(byFilter, search?.value ?? '', search?.filter);
  }, [items, filters, search]);

  const groups = useMemo(
    () => groupEntities(visibleItems, groupBy, groupOrder),
    [visibleItems, groupBy, groupOrder]
  );

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const flatIds = useMemo(() => flat.map(getId), [flat, getId]);
  const disabled = useMemo(
    () => flat.map((item) => isItemDisabled?.(item) ?? false),
    [flat, isItemDisabled]
  );

  const tabbableId = (() => {
    for (const candidate of [activeId, selectedId]) {
      const index = candidate ? flatIds.indexOf(candidate) : -1;
      if (index !== -1 && !disabled[index]) {
        return candidate;
      }
    }
    const first = findEdgeEnabledIndex(disabled, 'first');
    return first === -1 ? null : flatIds[first];
  })();

  const focusIndex = (index: number) => {
    if (index === -1) {
      return;
    }
    const id = flatIds[index];
    setActiveId(id);
    optionRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number, item: T) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusIndex(findNextEnabledIndex(disabled, index, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusIndex(findNextEnabledIndex(disabled, index, -1));
        break;
      case 'Home':
        event.preventDefault();
        focusIndex(findEdgeEnabledIndex(disabled, 'first'));
        break;
      case 'End':
        event.preventDefault();
        focusIndex(findEdgeEnabledIndex(disabled, 'last'));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!disabled[index]) {
          onSelect?.(item);
        }
        break;
    }
  };

  const filterControl = filters && filters.options.length > 0 && (
    <FilterControl filters={filters} wide={width >= WIDE_FILTERS_WIDTH} measuring={width === 0} />
  );

  const header =
    search || toolbar || filterControl ? (
      <Stack gap="xs">
        {(search || toolbar) && (
          <Group gap="xs" wrap="nowrap">
            {search && (
              <TextInput
                flex={1}
                miw={0}
                value={search.value}
                onChange={(event) => search.onChange(event.currentTarget.value)}
                placeholder={search.placeholder ?? 'Search'}
                aria-label={search.placeholder ?? 'Search'}
                data-autofocus={search.dataAutofocus || undefined}
                leftSection={<IconSearch size={16} />}
              />
            )}
            {toolbar && (
              <Group gap="xs" wrap="nowrap" ml={search ? undefined : 'auto'}>
                {toolbar}
              </Group>
            )}
          </Group>
        )}
        {filterControl}
      </Stack>
    ) : null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack gap={0} aria-busy="true">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <Group key={index} gap="sm" wrap="nowrap" px="sm" py="xs">
            <Skeleton circle height={28} />
            <Stack gap={6} flex={1}>
              <Skeleton height={10} width="55%" radius="sm" />
              <Skeleton height={8} width="85%" radius="sm" />
            </Stack>
          </Group>
        ))}
      </Stack>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="light" color="red" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else if (flat.length === 0) {
    const isSearching = !!search?.value.trim();
    body =
      !isSearching && items.length === 0 && empty ? (
        <EmptyState
          size="sm"
          py="lg"
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
        >
          {empty.action && <EmptyState.Actions>{empty.action}</EmptyState.Actions>}
        </EmptyState>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          {noResults}
        </Text>
      );
  } else {
    let flatIndex = 0;
    body = (
      <EntityListOptionContext.Provider value>
        <Stack gap={4} role="listbox" aria-label={ariaLabel}>
          {groups.map((group, groupIndex) => {
            const options = group.items.map((item) => {
              const index = flatIndex++;
              const id = flatIds[index];
              const selected = id === selectedId;
              return (
                <Box
                  key={id}
                  ref={(node: HTMLDivElement | null) => {
                    if (node) {
                      optionRefs.current.set(id, node);
                    } else {
                      optionRefs.current.delete(id);
                    }
                  }}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={disabled[index] || undefined}
                  tabIndex={id === tabbableId ? 0 : -1}
                  className={classes.option}
                  onFocus={(event: React.FocusEvent<HTMLDivElement>) => {
                    if (event.target === event.currentTarget) {
                      setActiveId(id);
                    }
                  }}
                  onClick={() => {
                    setActiveId(id);
                    if (!disabled[index]) {
                      onSelect?.(item);
                    }
                  }}
                  onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) =>
                    handleKeyDown(event, index, item)
                  }
                >
                  {renderItem(item, { selected })}
                </Box>
              );
            });

            if (!groupBy) {
              return <React.Fragment key="__ungrouped">{options}</React.Fragment>;
            }
            const labelId = `${baseId}-group-${groupIndex}`;
            return (
              <Stack key={group.key} gap={2} role="group" aria-labelledby={labelId}>
                <Text id={labelId} size="xs" fw={500} c="dimmed" px="sm" pt="xs">
                  {group.key}
                </Text>
                {options}
              </Stack>
            );
          })}
        </Stack>
      </EntityListOptionContext.Provider>
    );
  }

  return (
    <Stack ref={rootRef} gap="sm" className={cx(classes.root, className)} style={style}>
      {header}
      {body}
    </Stack>
  );
}

function FilterControl<T>({
  filters,
  wide,
  measuring,
}: {
  filters: EntityListFilters<T>;
  wide: boolean;
  measuring: boolean;
}) {
  const label = filters.label ?? 'Filter';
  const measuringProps = { className: classes.measured, 'data-measuring': measuring || undefined };

  if (wide && filters.options.length <= 4) {
    return (
      <SegmentedControl
        {...measuringProps}
        size="xs"
        aria-label={label}
        value={filters.value}
        onChange={filters.onChange}
        data={filters.options.map((option) => ({
          value: option.value,
          label:
            option.count === undefined ? (
              option.label
            ) : (
              <Group gap={6} wrap="nowrap" justify="center">
                <span>{option.label}</span>
                <Badge size="xs" variant="light" color="gray" circle={option.count < 10}>
                  {option.count}
                </Badge>
              </Group>
            ),
        }))}
      />
    );
  }

  return (
    <Select
      {...measuringProps}
      size="sm"
      aria-label={label}
      allowDeselect={false}
      value={filters.value}
      onChange={(value) => value !== null && filters.onChange(value)}
      data={filters.options.map((option) => ({
        value: option.value,
        label: option.count === undefined ? option.label : `${option.label} (${option.count})`,
      }))}
    />
  );
}

export const EntityList = memo(EntityListInner) as <T>(
  props: EntityListProps<T>
) => React.ReactElement;
