import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  MultiSelect,
  Paper,
  Stack,
  Tabs,
  TagsInput,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Markdown } from '../Markdown/Markdown';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { cx } from '../utils/cx';
import { getErrorMessage } from '../utils/error-message';
import {
  DEFAULT_SKILL_VALIDATION_MESSAGES,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  isSkillDraftDirty,
  normalizeSkillDraft,
  skillToDraft,
  validateSkillDraft,
  type SkillDraftErrors,
  type SkillValidationMessages,
} from './skill-utils';
import type { Skill, SkillDraft } from './types';
import classes from './Skills.module.css';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../utils/field-order';

export interface SkillEditorLabels extends SkillValidationMessages {
  createTitle: string;
  editTitle: string;
  name: string;
  nameDescription: string;
  description: string;
  descriptionHint: string;
  tags: string;
  tagsPlaceholder: string;
  allowedTools: string;
  allowedToolsDescription: string;
  allowedToolsPlaceholder: string;
  instructions: string;
  write: string;
  preview: string;
  contentPlaceholder: string;
  emptyPreview: string;
  save: string;
  create: string;
  cancel: string;
  unsaved: string;
  discardTitle: string;
  discardMessage: string;
  keepEditing: string;
  discard: string;
  saveError: string;
}

export interface SkillEditorProps {
  /** Skill to edit, a new skill is created when omitted */
  skill?: Skill | null;
  /** Initial values of a new skill, for example a duplicate */
  initialDraft?: Partial<SkillDraft>;
  /** Tool names offered in the allowed tools select */
  availableTools?: string[];
  /** Names of other skills, used to check that the name is unique */
  existingNames?: string[];
  /** Saves the draft, the form stays open and shows the rejection message when the promise rejects */
  onSave: (draft: SkillDraft) => Promise<void> | void;
  /** Leaves the editor, asks for confirmation first when there are unsaved changes */
  onCancel?: () => void;
  /** Called when the form gains or loses unsaved changes, lets the host guard its own navigation */
  onDirtyChange?: (dirty: boolean) => void;
  /** Overrides of the default English labels and validation messages */
  labels?: Partial<SkillEditorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_SKILL_EDITOR_LABELS: SkillEditorLabels = {
  ...DEFAULT_SKILL_VALIDATION_MESSAGES,
  createTitle: 'New skill',
  editTitle: 'Edit skill',
  name: 'Name',
  nameDescription: 'Lowercase letters, digits and hyphens, for example pdf-forms',
  description: 'Description',
  descriptionHint: 'What the skill does and when the agent should use it',
  tags: 'Tags',
  tagsPlaceholder: 'Add a tag and press Enter',
  allowedTools: 'Allowed tools',
  allowedToolsDescription: 'Tools the skill may use without asking',
  allowedToolsPlaceholder: 'Pick tools',
  instructions: 'Instructions',
  write: 'Write',
  preview: 'Preview',
  contentPlaceholder: '# Skill name\n\nStep-by-step instructions in Markdown',
  emptyPreview: 'Nothing to preview yet.',
  save: 'Save',
  create: 'Create skill',
  cancel: 'Cancel',
  unsaved: 'Unsaved changes',
  discardTitle: 'Discard changes?',
  discardMessage: 'Your edits to this skill will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard',
  saveError: 'Could not save the skill',
};

export const SkillEditor = memo(function SkillEditor({
  skill,
  initialDraft,
  availableTools = [],
  existingNames = [],
  onSave,
  onCancel,
  onDirtyChange,
  labels,
  className,
  style,
}: SkillEditorProps) {
  const text = { ...DEFAULT_SKILL_EDITOR_LABELS, ...labels };
  const [baseline, setBaseline] = useState<SkillDraft>(() => ({
    ...skillToDraft(skill),
    ...initialDraft,
  }));
  const [draft, setDraft] = useState<SkillDraft>(baseline);
  const [errors, setErrors] = useState<SkillDraftErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState<string | null>('write');

  const otherNames = useMemo(
    () => existingNames.filter((name) => name !== skill?.name),
    [existingNames, skill?.name]
  );
  const dirty = isSkillDraftDirty(draft, baseline);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const toolOptions = useMemo(
    () => [...new Set([...availableTools, ...draft.allowedTools])],
    [availableTools, draft.allowedTools]
  );

  const update = <K extends keyof SkillDraft>(key: K, value: SkillDraft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (submitted) {
      setErrors(validateSkillDraft(next, otherNames, text));
    } else if (key === 'name' && errors.name) {
      setErrors((current) => ({
        ...current,
        name: validateSkillDraft(next, otherNames, text).name,
      }));
    }
  };

  const save = async () => {
    const normalized = normalizeSkillDraft(draft);
    const nextErrors = validateSkillDraft(normalized, otherNames, text);
    setSubmitted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(normalized);
      setDraft(normalized);
      setBaseline(normalized);
    } catch (reason) {
      setSaveError(getErrorMessage(reason, text.saveError));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (dirty) {
      setConfirmOpen(true);
    } else {
      onCancel?.();
    }
  };

  return (
    <form
      noValidate
      className={cx(classes.content, className)}
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Stack gap="md" p="md">
        <Group justify="space-between" gap="xs">
          <Text component="h3" size="sm" fw={500}>
            {skill ? text.editTitle : text.createTitle}
          </Text>
          {dirty && (
            <Text size="xs" c="dimmed">
              {text.unsaved}
            </Text>
          )}
        </Group>

        <TextInput
          label={text.name}
          description={text.nameDescription}
          inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
          withAsterisk
          value={draft.name}
          maxLength={SKILL_NAME_MAX_LENGTH}
          error={errors.name}
          disabled={saving}
          onChange={(event) => update('name', event.currentTarget.value)}
          onBlur={() =>
            setErrors((current) => ({
              ...current,
              name: validateSkillDraft(draft, otherNames, text).name,
            }))
          }
        />
        <Textarea
          label={text.description}
          description={text.descriptionHint}
          inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
          withAsterisk
          autosize
          minRows={2}
          maxRows={5}
          value={draft.description}
          maxLength={SKILL_DESCRIPTION_MAX_LENGTH}
          error={errors.description}
          disabled={saving}
          onChange={(event) => update('description', event.currentTarget.value)}
        />
        <TagsInput
          label={text.tags}
          placeholder={text.tagsPlaceholder}
          value={draft.tags}
          disabled={saving}
          clearable
          onChange={(value) => update('tags', value)}
        />
        <MultiSelect
          label={text.allowedTools}
          description={text.allowedToolsDescription}
          inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
          placeholder={draft.allowedTools.length === 0 ? text.allowedToolsPlaceholder : undefined}
          data={toolOptions}
          value={draft.allowedTools}
          searchable
          clearable
          hidePickedOptions
          disabled={saving}
          onChange={(value) => update('allowedTools', value)}
        />

        <Stack gap={4}>
          <Text size="xs" fw={500}>
            {text.instructions}
          </Text>
          <Tabs value={tab} onChange={setTab} keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="write">{text.write}</Tabs.Tab>
              <Tabs.Tab value="preview">{text.preview}</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="write" pt="xs">
              <Textarea
                aria-label={text.instructions}
                autosize
                minRows={8}
                maxRows={24}
                placeholder={text.contentPlaceholder}
                value={draft.content}
                disabled={saving}
                classNames={{ input: classes.editorInput }}
                onChange={(event) => update('content', event.currentTarget.value)}
              />
            </Tabs.Panel>
            <Tabs.Panel value="preview" pt="xs">
              <Paper withBorder radius="md" p="sm" className={classes.preview}>
                {draft.content.trim() ? (
                  <Markdown content={draft.content} />
                ) : (
                  <Text size="sm" c="dimmed">
                    {text.emptyPreview}
                  </Text>
                )}
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Stack>

        {saveError && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {saveError}
          </Alert>
        )}

        <Group justify="flex-end" gap="xs">
          {onCancel && (
            <Button variant="subtle" color="gray" disabled={saving} onClick={cancel}>
              {text.cancel}
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={!!skill && !dirty}>
            {skill ? text.save : text.create}
          </Button>
        </Group>

        <ConfirmDialog
          opened={confirmOpen}
          title={text.discardTitle}
          message={text.discardMessage}
          labels={{ confirm: text.discard, cancel: text.keepEditing }}
          danger
          onConfirm={() => {
            setDraft(baseline);
            setErrors({});
            onCancel?.();
          }}
          onClose={() => setConfirmOpen(false)}
        />
      </Stack>
    </form>
  );
});

SkillEditor.displayName = 'SkillEditor';
