import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  CheckIcon,
  Combobox,
  Group,
  Pill,
  PillsInput,
  ScrollArea,
  Stack,
  Text,
  useCombobox,
} from '@mantine/core';
import { useFuzzySearch } from '../primitives/CommandPalette/use-fuzzy-search';
import type { FuzzyKey } from '../primitives/CommandPalette/fuzzy';
import type { Skill } from './types';
import classes from './Skills.module.css';

export interface SkillPickerLabels {
  nothingFound: string;
  disabled: string;
}

export interface SkillPickerProps {
  /** Skills that can be picked */
  skills: Skill[];
  /** Ids of picked skills */
  value: string[];
  /** Called with the new ids */
  onChange: (value: string[]) => void;
  /** Input label */
  label?: React.ReactNode;
  /** Text under the label */
  description?: React.ReactNode;
  /** Validation message */
  error?: React.ReactNode;
  /** Placeholder shown while nothing is picked, `Pick skills` by default */
  placeholder?: string;
  /** Disables the input */
  disabled?: boolean;
  /** Maximum height of the options dropdown in px, `240` by default */
  maxDropdownHeight?: number;
  /** Overrides of the default English labels */
  labels?: Partial<SkillPickerLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const PICKER_SEARCH_KEYS: FuzzyKey<Skill>[] = ['name', 'tags'];

const DEFAULT_LABELS: SkillPickerLabels = {
  nothingFound: 'No skills found',
  disabled: 'Disabled',
};

export const SkillPicker = memo(function SkillPicker({
  skills,
  value,
  onChange,
  label,
  description,
  error,
  placeholder = 'Pick skills',
  disabled = false,
  maxDropdownHeight = 240,
  labels,
  className,
  style,
}: SkillPickerProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const byId = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const results = useFuzzySearch({ items: skills, keys: PICKER_SEARCH_KEYS, query: search });

  const comboboxRef = useRef(combobox);
  comboboxRef.current = combobox;

  useEffect(() => {
    if (search.trim()) {
      comboboxRef.current.selectFirstOption();
    }
  }, [search]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  const pills = value.map((id) => {
    const name = byId.get(id)?.name ?? id;
    return (
      <Pill key={id} withRemoveButton={!disabled} disabled={disabled} onRemove={() => toggle(id)}>
        {name}
      </Pill>
    );
  });

  const options = results.map(({ item: skill }) => {
    const selected = value.includes(skill.id);
    return (
      <Combobox.Option value={skill.id} key={skill.id} active={selected} aria-selected={selected}>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <CheckIcon
            size={12}
            className={classes.pickerCheck}
            data-visible={selected || undefined}
          />
          <Stack gap={0} miw={0} flex={1}>
            <Group gap={6} wrap="nowrap">
              <Text size="sm" fw={500} truncate="end">
                {skill.name}
              </Text>
              {!skill.enabled && (
                <Badge size="xs" variant="light" color="gray" className={classes.tag}>
                  {text.disabled}
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {skill.description}
            </Text>
          </Stack>
        </Group>
      </Combobox.Option>
    );
  });

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(id) => {
        toggle(id);
        combobox.updateSelectedOptionIndex('active');
      }}
      withinPortal
    >
      <Combobox.DropdownTarget>
        <PillsInput
          label={label}
          description={description}
          error={error}
          disabled={disabled}
          className={className}
          style={style}
          onClick={() => combobox.openDropdown()}
        >
          <Pill.Group>
            {pills}
            <Combobox.EventsTarget>
              <PillsInput.Field
                value={search}
                placeholder={value.length === 0 ? placeholder : undefined}
                disabled={disabled}
                aria-label={typeof label === 'string' ? label : placeholder}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
                    event.preventDefault();
                    toggle(value[value.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={maxDropdownHeight} type="scroll">
            {options.length > 0 ? options : <Combobox.Empty>{text.nothingFound}</Combobox.Empty>}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
});
