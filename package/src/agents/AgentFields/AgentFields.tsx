import React, { memo, useState } from 'react';
import {
  CheckIcon,
  ColorSwatch,
  Group,
  Input,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Box,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  type MantineColor,
} from '@mantine/core';
import { Markdown } from '../../Markdown/Markdown';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../../utils/field-order';
import type { ModelOption } from '../../types';
import type { AgentDraft, AgentDraftErrors } from '../types';
import { slugifyAgentName } from '../validate-agent';
import classes from './AgentFields.module.css';

export interface AgentFieldLabels {
  displayName: string;
  displayNamePlaceholder: string;
  name: string;
  nameDescription: string;
  description: string;
  descriptionDescription: string;
  descriptionPlaceholder: string;
  systemPrompt: string;
  systemPromptPlaceholder: string;
  write: string;
  preview: string;
  emptyPreview: string;
  model: string;
  inheritModel: string;
  maxTurns: string;
  maxTurnsDescription: string;
  color: string;
  skills: string;
  skillsPlaceholder: string;
}

export const DEFAULT_AGENT_FIELD_LABELS: AgentFieldLabels = {
  displayName: 'Display name',
  displayNamePlaceholder: 'Code reviewer',
  name: 'Name',
  nameDescription: 'Used to call the agent, lowercase letters, digits and hyphens',
  description: 'When to use',
  descriptionDescription: 'The main agent reads this to decide when to delegate',
  descriptionPlaceholder: 'Use after code changes to review the diff for bugs and missing tests',
  systemPrompt: 'System prompt',
  systemPromptPlaceholder: 'You are a senior engineer reviewing a change…',
  write: 'Write',
  preview: 'Preview',
  emptyPreview: 'Nothing to preview yet',
  model: 'Model',
  inheritModel: 'Inherit from the session',
  maxTurns: 'Max turns',
  maxTurnsDescription: 'Stops the agent after this many turns, no limit when empty',
  color: 'Color',
  skills: 'Skills',
  skillsPlaceholder: 'Pick skills',
};

export const AGENT_COLORS: MantineColor[] = [
  'gray',
  'red',
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'yellow',
  'orange',
];

type PatchDraft = (patch: Partial<AgentDraft>) => void;

interface FieldsProps {
  draft: AgentDraft;
  errors: AgentDraftErrors;
  onChange: PatchDraft;
  labels: AgentFieldLabels;
}

export interface AgentIdentityFieldsProps extends FieldsProps {
  /** Keeps `name` in sync with `displayName` until the name is edited */
  autoName: boolean;
  /** Called when the name is edited by hand */
  onNameEdited: () => void;
  /** Locks the name, for example when editing an existing agent */
  nameDisabled?: boolean;
}

export const AgentIdentityFields = memo(function AgentIdentityFields({
  draft,
  errors,
  onChange,
  labels,
  autoName,
  onNameEdited,
  nameDisabled,
}: AgentIdentityFieldsProps) {
  return (
    <Stack gap="sm">
      <Box className={classes.pairContainer}>
        <Box className={classes.pair}>
          <TextInput
            label={labels.displayName}
            placeholder={labels.displayNamePlaceholder}
            value={draft.displayName}
            onChange={(event) => {
              const displayName = event.currentTarget.value;
              onChange(
                autoName && !nameDisabled
                  ? { displayName, name: slugifyAgentName(displayName) }
                  : { displayName }
              );
            }}
          />
          <TextInput
            label={labels.name}
            description={labels.nameDescription}
            inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
            withAsterisk
            classNames={{ input: classes.mono }}
            value={draft.name}
            error={errors.name}
            disabled={nameDisabled}
            onChange={(event) => {
              onNameEdited();
              onChange({ name: event.currentTarget.value });
            }}
          />
        </Box>
      </Box>
      <Textarea
        label={labels.description}
        description={labels.descriptionDescription}
        inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
        placeholder={labels.descriptionPlaceholder}
        withAsterisk
        autosize
        minRows={2}
        maxRows={6}
        value={draft.description}
        error={errors.description}
        onChange={(event) => onChange({ description: event.currentTarget.value })}
      />
    </Stack>
  );
});

export interface AgentPromptFieldProps extends FieldsProps {
  /** Minimum number of rows of the editor, `8` by default */
  minRows?: number;
}

export const AgentPromptField = memo(function AgentPromptField({
  draft,
  errors,
  onChange,
  labels,
  minRows = 8,
}: AgentPromptFieldProps) {
  const [tab, setTab] = useState<string | null>('write');

  return (
    <Input.Wrapper
      label={labels.systemPrompt}
      withAsterisk
      error={errors.systemPrompt}
      classNames={{ root: classes.field }}
    >
      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="write">{labels.write}</Tabs.Tab>
          <Tabs.Tab value="preview">{labels.preview}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="write" pt="xs">
          <Textarea
            aria-label={labels.systemPrompt}
            placeholder={labels.systemPromptPlaceholder}
            autosize
            minRows={minRows}
            maxRows={24}
            classNames={{ input: classes.mono }}
            value={draft.systemPrompt}
            error={!!errors.systemPrompt}
            onChange={(event) => onChange({ systemPrompt: event.currentTarget.value })}
          />
        </Tabs.Panel>
        <Tabs.Panel value="preview" pt="xs">
          <Paper withBorder radius="md" p="md" className={classes.preview}>
            {draft.systemPrompt.trim() ? (
              <Markdown content={draft.systemPrompt} />
            ) : (
              <Text size="sm" c="dimmed">
                {labels.emptyPreview}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Input.Wrapper>
  );
});

export function getModelSelectData(
  models: readonly ModelOption[],
  current: string,
  inheritLabel: string
) {
  const data = [
    { value: 'inherit', label: inheritLabel },
    ...models.map((model) => ({
      value: model.id,
      label: model.version ? `${model.name} ${model.version}` : model.name,
    })),
  ];
  if (current && !data.some((item) => item.value === current)) {
    data.push({ value: current, label: current });
  }
  return data;
}

export interface AgentColorPickerProps {
  /** Selected Mantine color */
  value?: MantineColor;
  /** Called with the picked color, `undefined` when the selected color is clicked again */
  onChange: (value: MantineColor | undefined) => void;
  /** Colors to offer */
  colors?: MantineColor[];
  /** Label of the group */
  label: string;
}

export const AgentColorPicker = memo(function AgentColorPicker({
  value,
  onChange,
  colors = AGENT_COLORS,
  label,
}: AgentColorPickerProps) {
  return (
    <Input.Wrapper label={label} labelElement="div" classNames={{ root: classes.field }}>
      <Group gap={6} role="group" aria-label={label}>
        {colors.map((color) => {
          const selected = color === value;
          return (
            <ColorSwatch
              key={color}
              component="button"
              type="button"
              color={`var(--mantine-color-${color}-filled)`}
              size={24}
              aria-label={color}
              aria-pressed={selected}
              className={classes.swatch}
              onClick={() => onChange(selected ? undefined : color)}
            >
              {selected && <CheckIcon size={10} />}
            </ColorSwatch>
          );
        })}
      </Group>
    </Input.Wrapper>
  );
});

export interface AgentModelFieldsProps extends FieldsProps {
  /** Models offered in addition to `inherit` */
  models: readonly ModelOption[];
  /** Skills offered in the skills picker, the picker is hidden when empty and nothing is selected */
  skills?: readonly string[];
  /** Colors offered in the color picker */
  colors?: MantineColor[];
}

export const AgentModelFields = memo(function AgentModelFields({
  draft,
  errors,
  onChange,
  labels,
  models,
  skills = [],
  colors,
}: AgentModelFieldsProps) {
  const skillData = [...new Set([...skills, ...draft.skills])];

  return (
    <Stack gap="sm">
      <Box className={classes.pairContainer}>
        <Box className={classes.pair}>
          <Select
            label={labels.model}
            allowDeselect={false}
            data={getModelSelectData(models, draft.model, labels.inheritModel)}
            value={draft.model}
            onChange={(value) => value && onChange({ model: value })}
          />
          <NumberInput
            label={labels.maxTurns}
            description={labels.maxTurnsDescription}
            inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
            min={1}
            allowDecimal={false}
            allowNegative={false}
            value={draft.maxTurns ?? ''}
            error={errors.maxTurns}
            onChange={(value) =>
              onChange({ maxTurns: typeof value === 'number' ? value : undefined })
            }
          />
        </Box>
      </Box>
      {skillData.length > 0 && (
        <MultiSelect
          label={labels.skills}
          placeholder={draft.skills.length === 0 ? labels.skillsPlaceholder : undefined}
          searchable
          clearable
          data={skillData}
          value={draft.skills}
          onChange={(value) => onChange({ skills: value })}
        />
      )}
      <AgentColorPicker
        label={labels.color}
        value={draft.color}
        colors={colors}
        onChange={(color) => onChange({ color })}
      />
    </Stack>
  );
});
