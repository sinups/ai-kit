import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Fieldset,
  Group,
  MultiSelect,
  Stack,
  Text,
  Title,
  type MantineColor,
} from '@mantine/core';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { ConfirmDialog } from '../../primitives/ConfirmDialog/ConfirmDialog';
import { getErrorMessage } from '../../utils/error-message';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../../utils/field-order';
import type { ModelOption } from '../../types';
import {
  AgentIdentityFields,
  AgentModelFields,
  AgentPromptField,
  DEFAULT_AGENT_FIELD_LABELS,
  type AgentFieldLabels,
} from '../AgentFields/AgentFields';
import { ToolSelector, type ToolSelectorLabels } from '../ToolSelector/ToolSelector';
import type { AgentDefinition, AgentDraft, AgentDraftErrors, ToolCatalogItem } from '../types';
import {
  createAgentDraft,
  isAgentDraftEqual,
  validateAgentDraft,
  type AgentValidationMessages,
} from '../validate-agent';

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack component="section" gap="sm" aria-label={title}>
      <Stack gap={2}>
        <Title order={3}>{title}</Title>
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
      {children}
    </Stack>
  );
}

export interface AgentEditorLabels extends AgentFieldLabels {
  identity: string;
  instructions: string;
  tools: string;
  toolsDescription: string;
  disallowedTools: string;
  disallowedToolsDescription: string;
  modelAndAppearance: string;
  save: string;
  create: string;
  cancel: string;
  unsaved: string;
  readOnly: string;
  invalid: string;
  error: string;
  discardTitle: string;
  discardMessage: string;
  keepEditing: string;
  discard: string;
  /** Labels of the tool selector */
  toolSelector: Partial<ToolSelectorLabels>;
  /** Validation messages of the fields */
  validation: Partial<AgentValidationMessages>;
}

export const DEFAULT_AGENT_EDITOR_LABELS: AgentEditorLabels = {
  ...DEFAULT_AGENT_FIELD_LABELS,
  identity: 'Identity',
  instructions: 'Instructions',
  tools: 'Tools',
  toolsDescription: 'Give the agent only what the task needs',
  disallowedTools: 'Disallowed tools',
  disallowedToolsDescription: 'Removed from the allowed tools, useful together with All tools',
  modelAndAppearance: 'Model and appearance',
  save: 'Save changes',
  create: 'Create agent',
  cancel: 'Cancel',
  unsaved: 'Unsaved changes',
  readOnly: 'This agent is read-only. Duplicate it to make changes.',
  invalid: 'Fix the highlighted fields',
  error: 'Could not save the agent',
  discardTitle: 'Discard changes?',
  discardMessage: 'Your edits to this agent will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard',
  toolSelector: {},
  validation: {},
};

export interface AgentEditorProps {
  /** Agent being edited, a new agent is created when omitted */
  agent?: AgentDefinition;
  /** Values the form starts from, for example a duplicated agent; applied on top of `agent` they count as unsaved changes */
  initialDraft?: Partial<AgentDraft>;
  /** Tools that can be picked */
  catalog: ToolCatalogItem[];
  /** Models offered in addition to `inherit` */
  models?: ModelOption[];
  /** Skills offered in the skills picker */
  skills?: string[];
  /** Colors offered in the color picker */
  colors?: MantineColor[];
  /** Names of other agents, used to check that the name is unique */
  existingNames?: string[];
  /** Allows renaming an existing agent, `false` by default */
  allowRename?: boolean;
  /** Called with a valid draft; a rejected promise is shown in an alert */
  onSave: (draft: AgentDraft) => void | Promise<void>;
  /** Called by Cancel, after a confirmation when there are unsaved changes */
  onCancel?: () => void;
  /** Called whenever the dirty state changes */
  onDirtyChange?: (dirty: boolean) => void;
  /** Overrides of the default English labels */
  labels?: Partial<AgentEditorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Full agent form: identity, system prompt, tools, model and appearance, with validation and unsaved-changes protection */
export const AgentEditor = memo(function AgentEditor({
  agent,
  initialDraft,
  catalog,
  models = [],
  skills,
  colors,
  existingNames = [],
  allowRename = false,
  onSave,
  onCancel,
  onDirtyChange,
  labels: labelsProp,
  className,
  style,
}: AgentEditorProps) {
  const labels = { ...DEFAULT_AGENT_EDITOR_LABELS, ...labelsProp };
  const isNew = !agent;
  const readOnly = !!agent?.readOnly;

  const [baseline, setBaseline] = useState<AgentDraft>(() =>
    createAgentDraft(agent ?? initialDraft)
  );
  const [draft, setDraft] = useState<AgentDraft>(() =>
    createAgentDraft({ ...agent, ...initialDraft })
  );
  const [submitted, setSubmitted] = useState(false);
  const [nameEdited, setNameEdited] = useState(!isNew || !!baseline.name);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty = !isAgentDraftEqual(draft, baseline);
  const reportedDirty = useRef(false);
  useEffect(() => {
    if (reportedDirty.current !== dirty) {
      reportedDirty.current = dirty;
      onDirtyChange?.(dirty);
    }
  }, [dirty, onDirtyChange]);

  const otherNames = useMemo(
    () => existingNames.filter((name) => name !== agent?.name),
    [existingNames, agent?.name]
  );
  const allErrors = useMemo(
    () => validateAgentDraft(draft, { existingNames: otherNames, messages: labels.validation }),
    [draft, otherNames, labels.validation]
  );
  const errors: AgentDraftErrors = submitted ? allErrors : {};
  const hasErrors = Object.keys(allErrors).length > 0;

  const patch = useCallback((next: Partial<AgentDraft>) => {
    setFailure(null);
    setDraft((prev) => ({ ...prev, ...next }));
  }, []);
  const markNameEdited = useCallback(() => setNameEdited(true), []);

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors || saving || readOnly) {
      return;
    }
    setSaving(true);
    setFailure(null);
    try {
      await onSave(draft);
      setBaseline(draft);
    } catch (error) {
      setFailure(getErrorMessage(error, labels.error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty && !readOnly) {
      setConfirmOpen(true);
    } else {
      onCancel?.();
    }
  };

  const fieldProps = { draft, errors, onChange: patch, labels };
  const disallowedData = [
    ...new Set([...catalog.map((tool) => tool.name), ...draft.disallowedTools]),
  ];

  return (
    <Stack gap="md" p="md" className={className} style={style} data-dirty={dirty || undefined}>
      {readOnly && (
        <Alert color="gray" icon={<IconLock size={16} />}>
          {labels.readOnly}
        </Alert>
      )}

      <Fieldset variant="unstyled" disabled={readOnly || saving} p={0} m={0}>
        <Stack gap="xl">
          <EditorSection title={labels.identity}>
            <AgentIdentityFields
              {...fieldProps}
              autoName={!nameEdited}
              onNameEdited={markNameEdited}
              nameDisabled={!isNew && !allowRename}
            />
          </EditorSection>

          <EditorSection title={labels.instructions}>
            <AgentPromptField {...fieldProps} />
          </EditorSection>

          <EditorSection title={labels.tools} description={labels.toolsDescription}>
            <Stack gap="md">
              <ToolSelector
                catalog={catalog}
                value={draft.tools}
                onChange={(tools) => patch({ tools })}
                error={errors.tools}
                disabled={readOnly}
                labels={labels.toolSelector}
              />
              <MultiSelect
                label={labels.disallowedTools}
                description={labels.disallowedToolsDescription}
                inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
                searchable
                clearable
                data={disallowedData}
                value={draft.disallowedTools}
                error={errors.disallowedTools}
                onChange={(disallowedTools) => patch({ disallowedTools })}
              />
            </Stack>
          </EditorSection>

          <EditorSection title={labels.modelAndAppearance}>
            <AgentModelFields {...fieldProps} models={models} skills={skills} colors={colors} />
          </EditorSection>
        </Stack>
      </Fieldset>

      {submitted && hasErrors && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {labels.invalid}
        </Alert>
      )}
      {failure && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {failure}
        </Alert>
      )}

      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed" aria-live="polite">
          {dirty ? labels.unsaved : ''}
        </Text>
        <Group gap="xs" wrap="nowrap">
          {onCancel && (
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              {labels.cancel}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={readOnly || (!isNew && !dirty)}
          >
            {isNew ? labels.create : labels.save}
          </Button>
        </Group>
      </Group>

      <ConfirmDialog
        opened={confirmOpen}
        title={labels.discardTitle}
        message={labels.discardMessage}
        labels={{ confirm: labels.discard, cancel: labels.keepEditing }}
        danger
        onConfirm={() => onCancel?.()}
        onClose={() => setConfirmOpen(false)}
      />
    </Stack>
  );
});

AgentEditor.displayName = 'AgentEditor';
