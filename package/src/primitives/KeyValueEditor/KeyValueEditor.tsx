import React, { memo, useEffect, useId, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  PasswordInput,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconLock, IconLockOpen, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  createKeyValuePair,
  envKeyValidator,
  expandPastedPairs,
  isKeyValueText,
  validateKeyValuePairs,
  type KeyValidator,
  type KeyValuePair,
} from './key-value';
import classes from './KeyValueEditor.module.css';

export type KeyValueEditorLabels = {
  /** Accessible label of the remove button, `Remove` by default */
  remove: string;
  /** Accessible label of the button that masks a value, `Mark as secret` by default */
  markSecret: string;
  /** Accessible label of the button that unmasks a value, `Mark as not secret` by default */
  unmarkSecret: string;
  /** Error for a row that has a value but no key, `Key is required` by default */
  keyRequired: string;
  /** Error for a key that is already used above, `Duplicate key` by default */
  duplicateKey: string;
};

export interface KeyValueEditorProps {
  /** Rows in display order */
  value: KeyValuePair[];
  /** Called with the full list of rows after every edit */
  onChange: (pairs: KeyValuePair[]) => void;
  /** Key input placeholder and accessible label prefix, `Key` by default */
  keyPlaceholder?: string;
  /** Value input placeholder and accessible label prefix, `Value` by default */
  valuePlaceholder?: string;
  /** Add button label, `Add` by default */
  addLabel?: string;
  /** Shows a button on every row that masks or unmasks its value */
  allowSecrets?: boolean;
  /** Returns an error message for an invalid key; empty and duplicate keys are always reported, `envKeyValidator` by default */
  validateKey?: KeyValidator;
  /** Disables every input and button */
  disabled?: boolean;
  /** Maximum number of rows, the add button is disabled once reached */
  maxRows?: number;
  /** Accessible labels and built-in error messages */
  labels?: Partial<KeyValueEditorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_KEY_VALUE_EDITOR_LABELS: KeyValueEditorLabels = {
  remove: 'Remove',
  markSecret: 'Mark as secret',
  unmarkSecret: 'Mark as not secret',
  keyRequired: 'Key is required',
  duplicateKey: 'Duplicate key',
};

const GRID_BREAKPOINTS = {
  xs: '360px',
  sm: '440px',
  md: '720px',
  lg: '900px',
  xl: '1200px',
};

/** Editable key/value pairs such as environment variables or HTTP headers, with secret masking, validation and `.env` paste */
export const KeyValueEditor = memo(function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add',
  allowSecrets = false,
  validateKey = envKeyValidator,
  disabled = false,
  maxRows,
  labels: labelsOverride,
  className,
  style,
}: KeyValueEditorProps) {
  const baseId = useId();
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const labels = { ...DEFAULT_KEY_VALUE_EDITOR_LABELS, ...labelsOverride };
  const errors = validateKeyValuePairs(value, validateKey, labels);
  const canAdd = !disabled && (maxRows === undefined || value.length < maxRows);

  useEffect(() => {
    if (focusRowId) {
      document.getElementById(`${baseId}-${focusRowId}-key`)?.focus();
      setFocusRowId(null);
    }
  }, [baseId, focusRowId]);

  const updateRow = (id: string, patch: Partial<KeyValuePair>) => {
    onChange(value.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));
  };

  const addRow = () => {
    const pair = createKeyValuePair();
    onChange([...value, pair]);
    setFocusRowId(pair.id);
  };

  const handleKeyPaste = (id: string, event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!isKeyValueText(text)) {
      return;
    }
    event.preventDefault();
    onChange(expandPastedPairs(value, id, text, maxRows));
  };

  return (
    <Stack gap="sm" className={className} style={style}>
      {value.map((pair, index) => {
        const valueProps = {
          size: 'sm' as const,
          'aria-label': `${valuePlaceholder} ${index + 1}`,
          placeholder: valuePlaceholder,
          value: pair.value,
          disabled,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            updateRow(pair.id, { value: event.currentTarget.value }),
        };
        const secretLabel = pair.secret ? labels.unmarkSecret : labels.markSecret;

        return (
          <Group key={pair.id} gap="xs" wrap="nowrap" align="flex-start">
            <Box className={classes.fields}>
              <Grid
                type="container"
                breakpoints={GRID_BREAKPOINTS}
                gap="xs"
                rowGap="var(--ae-space-2xs)"
              >
                <Grid.Col span={{ base: 12, sm: 5 }}>
                  <TextInput
                    id={`${baseId}-${pair.id}-key`}
                    size="sm"
                    aria-label={`${keyPlaceholder} ${index + 1}`}
                    placeholder={keyPlaceholder}
                    value={pair.key}
                    error={errors[pair.id]}
                    disabled={disabled}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => updateRow(pair.id, { key: event.currentTarget.value })}
                    onPaste={(event) => handleKeyPaste(pair.id, event)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 7 }}>
                  {pair.secret ? (
                    <PasswordInput {...valueProps} autoComplete="new-password" />
                  ) : (
                    <TextInput {...valueProps} autoComplete="off" spellCheck={false} />
                  )}
                </Grid.Col>
              </Grid>
            </Box>
            <Group gap={4} wrap="nowrap">
              {allowSecrets && (
                <Tooltip label={secretLabel}>
                  <ActionIcon
                    size="input-sm"
                    variant={pair.secret ? 'light' : 'subtle'}
                    color="gray"
                    aria-label={secretLabel}
                    aria-pressed={Boolean(pair.secret)}
                    disabled={disabled}
                    onClick={() => updateRow(pair.id, { secret: !pair.secret })}
                  >
                    {pair.secret ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label={labels.remove}>
                <ActionIcon
                  size="input-sm"
                  variant="subtle"
                  color="gray"
                  aria-label={labels.remove}
                  disabled={disabled}
                  onClick={() => onChange(value.filter((item) => item.id !== pair.id))}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        );
      })}
      <Group>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          disabled={!canAdd}
          onClick={addRow}
        >
          {addLabel}
        </Button>
      </Group>
    </Stack>
  );
});

KeyValueEditor.displayName = 'KeyValueEditor';
