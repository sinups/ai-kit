import React, { memo, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  List,
  MultiSelect,
  Radio,
  Stack,
  Table,
  Text,
  Textarea,
  type MantineColor,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconPencil,
  IconSparkles,
} from '@tabler/icons-react';
import { WizardModal } from '../../primitives/Wizard/WizardModal';
import type { WizardStep, WizardStepContext } from '../../primitives/Wizard/wizard-state';
import type { ModelOption } from '../../types';
import { getAgentModelLabel } from '../agent-display';
import { AgentAvatar } from '../AgentAvatar/AgentAvatar';
import {
  AgentIdentityFields,
  AgentModelFields,
  AgentPromptField,
  DEFAULT_AGENT_FIELD_LABELS,
  type AgentFieldLabels,
} from '../AgentFields/AgentFields';
import { ToolSelector, type ToolSelectorLabels } from '../ToolSelector/ToolSelector';
import type { AgentDraft, AgentDraftErrors, AgentDraftField, ToolCatalogItem } from '../types';
import {
  createAgentDraft,
  getDestructiveTools,
  slugifyAgentName,
  summarizeTools,
  validateAgentDraft,
  type AgentToolSummaryLabels,
  type AgentValidationMessages,
} from '../validate-agent';
import { getErrorMessage } from '../../utils/error-message';
import { fillTemplate } from '../../utils/fill-template';

export type AgentCreateMethod = 'generate' | 'manual';

export interface AgentWizardValues extends AgentDraft {
  method: AgentCreateMethod;
  /** Task description sent to `onGenerate` */
  task: string;
  /** Whether a generated draft was applied */
  generated: boolean;
  /** Whether the name was edited by hand, stops deriving it from the display name */
  nameEdited: boolean;
}

export interface AgentCreateWizardLabels extends AgentFieldLabels {
  title: string;
  create: string;
  methodStep: string;
  methodDescription: string;
  generateMethod: string;
  generateMethodDescription: string;
  manualMethod: string;
  manualMethodDescription: string;
  task: string;
  taskPlaceholder: string;
  generate: string;
  regenerate: string;
  generated: string;
  generateRequired: string;
  generateError: string;
  identityStep: string;
  identityDescription: string;
  promptStep: string;
  promptDescription: string;
  toolsStep: string;
  toolsDescription: string;
  disallowedTools: string;
  appearanceStep: string;
  appearanceDescription: string;
  summaryName: string;
  summaryDescription: string;
  summaryModel: string;
  summaryTools: string;
  summaryMaxTurns: string;
  summarySkills: string;
  noLimit: string;
  none: string;
  warnings: string;
  /** `{tools}` is replaced */
  destructiveWarning: string;
  toolSummary: Partial<AgentToolSummaryLabels>;
  /** Labels of the tool selector */
  toolSelector: Partial<ToolSelectorLabels>;
  /** Validation messages of the fields */
  validation: Partial<AgentValidationMessages>;
}

export const DEFAULT_AGENT_CREATE_WIZARD_LABELS: AgentCreateWizardLabels = {
  ...DEFAULT_AGENT_FIELD_LABELS,
  title: 'New agent',
  create: 'Create agent',
  methodStep: 'Method',
  methodDescription: 'Generate or configure',
  generateMethod: 'Generate with AI',
  generateMethodDescription: 'Describe the task and get a draft with a prompt and tools',
  manualMethod: 'Configure manually',
  manualMethodDescription: 'Start from an empty agent and fill every field yourself',
  task: 'What should the agent do?',
  taskPlaceholder: 'Review pull requests for security issues and leave comments on risky lines',
  generate: 'Generate draft',
  regenerate: 'Generate again',
  generated: 'Draft generated. Review and adjust it on the next steps.',
  generateRequired: 'Generate a draft or switch to manual configuration',
  generateError: 'Could not generate the agent',
  identityStep: 'Identity',
  identityDescription: 'Name and when to use',
  promptStep: 'Prompt',
  promptDescription: 'System prompt',
  toolsStep: 'Tools',
  toolsDescription: 'What the agent can call',
  disallowedTools: 'Disallowed tools',
  appearanceStep: 'Model',
  appearanceDescription: 'Model and appearance',
  summaryName: 'Name',
  summaryDescription: 'When to use',
  summaryModel: 'Model',
  summaryTools: 'Tools',
  summaryMaxTurns: 'Max turns',
  summarySkills: 'Skills',
  noLimit: 'No limit',
  none: 'None',
  warnings: 'Check before creating',
  destructiveWarning: 'The agent can call destructive tools: {tools}',
  toolSummary: {},
  toolSelector: {},
  validation: {},
};

export interface AgentCreateWizardProps {
  /** Whether the wizard modal is open */
  opened: boolean;
  /** Called when the wizard is dismissed and after a successful `onCreate` */
  onClose: () => void;
  /** Called with a valid draft on the last step; a rejected promise is shown in an alert */
  onCreate: (draft: AgentDraft) => void | Promise<void>;
  /** Generates a draft from a task description, the Generate with AI method is offered only when set */
  onGenerate?: (task: string) => Promise<Partial<AgentDraft>>;
  /** Tools that can be picked */
  catalog: ToolCatalogItem[];
  /** Models offered in addition to `inherit` */
  models?: ModelOption[];
  /** Skills offered in the skills picker */
  skills?: string[];
  /** Colors offered in the color picker */
  colors?: MantineColor[];
  /** Names of existing agents, used to check that the name is unique */
  existingNames?: string[];
  /** Values the wizard starts from */
  initialDraft?: Partial<AgentDraft>;
  /** Overrides of the default English labels */
  labels?: Partial<AgentCreateWizardLabels>;
}

function pickErrors(errors: AgentDraftErrors, fields: AgentDraftField[]): AgentDraftErrors | null {
  const picked: AgentDraftErrors = {};
  for (const field of fields) {
    if (errors[field]) {
      picked[field] = errors[field];
    }
  }
  return Object.keys(picked).length > 0 ? picked : null;
}

export function toAgentDraft({
  method: _method,
  task: _task,
  generated: _generated,
  nameEdited: _nameEdited,
  ...draft
}: AgentWizardValues): AgentDraft {
  return draft;
}

interface MethodStepProps {
  ctx: WizardStepContext<AgentWizardValues>;
  onGenerate: (task: string) => Promise<Partial<AgentDraft>>;
  generating: boolean;
  onGeneratingChange: (generating: boolean) => void;
  labels: AgentCreateWizardLabels;
}

function MethodStep({
  ctx,
  onGenerate,
  generating,
  onGeneratingChange: setGenerating,
  labels,
}: MethodStepProps) {
  const { values, setValues, errors } = ctx;
  const [failure, setFailure] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setFailure(null);
    try {
      const result = await onGenerate(values.task.trim());
      const draft = createAgentDraft({ ...toAgentDraft(values), ...result });
      if (!result.name && !values.nameEdited && draft.displayName) {
        draft.name = slugifyAgentName(draft.displayName);
      }
      setValues({
        ...draft,
        generated: true,
        nameEdited: !!result.name,
      });
    } catch (error) {
      setFailure(getErrorMessage(error, labels.generateError));
    } finally {
      setGenerating(false);
    }
  };

  const option = (
    value: AgentCreateMethod,
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <Radio.Card value={value} radius="md" p="md">
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Radio.Indicator />
        <Stack gap={2} miw={0}>
          <Group gap={6} wrap="nowrap">
            {icon}
            <Text size="sm" fw={500}>
              {title}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Group>
    </Radio.Card>
  );

  return (
    <Stack gap="md">
      <Radio.Group
        value={values.method}
        onChange={(method) => setValues({ method: method as AgentCreateMethod })}
      >
        <Stack gap="xs">
          {option(
            'generate',
            <IconSparkles size={16} />,
            labels.generateMethod,
            labels.generateMethodDescription
          )}
          {option(
            'manual',
            <IconPencil size={16} />,
            labels.manualMethod,
            labels.manualMethodDescription
          )}
        </Stack>
      </Radio.Group>

      {values.method === 'generate' && (
        <Stack gap="sm">
          <Textarea
            label={labels.task}
            placeholder={labels.taskPlaceholder}
            autosize
            minRows={3}
            maxRows={8}
            value={values.task}
            error={errors.task}
            onChange={(event) => setValues({ task: event.currentTarget.value, generated: false })}
          />
          <Group>
            <Button
              size="sm"
              variant={values.generated ? 'default' : 'light'}
              leftSection={<IconSparkles size={16} />}
              loading={generating}
              disabled={!values.task.trim()}
              onClick={generate}
            >
              {values.generated ? labels.regenerate : labels.generate}
            </Button>
          </Group>
          {failure && (
            <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
              {failure}
            </Alert>
          )}
          {values.generated && !failure && (
            <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
              {labels.generated}
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/** Modal wizard that creates an agent: generate a draft with AI or configure it step by step, then review */
export const AgentCreateWizard = memo(function AgentCreateWizard({
  opened,
  onClose,
  onCreate,
  onGenerate,
  catalog,
  models = [],
  skills,
  colors,
  existingNames = [],
  initialDraft,
  labels: labelsProp,
}: AgentCreateWizardProps) {
  const labels = { ...DEFAULT_AGENT_CREATE_WIZARD_LABELS, ...labelsProp };
  const [generating, setGenerating] = useState(false);

  const handleClose = () => {
    setGenerating(false);
    onClose();
  };

  const initialValues = useMemo<AgentWizardValues>(
    () => ({
      ...createAgentDraft(initialDraft),
      method: onGenerate ? 'generate' : 'manual',
      task: '',
      generated: false,
      nameEdited: !!initialDraft?.name,
    }),
    [initialDraft, onGenerate]
  );

  const validate = (values: AgentWizardValues) =>
    validateAgentDraft(toAgentDraft(values), { existingNames, messages: labels.validation });

  const steps: WizardStep<AgentWizardValues>[] = [
    {
      id: 'method',
      label: labels.methodStep,
      description: labels.methodDescription,
      icon: <IconSparkles size={16} />,
      when: () => !!onGenerate,
      validate: (values) =>
        values.method === 'generate' && !values.generated
          ? { task: labels.generateRequired }
          : null,
      render: (ctx) => (
        <MethodStep
          ctx={ctx}
          onGenerate={onGenerate!}
          generating={generating}
          onGeneratingChange={setGenerating}
          labels={labels}
        />
      ),
    },
    {
      id: 'identity',
      label: labels.identityStep,
      description: labels.identityDescription,
      validate: (values) => pickErrors(validate(values), ['name', 'description']),
      render: ({ values, setValues, errors }) => (
        <AgentIdentityFields
          draft={values}
          errors={errors}
          labels={labels}
          onChange={setValues}
          autoName={!values.nameEdited}
          onNameEdited={() => setValues({ nameEdited: true })}
        />
      ),
    },
    {
      id: 'prompt',
      label: labels.promptStep,
      description: labels.promptDescription,
      validate: (values) => pickErrors(validate(values), ['systemPrompt']),
      render: ({ values, setValues, errors }) => (
        <AgentPromptField draft={values} errors={errors} labels={labels} onChange={setValues} />
      ),
    },
    {
      id: 'tools',
      label: labels.toolsStep,
      description: labels.toolsDescription,
      validate: (values) => pickErrors(validate(values), ['tools', 'disallowedTools']),
      render: ({ values, setValues, errors }) => (
        <Stack gap="md">
          <ToolSelector
            catalog={catalog}
            value={values.tools}
            error={errors.tools}
            onChange={(tools) => setValues({ tools })}
            labels={labels.toolSelector}
          />
          <MultiSelect
            label={labels.disallowedTools}
            searchable
            clearable
            data={[...new Set([...catalog.map((tool) => tool.name), ...values.disallowedTools])]}
            value={values.disallowedTools}
            error={errors.disallowedTools}
            onChange={(disallowedTools) => setValues({ disallowedTools })}
          />
        </Stack>
      ),
    },
    {
      id: 'appearance',
      label: labels.appearanceStep,
      description: labels.appearanceDescription,
      optional: true,
      validate: (values) => pickErrors(validate(values), ['maxTurns']),
      render: ({ values, setValues, errors }) => (
        <AgentModelFields
          draft={values}
          errors={errors}
          labels={labels}
          onChange={setValues}
          models={models}
          skills={skills}
          colors={colors}
        />
      ),
    },
  ];

  const review = (values: AgentWizardValues) => {
    const draft = toAgentDraft(values);
    const warnings = Object.values(validate(values));
    const destructive = getDestructiveTools(draft, catalog);
    if (destructive.length > 0) {
      warnings.push(fillTemplate(labels.destructiveWarning, { tools: destructive.join(', ') }));
    }
    const rows: [string, React.ReactNode][] = [
      [
        labels.summaryName,
        <Group key="name" gap="xs" wrap="nowrap">
          <AgentAvatar agent={draft} size="sm" />
          <Text size="sm" truncate>
            {draft.displayName ? `${draft.displayName} (${draft.name})` : draft.name}
          </Text>
        </Group>,
      ],
      [labels.summaryDescription, draft.description],
      [labels.summaryModel, getAgentModelLabel(draft.model, models, labels.inheritModel)],
      [labels.summaryTools, summarizeTools(draft.tools, catalog, labels.toolSummary)],
      [labels.summaryMaxTurns, draft.maxTurns ?? labels.noLimit],
      [labels.summarySkills, draft.skills.length > 0 ? draft.skills.join(', ') : labels.none],
    ];
    return (
      <Stack gap="md">
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            {rows.map(([label, value]) => (
              <Table.Tr key={label}>
                <Table.Th w="35%">{label}</Table.Th>
                <Table.Td>{value || '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {warnings.length > 0 && (
          <Alert
            color="yellow"
            variant="light"
            title={labels.warnings}
            icon={<IconAlertTriangle size={16} />}
          >
            <List size="sm" spacing={4}>
              {warnings.map((warning) => (
                <List.Item key={warning}>{warning}</List.Item>
              ))}
            </List>
          </Alert>
        )}
      </Stack>
    );
  };

  return (
    <WizardModal<AgentWizardValues>
      opened={opened}
      onClose={handleClose}
      title={labels.title}
      busy={generating}
      steps={steps}
      initialValues={initialValues}
      review={review}
      labels={{ finish: labels.create }}
      onComplete={async (values) => {
        const errors = validate(values);
        if (Object.keys(errors).length > 0) {
          throw new Error(Object.values(errors)[0]);
        }
        await onCreate(toAgentDraft(values));
        handleClose();
      }}
    />
  );
});

AgentCreateWizard.displayName = 'AgentCreateWizard';
