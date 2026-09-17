import React, { memo, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { IconExternalLink, IconForms } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import {
  buildElicitationContent,
  getElicitationDraft,
  getElicitationFields,
  getElicitationHost,
  validateElicitationField,
  type ElicitationContent,
  type ElicitationDraftValue,
  type ElicitationField,
  type ElicitationRequestedSchema,
} from './elicitation-schema';
import classes from './ElicitationForm.module.css';

export type ElicitationAction = 'accept' | 'decline' | 'cancel';

export interface ElicitationFormProps {
  /** Message from the server explaining what is requested */
  message: string;
  /** Flat object schema of the requested fields, used in `form` mode */
  requestedSchema?: ElicitationRequestedSchema;
  /** `form` collects values, `url` asks to open an external link, `form` by default */
  mode?: 'form' | 'url';
  /** Link opened in `url` mode, only `http` and `https` links are shown */
  url?: string;
  /** Name of the MCP server that sent the request, shown in the header */
  serverName?: string;
  /** Called with the collected values, `{}` in `url` mode after the link is opened */
  onAccept?: (content: ElicitationContent) => void;
  /** Called when the user explicitly refuses to answer */
  onDecline?: () => void;
  /** Called when the user dismisses the request, the cancel button is rendered only when set */
  onCancel?: () => void;
  /** Submit button label, `Submit` by default (`Open link` in `url` mode) */
  acceptLabel?: string;
  /** Decline button label, `Decline` by default */
  declineLabel?: string;
  /** Cancel button label, `Cancel` by default */
  cancelLabel?: string;
  /** Header title when `serverName` is not set, `Input requested` by default */
  title?: string;
  /** Disables all fields and actions */
  disabled?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DECISION_LABELS: Record<ElicitationAction, string> = {
  accept: 'Accepted',
  decline: 'Declined',
  cancel: 'Canceled',
};

const GRID_BREAKPOINTS = {
  xs: '360px',
  sm: '520px',
  md: '720px',
  lg: '900px',
  xl: '1200px',
};

function isCompactField(field: ElicitationField): boolean {
  if (field.kind === 'number') {
    return true;
  }
  if (field.kind === 'text') {
    return field.inputType !== 'text' || (field.schema.maxLength ?? Infinity) <= 120;
  }
  return field.kind === 'select' && field.options.length > 3;
}

const EMPTY_SCHEMA: ElicitationRequestedSchema = { type: 'object', properties: {} };

type FieldControlProps = {
  field: ElicitationField;
  value: ElicitationDraftValue | undefined;
  error?: string;
  disabled: boolean;
  onChange: (value: ElicitationDraftValue, validate?: boolean) => void;
  onBlur: () => void;
};

function FieldControl({ field, value, error, disabled, onChange, onBlur }: FieldControlProps) {
  const common = {
    label: field.label,
    description: field.description,
    error,
    disabled,
    withAsterisk: field.required,
  };

  switch (field.kind) {
    case 'text':
      return (
        <TextInput
          {...common}
          type={field.inputType}
          value={String(value ?? '')}
          maxLength={field.schema.maxLength}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={onBlur}
        />
      );
    case 'number':
      return (
        <NumberInput
          {...common}
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          min={field.schema.minimum}
          max={field.schema.maximum}
          allowDecimal={field.schema.type !== 'integer'}
          onChange={(next) => onChange(typeof next === 'bigint' ? Number(next) : next)}
          onBlur={onBlur}
        />
      );
    case 'boolean':
      return (
        <Switch
          label={field.label}
          description={field.description}
          disabled={disabled}
          checked={Boolean(value)}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      );
    case 'select':
      if (field.options.length <= 3) {
        return (
          <Radio.Group
            {...common}
            size="xs"
            value={typeof value === 'string' && value ? value : null}
            onChange={(next) => onChange(next, true)}
          >
            <Group gap="md" mt="xs">
              {field.options.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={disabled}
                />
              ))}
            </Group>
          </Radio.Group>
        );
      }
      return (
        <Select
          {...common}
          data={field.options}
          value={typeof value === 'string' && value ? value : null}
          onChange={(next) => onChange(next ?? '')}
          onBlur={onBlur}
          clearable={!field.required}
        />
      );
    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      if (field.options.length <= 6) {
        return (
          <Checkbox.Group
            {...common}
            size="xs"
            value={selected}
            onChange={(next) => onChange(next, true)}
          >
            <Stack gap="xs" mt="xs">
              {field.options.map((option) => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={disabled}
                />
              ))}
            </Stack>
          </Checkbox.Group>
        );
      }
      return (
        <MultiSelect
          {...common}
          data={field.options}
          value={selected}
          maxValues={field.schema.maxItems}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    }
  }
}

/** MCP elicitation request: a schema-driven form or a link the server asks the user to open */
export const ElicitationForm = memo(function ElicitationForm({
  message,
  requestedSchema = EMPTY_SCHEMA,
  mode = 'form',
  url,
  serverName,
  onAccept,
  onDecline,
  onCancel,
  acceptLabel,
  declineLabel = 'Decline',
  cancelLabel = 'Cancel',
  title = 'Input requested',
  disabled = false,
  className,
  style,
}: ElicitationFormProps) {
  const fields = useMemo(() => getElicitationFields(requestedSchema), [requestedSchema]);
  const [draft, setDraft] = useState(() => getElicitationDraft(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<ElicitationAction | null>(null);

  const isLocked = disabled || decision !== null;
  const host = mode === 'url' ? getElicitationHost(url) : null;

  const setFieldError = (field: ElicitationField, value: ElicitationDraftValue | undefined) => {
    const error = validateElicitationField(field, value);
    setErrors((prev) => {
      if ((prev[field.name] ?? null) === error) {
        return prev;
      }
      const next = { ...prev };
      if (error) {
        next[field.name] = error;
      } else {
        delete next[field.name];
      }
      return next;
    });
  };

  const handleChange = (
    field: ElicitationField,
    value: ElicitationDraftValue,
    validate = false
  ) => {
    setDraft((prev) => ({ ...prev, [field.name]: value }));
    if (validate || errors[field.name]) {
      setFieldError(field, value);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLocked || mode === 'url') {
      return;
    }
    const result = buildElicitationContent(fields, draft);
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) {
      return;
    }
    setDecision('accept');
    onAccept?.(result.content);
  };

  const handleOpenLink = () => {
    if (isLocked || !url) {
      return;
    }
    setDecision('accept');
    onAccept?.({});
  };

  const handleDecline = () => {
    if (isLocked) {
      return;
    }
    setDecision('decline');
    onDecline?.();
  };

  const handleCancel = () => {
    if (isLocked) {
      return;
    }
    setDecision('cancel');
    onCancel?.();
  };

  return (
    <Paper
      component="form"
      noValidate
      withBorder
      radius="var(--ae-tool-radius)"
      onSubmit={handleSubmit}
      className={cx(classes.root, className)}
      style={style}
      data-decision={decision ?? undefined}
    >
      <Group gap={6} wrap="nowrap" px="sm" py={6} className={classes.bar}>
        {mode === 'url' ? (
          <IconExternalLink size={14} className={classes.icon} />
        ) : (
          <IconForms size={14} className={classes.icon} />
        )}
        <Text size="xs" fw={500} truncate>
          {serverName ?? title}
        </Text>
      </Group>
      <Divider />

      <Stack gap="xs" p="sm">
        <Text size="sm" className={classes.message}>
          {message}
        </Text>
        {mode === 'url' && host && (
          <Text size="xs" ff="monospace" c="dimmed">
            {host}
          </Text>
        )}
        {mode === 'form' && fields.length > 0 && (
          <Grid type="container" breakpoints={GRID_BREAKPOINTS} gap="sm" mt={4}>
            {fields.map((field) => (
              <Grid.Col key={field.name} span={isCompactField(field) ? { base: 12, sm: 6 } : 12}>
                <FieldControl
                  field={field}
                  value={draft[field.name]}
                  error={errors[field.name]}
                  disabled={isLocked}
                  onChange={(value, validate) => handleChange(field, value, validate)}
                  onBlur={() => setFieldError(field, draft[field.name])}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      <Divider />
      <Group
        justify="space-between"
        wrap="nowrap"
        gap="xs"
        pl="sm"
        pr={8}
        py={4}
        className={classes.bar}
      >
        <Text size="xs" c="dimmed">
          {decision ? DECISION_LABELS[decision] : null}
        </Text>
        <Group gap={4} wrap="nowrap">
          {onCancel && (
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={handleCancel}
              disabled={isLocked}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            onClick={handleDecline}
            disabled={isLocked}
          >
            {declineLabel}
          </Button>
          {mode === 'url' ? (
            host &&
            url && (
              <Button
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                size="compact-xs"
                disabled={isLocked}
                onClick={(event: React.MouseEvent) => {
                  if (isLocked) {
                    event.preventDefault();
                    return;
                  }
                  handleOpenLink();
                }}
              >
                {acceptLabel ?? 'Open link'}
              </Button>
            )
          ) : (
            <Button type="submit" size="compact-xs" disabled={isLocked}>
              {acceptLabel ?? 'Submit'}
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
});

ElicitationForm.displayName = 'ElicitationForm';
