import React, { memo, useMemo, useState } from 'react';
import {
  Box,
  CloseButton,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  type ComboboxData,
  type ComboboxItem,
  type ComboboxParsedItem,
  type OptionsFilter,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { filterSettingsNav, groupSettingsNav, type SettingsNavItem } from './settings-nav';
import classes from './SettingsLayout.module.css';

export interface SettingsLayoutProps {
  /** Sections listed in the navigation, in display order */
  sections: SettingsNavItem[];
  /** Id of the section whose content is rendered in `children` */
  activeId: string;
  /** Called with the id of the section the user picked */
  onActiveChange: (id: string) => void;
  /** Content of the active section, usually one or more `SettingsSection` */
  children?: React.ReactNode;
  /** Heading above the navigation */
  title?: React.ReactNode;
  /** Adds a search field that filters the navigation by label and description */
  searchable?: boolean;
  /** Search field placeholder, `Search settings` by default */
  searchPlaceholder?: string;
  /** Text shown when the search matches no section, `No matching settings` by default */
  nothingFoundLabel?: string;
  /** Accessible name of the navigation and the narrow section picker, `Settings sections` by default */
  navLabel?: string;
  /** Navigation column width in px when wide, `240` by default */
  navWidth?: number;
  /** Renders the content without its own scroll area and padding, stretched to the full height, for panels that scroll themselves such as master-detail lists; `SettingsNavItem.fill` overrides it per section */
  fillContent?: boolean;
  /** Component width in px from which navigation and content sit side by side, `720` by default */
  breakpoint?: number;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function toSelectData(sections: SettingsNavItem[]): ComboboxData<string> {
  return groupSettingsNav(sections).flatMap(({ group, items }): ComboboxParsedItem<string>[] => {
    const options: ComboboxItem<string>[] = items.map((item) => ({
      value: item.id,
      label: item.label,
      disabled: item.disabled,
    }));
    return group === undefined ? options : [{ group, items: options }];
  });
}

/** Settings screen: grouped section navigation beside the content when wide, a section picker above it when narrow */
export const SettingsLayout = memo(function SettingsLayout({
  sections,
  activeId,
  onActiveChange,
  children,
  title,
  searchable = false,
  searchPlaceholder = 'Search settings',
  nothingFoundLabel = 'No matching settings',
  navLabel = 'Settings sections',
  navWidth = 240,
  breakpoint = 720,
  fillContent = false,
  className,
  style,
}: SettingsLayoutProps) {
  const { ref, width } = useElementSize();
  const [query, setQuery] = useState('');
  const isWide = width >= breakpoint;

  const byId = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
  const groups = useMemo(
    () => groupSettingsNav(filterSettingsNav(sections, query)),
    [sections, query]
  );
  const selectData = useMemo(() => toSelectData(sections), [sections]);
  const active = byId.get(activeId);

  const filterOptions: OptionsFilter<string> = ({ options, search }) => {
    const visible = new Set(filterSettingsNav(sections, search).map((section) => section.id));
    return options.flatMap((option): ComboboxParsedItem<string>[] => {
      if ('group' in option) {
        const items = option.items.filter((item) => visible.has(item.value));
        return items.length ? [{ ...option, items }] : [];
      }
      return visible.has(option.value) ? [option] : [];
    });
  };

  const renderOption = ({ option }: { option: ComboboxItem<string> }) => {
    const section = byId.get(option.value);
    return (
      <Group gap="xs" wrap="nowrap" flex={1}>
        {section?.icon}
        <Stack gap={0} flex={1}>
          <Text size="sm">{option.label}</Text>
          {section?.description && (
            <Text size="xs" c="dimmed">
              {section.description}
            </Text>
          )}
        </Stack>
        {section?.badge}
      </Group>
    );
  };

  const heading = title ? (
    <Group className={classes.header} wrap="nowrap">
      <Title order={2} size="h4" className={classes.heading}>
        {title}
      </Title>
    </Group>
  ) : null;

  const fill = active?.fill ?? fillContent;
  const content = fill ? (
    <Box className={classes.fillContent} data-fill>
      {children}
    </Box>
  ) : (
    <ScrollArea className={classes.content} type="auto">
      <Box className={classes.contentInner}>{children}</Box>
    </ScrollArea>
  );

  return (
    <Box
      ref={ref}
      className={cx(classes.root, className)}
      style={style}
      data-layout={isWide ? 'wide' : 'narrow'}
      data-measuring={width === 0 || undefined}
    >
      {!isWide && (
        <Stack gap={0} className={classes.narrowTop} data-with-heading={!!heading || undefined}>
          {heading}
          <Select
            aria-label={navLabel}
            data={selectData}
            value={activeId}
            allowDeselect={false}
            searchable={searchable}
            nothingFoundMessage={nothingFoundLabel}
            leftSection={active?.icon}
            renderOption={renderOption}
            filter={filterOptions}
            onChange={(id) => {
              if (id) {
                onActiveChange(id);
              }
            }}
          />
        </Stack>
      )}
      {isWide && (
        <Stack gap={0} w={navWidth} className={classes.nav}>
          {(heading || searchable) && (
            <Stack gap={0} className={classes.navTop} data-with-heading={!!heading || undefined}>
              {heading}
              {searchable && (
                <TextInput
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  leftSection={<IconSearch size={16} />}
                  rightSection={
                    query ? <CloseButton size="sm" onClick={() => setQuery('')} /> : undefined
                  }
                  onChange={(event) => setQuery(event.currentTarget.value)}
                />
              )}
            </Stack>
          )}
          <ScrollArea className={classes.content} type="auto">
            <Box
              component="nav"
              aria-label={navLabel}
              className={classes.navList}
              data-after-top={!!heading || searchable || undefined}
            >
              {groups.length === 0 && (
                <Text size="sm" c="dimmed" className={classes.navEmpty}>
                  {nothingFoundLabel}
                </Text>
              )}
              {groups.map(({ group, items }) => (
                <Stack key={group ?? ''} gap={2}>
                  {group !== undefined && (
                    <Text size="xs" fw={500} c="dimmed" className={classes.navGroupLabel}>
                      {group}
                    </Text>
                  )}
                  {items.map((item) => (
                    <NavLink
                      key={item.id}
                      component="button"
                      type="button"
                      label={item.label}
                      description={item.description}
                      leftSection={item.icon}
                      rightSection={item.badge}
                      active={item.id === activeId}
                      aria-current={item.id === activeId ? 'page' : undefined}
                      disabled={item.disabled}
                      aria-disabled={item.disabled || undefined}
                      className={classes.navLink}
                      onClick={() => {
                        if (!item.disabled) {
                          onActiveChange(item.id);
                        }
                      }}
                    />
                  ))}
                </Stack>
              ))}
            </Box>
          </ScrollArea>
        </Stack>
      )}
      {isWide && <Divider orientation="vertical" />}
      {content}
    </Box>
  );
});
