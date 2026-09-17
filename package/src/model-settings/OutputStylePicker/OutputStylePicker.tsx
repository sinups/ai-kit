import React, { memo } from 'react';
import { Group, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import type { OutputStyle } from '../types';
import classes from './OutputStylePicker.module.css';

export interface OutputStylePickerProps {
  /** Styles to choose from */
  styles: OutputStyle[];
  /** Id of the selected style */
  value: string | null;
  /** Called with the id of the picked style */
  onChange: (id: string) => void;
  /** Group label */
  label?: React.ReactNode;
  /** Group description under the label */
  description?: React.ReactNode;
  /** Id of an element that names the group when `label` is not set, for example a section heading */
  labelledBy?: string;
  /** Hides the examples to keep the cards short */
  withoutExamples?: boolean;
  /** Disables every card */
  disabled?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Answer style picker: radio cards with name, description and a sample, one to three columns by component width */
export const OutputStylePicker = memo(function OutputStylePicker({
  styles,
  value,
  onChange,
  label,
  description,
  labelledBy,
  withoutExamples = false,
  disabled = false,
  className,
  style,
}: OutputStylePickerProps) {
  return (
    <Radio.Group
      value={value}
      onChange={onChange}
      label={label}
      description={description}
      labelProps={!label && labelledBy ? { id: labelledBy } : undefined}
      disabled={disabled}
      className={className}
      style={style}
    >
      <SimpleGrid
        type="container"
        cols={{ base: 1, '440px': 2, '760px': 3 }}
        spacing="sm"
        mt={label || description ? 'xs' : 0}
      >
        {styles.map((item) => (
          <Radio.Card
            key={item.id}
            value={item.id}
            radius="md"
            disabled={disabled}
            className={classes.card}
            data-checked={item.id === value || undefined}
          >
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Radio.Indicator mt={2} />
              <Stack gap={4} miw={0}>
                <Text size="sm" fw={500}>
                  {item.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
                {item.example && !withoutExamples && (
                  <Text size="xs" fs="italic" className={classes.example}>
                    {item.example}
                  </Text>
                )}
              </Stack>
            </Group>
          </Radio.Card>
        ))}
      </SimpleGrid>
    </Radio.Group>
  );
});

OutputStylePicker.displayName = 'OutputStylePicker';
