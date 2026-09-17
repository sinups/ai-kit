import React, { memo, useMemo } from 'react';
import {
  Code,
  DataList,
  Group,
  Input,
  SegmentedControl,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core';
import { IconKey, IconPlugConnected, IconServer } from '@tabler/icons-react';
import { KeyValueEditor } from '../primitives/KeyValueEditor/KeyValueEditor';
import { envKeyValidator, headerKeyValidator } from '../primitives/KeyValueEditor/key-value';
import { Wizard, type WizardLabels } from '../primitives/Wizard/Wizard';
import { WizardModal } from '../primitives/Wizard/WizardModal';
import type { WizardStep } from '../primitives/Wizard/wizard-state';
import {
  createMcpServerDraft,
  getMcpDraftPairsKey,
  DEFAULT_MCP_DRAFT_LABELS,
  normalizeMcpServerDraft,
  splitMcpCommandLine,
  validateMcpBasics,
  validateMcpConnection,
  validateMcpPairs,
  type McpDraftLabels,
} from './mcp-draft';
import { MCP_SCOPE_LABELS } from './mcp-server';
import classes from './Mcp.module.css';
import { MCP_TRANSPORT_LABELS } from './McpTransportIcon';
import type { McpServer, McpServerDraft, McpServerScope, McpTransport } from './types';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../utils/field-order';

export type McpServerWizardLabels = McpDraftLabels & {
  addTitle: string;
  editTitle: string;
  save: string;
  add: string;
  basics: string;
  basicsDescription: string;
  connection: string;
  connectionDescription: string;
  environment: string;
  headers: string;
  pairsDescription: string;
  environmentStep: string;
  headersStep: string;
  name: string;
  namePlaceholder: string;
  scope: string;
  scopeDescriptions: Record<McpServerScope, string>;
  transport: string;
  transportDescriptions: Record<McpTransport, string>;
  command: string;
  commandDescription: string;
  arguments: string;
  argumentsDescription: string;
  url: string;
  urlPlaceholder: string;
  addVariable: string;
  addHeader: string;
  none: string;
  secretValue: string;
  scopes: Record<McpServerScope, string>;
  transports: Record<McpTransport, string>;
  wizard: Partial<WizardLabels>;
};

export const DEFAULT_MCP_SERVER_WIZARD_LABELS: McpServerWizardLabels = {
  ...DEFAULT_MCP_DRAFT_LABELS,
  addTitle: 'Add MCP server',
  editTitle: 'Edit MCP server',
  save: 'Save',
  add: 'Add server',
  basics: 'Basics',
  basicsDescription: 'Name, scope and transport',
  connection: 'Connection',
  connectionDescription: 'How to reach the server',
  environment: 'Environment',
  headers: 'Headers',
  pairsDescription: 'Values passed to the server, mark tokens as secret',
  environmentStep: 'Variables for the process',
  headersStep: 'Sent with every request',
  name: 'Name',
  namePlaceholder: 'git',
  scope: 'Scope',
  scopeDescriptions: {
    user: 'Available in all your projects',
    project: 'Shared with everyone in this project',
    local: 'Only you, only in this project',
  },
  transport: 'Transport',
  transportDescriptions: {
    stdio: 'Starts a local process and talks over stdin and stdout',
    http: 'Connects to a remote Streamable HTTP endpoint',
    sse: 'Connects to a remote server-sent events endpoint',
  },
  command: 'Command',
  commandDescription: 'Paste a full command line to split it into arguments',
  arguments: 'Arguments',
  argumentsDescription: 'Press Enter after each argument',
  url: 'URL',
  urlPlaceholder: 'https://example.com/mcp',
  addVariable: 'Add variable',
  addHeader: 'Add header',
  none: 'None',
  secretValue: '••••••••',
  scopes: MCP_SCOPE_LABELS,
  transports: MCP_TRANSPORT_LABELS,
  wizard: {},
};

type SubmitHandler = (draft: McpServerDraft) => void | Promise<void>;

export interface McpServerWizardProps {
  /** Called with the normalized draft after the review step, a rejected promise is shown in an alert */
  onSubmit: SubmitHandler;
  /** Called by the cancel button */
  onCancel?: () => void;
  /** Server to edit, the wizard adds a new server when omitted */
  initialServer?: McpServer;
  /** Transport preselected for a new server, `stdio` by default */
  defaultTransport?: McpTransport;
  /** Names already in use, compared case-insensitively; the edited server's own name is ignored */
  existingNames?: string[];
  /** Step, field and message overrides */
  labels?: Partial<McpServerWizardLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export interface McpServerWizardModalProps extends McpServerWizardProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Called when the modal is dismissed, cancelled or after a successful submit */
  onClose: () => void;
}

function useMcpWizardConfig({
  initialServer,
  defaultTransport,
  existingNames,
  labels: labelsOverride,
}: Pick<McpServerWizardProps, 'initialServer' | 'defaultTransport' | 'existingNames' | 'labels'>) {
  const labels = { ...DEFAULT_MCP_SERVER_WIZARD_LABELS, ...labelsOverride };
  const initialValues = useMemo(
    () => ({
      ...createMcpServerDraft(initialServer),
      transport: initialServer?.transport ?? defaultTransport ?? 'stdio',
    }),
    [initialServer, defaultTransport]
  );
  const takenNames = useMemo(
    () =>
      (existingNames ?? []).filter(
        (name) => name.toLowerCase() !== initialServer?.name.toLowerCase()
      ),
    [existingNames, initialServer]
  );

  const steps: WizardStep<McpServerDraft>[] = [
    {
      id: 'basics',
      label: labels.basics,
      description: labels.basicsDescription,
      icon: <IconServer size={16} />,
      validate: (values) => validateMcpBasics(values, takenNames, labels),
      render: ({ values, setValue, errors }) => (
        <Stack gap="md">
          <TextInput
            label={labels.name}
            placeholder={labels.namePlaceholder}
            withAsterisk
            autoComplete="off"
            value={values.name}
            error={errors.name}
            onChange={(event) => setValue('name', event.currentTarget.value)}
          />
          <Select
            label={labels.scope}
            description={labels.scopeDescriptions[values.scope]}
            inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
            allowDeselect={false}
            value={values.scope}
            data={(Object.keys(labels.scopes) as McpServerScope[]).map((scope) => ({
              value: scope,
              label: labels.scopes[scope],
            }))}
            onChange={(scope) => scope && setValue('scope', scope as McpServerScope)}
          />
          <Input.Wrapper
            label={labels.transport}
            description={labels.transportDescriptions[values.transport]}
            classNames={{ root: classes.field }}
          >
            <SegmentedControl
              fullWidth
              aria-label={labels.transport}
              value={values.transport}
              data={(Object.keys(labels.transports) as McpTransport[]).map((transport) => ({
                value: transport,
                label: labels.transports[transport],
              }))}
              onChange={(transport) => setValue('transport', transport as McpTransport)}
            />
          </Input.Wrapper>
        </Stack>
      ),
    },
    {
      id: 'connection',
      label: labels.connection,
      description: labels.connectionDescription,
      icon: <IconPlugConnected size={16} />,
      validate: (values) => validateMcpConnection(values, labels),
      render: ({ values, setValue, setValues, errors }) =>
        values.transport === 'stdio' ? (
          <Stack gap="md">
            <TextInput
              label={labels.command}
              description={labels.commandDescription}
              inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
              withAsterisk
              autoComplete="off"
              spellCheck={false}
              value={values.command}
              error={errors.command}
              onChange={(event) => setValue('command', event.currentTarget.value)}
              onPaste={(event) => {
                const { selectionStart, selectionEnd, value } = event.currentTarget;
                const replacesAll = selectionStart === 0 && selectionEnd === value.length;
                const parts = replacesAll
                  ? splitMcpCommandLine(event.clipboardData.getData('text'))
                  : [];
                if (parts.length > 1) {
                  event.preventDefault();
                  setValues({ command: parts[0], args: [...values.args, ...parts.slice(1)] });
                }
              }}
            />
            <TagsInput
              label={labels.arguments}
              description={labels.argumentsDescription}
              inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
              placeholder={values.args.length ? undefined : '-y'}
              allowDuplicates
              splitChars={[]}
              value={values.args}
              onChange={(args) => setValue('args', args)}
            />
          </Stack>
        ) : (
          <TextInput
            label={labels.url}
            placeholder={labels.urlPlaceholder}
            withAsterisk
            type="url"
            autoComplete="off"
            spellCheck={false}
            value={values.url}
            error={errors.url}
            onChange={(event) => setValue('url', event.currentTarget.value)}
          />
        ),
    },
    ...(['env', 'headers'] as const).map(
      (key): WizardStep<McpServerDraft> => ({
        id: key,
        label: key === 'env' ? labels.environment : labels.headers,
        description: key === 'env' ? labels.environmentStep : labels.headersStep,
        icon: <IconKey size={16} />,
        when: (values) => getMcpDraftPairsKey(values) === key,
        validate: validateMcpPairs,
        render: ({ values, setValue }) => (
          <Input.Wrapper
            label={key === 'env' ? labels.environment : labels.headers}
            description={labels.pairsDescription}
            classNames={{ root: classes.field }}
          >
            <KeyValueEditor
              value={values[key]}
              onChange={(pairs) => setValue(key, pairs)}
              keyPlaceholder={key === 'env' ? 'NAME' : 'Header'}
              valuePlaceholder="value"
              addLabel={key === 'env' ? labels.addVariable : labels.addHeader}
              allowSecrets
              validateKey={key === 'env' ? envKeyValidator : headerKeyValidator}
            />
          </Input.Wrapper>
        ),
      })
    ),
  ];

  const review = (values: McpServerDraft) => {
    const draft = normalizeMcpServerDraft(values);
    const pairs = draft[getMcpDraftPairsKey(draft)];
    return (
      <DataList size="sm" withDivider orientation="vertical">
        <DataList.Item>
          <DataList.ItemLabel>{labels.name}</DataList.ItemLabel>
          <DataList.ItemValue>{draft.name}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{labels.scope}</DataList.ItemLabel>
          <DataList.ItemValue>{labels.scopes[draft.scope]}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{labels.transport}</DataList.ItemLabel>
          <DataList.ItemValue>{labels.transports[draft.transport]}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            {draft.transport === 'stdio' ? labels.command : labels.url}
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <Code block className={classes.breakAll}>
              {draft.transport === 'stdio' ? [draft.command, ...draft.args].join(' ') : draft.url}
            </Code>
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            {draft.transport === 'stdio' ? labels.environment : labels.headers}
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {pairs.length === 0 ? (
              <Text size="sm" c="dimmed">
                {labels.none}
              </Text>
            ) : (
              <Stack gap={4}>
                {pairs.map((pair) => (
                  <Group key={pair.id} gap={6} wrap="nowrap">
                    <Code>{pair.key}</Code>
                    <Text size="sm" ff="monospace" className={classes.breakAll}>
                      {pair.secret ? labels.secretValue : pair.value}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </DataList.ItemValue>
        </DataList.Item>
      </DataList>
    );
  };

  const wizardLabels: Partial<WizardLabels> = {
    finish: initialServer ? labels.save : labels.add,
    ...labels.wizard,
  };

  return { labels, initialValues, steps, review, wizardLabels };
}

/** Multi-step form that adds or edits an MCP server: basics, connection, environment or headers, review */
export const McpServerWizard = memo(function McpServerWizard({
  onSubmit,
  onCancel,
  initialServer,
  defaultTransport,
  existingNames,
  labels,
  className,
  style,
}: McpServerWizardProps) {
  const config = useMcpWizardConfig({ initialServer, defaultTransport, existingNames, labels });
  return (
    <Wizard<McpServerDraft>
      key={initialServer?.id ?? 'new'}
      steps={config.steps}
      initialValues={config.initialValues}
      review={config.review}
      nonLinear={Boolean(initialServer)}
      labels={config.wizardLabels}
      onComplete={(values) => onSubmit(normalizeMcpServerDraft(values))}
      onCancel={onCancel}
      className={className}
      style={style}
    />
  );
});

McpServerWizard.displayName = 'McpServerWizard';

/** `McpServerWizard` in a modal that closes after a successful submit */
export const McpServerWizardModal = memo(function McpServerWizardModal({
  opened,
  onClose,
  onSubmit,
  onCancel,
  initialServer,
  defaultTransport,
  existingNames,
  labels,
  className,
  style,
}: McpServerWizardModalProps) {
  const config = useMcpWizardConfig({ initialServer, defaultTransport, existingNames, labels });
  return (
    <WizardModal<McpServerDraft>
      key={initialServer?.id ?? 'new'}
      opened={opened}
      onClose={onClose}
      onCancel={onCancel}
      title={initialServer ? config.labels.editTitle : config.labels.addTitle}
      steps={config.steps}
      initialValues={config.initialValues}
      review={config.review}
      nonLinear={Boolean(initialServer)}
      labels={config.wizardLabels}
      onComplete={async (values) => {
        await onSubmit(normalizeMcpServerDraft(values));
        onClose();
      }}
      className={className}
      style={style}
    />
  );
});

McpServerWizardModal.displayName = 'McpServerWizardModal';
