import React, { memo, useMemo } from 'react';
import {
  Autocomplete,
  Code,
  Group,
  NumberInput,
  Radio,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Textarea,
} from '@mantine/core';
import type { WizardStep } from '../primitives/Wizard/wizard-state';
import { WizardModal } from '../primitives/Wizard/WizardModal';
import {
  DEFAULT_HOOK_TOOLS,
  MAX_HOOK_TIMEOUT,
  buildHook,
  createHookDraft,
  createHookId,
  DEFAULT_HOOK_MESSAGES,
  describeMatcher,
  eventSupportsMatcher,
  getHookEventText,
  getHookPayloadExample,
  getHookScopeText,
  validateActionStep,
  validateEventStep,
  validateMatcherStep,
  type HookDraft,
  type HookMessages,
} from './hook-wizard';
import {
  HOOK_EVENTS,
  HOOK_EVENT_ORDER,
  HOOK_SCOPE_ORDER,
  type HookConfig,
  type HookEventTextOverrides,
  type HookScopeTextOverrides,
  type HookType,
} from './types';
import classes from './HookWizard.module.css';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../utils/field-order';

export interface HookWizardLabels {
  addTitle: string;
  editTitle: string;
  add: string;
  save: string;
  eventStep: string;
  matcherStep: string;
  actionStep: string;
  scopeStep: string;
  command: string;
  prompt: string;
  matcher: string;
  matcherHint: string;
  timeout: string;
  timeoutHint: string;
  exampleInput: string;
  events: HookEventTextOverrides;
  scopes: HookScopeTextOverrides;
  messages: Partial<HookMessages>;
}

export interface HookWizardProps {
  /** Whether the wizard modal is open */
  opened: boolean;
  /** Called when the wizard is cancelled or the hook is saved */
  onClose: () => void;
  /** Hook to edit; a hook without `id` prefills a new hook */
  initialHook?: Partial<HookConfig>;
  /** Called with the built hook, a rejected promise keeps the wizard open and shows the error */
  onSubmit: (hook: HookConfig) => void | Promise<void>;
  /** Tool names suggested for the matcher */
  knownTools?: string[];
  /** Creates ids for new hooks */
  createId?: () => string;
  /** Overrides for the English labels */
  labels?: Partial<HookWizardLabels>;
}

const DEFAULT_LABELS: HookWizardLabels = {
  addTitle: 'Add hook',
  editTitle: 'Edit hook',
  add: 'Add hook',
  save: 'Save hook',
  eventStep: 'Event',
  matcherStep: 'Matcher',
  actionStep: 'Action',
  scopeStep: 'Scope',
  command: 'Command',
  prompt: 'Prompt',
  matcher: 'Tool matcher',
  matcherHint:
    'An exact tool name, a regular expression such as Edit|Write, or * for all tools. Leave empty to match every tool.',
  timeout: 'Timeout',
  timeoutHint: 'Seconds before the hook is stopped, empty for the default',
  exampleInput: 'Example input',
  events: {},
  scopes: {},
  messages: {},
};

function HookSummary({
  values,
  labels,
  messages,
}: {
  values: HookDraft;
  labels: HookWizardLabels;
  messages: HookMessages;
}) {
  if (!values.event) {
    return null;
  }
  const action = values.type === 'command' ? values.command : values.prompt;
  const rows: [string, React.ReactNode][] = [
    [labels.eventStep, getHookEventText(values.event, labels.events).label],
    ...(HOOK_EVENTS[values.event].supportsMatcher
      ? [
          [labels.matcherStep, describeMatcher(values.matcher, messages)] as [
            string,
            React.ReactNode,
          ],
        ]
      : []),
    [
      values.type === 'command' ? labels.command : labels.prompt,
      <Code key="action" block className={classes.action}>
        {action.trim()}
      </Code>,
    ],
    ...(values.timeout !== ''
      ? [[labels.timeout, `${values.timeout} s`] as [string, React.ReactNode]]
      : []),
    [labels.scopeStep, getHookScopeText(values.scope, labels.scopes).label],
  ];

  return (
    <Stack gap="md">
      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          {rows.map(([label, value]) => (
            <Table.Tr key={label}>
              <Table.Th w="30%">{label}</Table.Th>
              <Table.Td>{value}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Stack gap={6}>
        <Text size="sm" fw={500}>
          {labels.exampleInput}
        </Text>
        <Code block className={classes.payload}>
          {getHookPayloadExample(values.event, values.matcher)}
        </Code>
      </Stack>
    </Stack>
  );
}

/** Wizard that creates or edits a hook: event, tool matcher, action, scope and a review with an example payload */
export const HookWizard = memo(function HookWizard({
  opened,
  onClose,
  initialHook,
  onSubmit,
  knownTools = DEFAULT_HOOK_TOOLS,
  createId = createHookId,
  labels: labelsProp,
}: HookWizardProps) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const messages = useMemo(
    () => ({ ...DEFAULT_HOOK_MESSAGES, ...labels.messages }),
    [labels.messages]
  );
  const isEdit = !!initialHook?.id;
  const initialValues = useMemo(() => createHookDraft(initialHook), [initialHook]);

  const steps = useMemo<WizardStep<HookDraft>[]>(
    () => [
      {
        id: 'event',
        label: labels.eventStep,
        validate: (values) => validateEventStep(values, messages),
        render: ({ values, setValue, errors }) => (
          <Radio.Group
            value={values.event}
            onChange={(event) => setValue('event', event as HookDraft['event'])}
            error={errors.event}
            aria-label={labels.eventStep}
          >
            <Stack gap="xs">
              {HOOK_EVENT_ORDER.map((event) => {
                const text = getHookEventText(event, labels.events);
                return (
                  <Radio.Card key={event} value={event} radius="md" p="sm">
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Radio.Indicator />
                      <Stack gap={2} miw={0}>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {text.label}
                          </Text>
                          <Code>{event}</Code>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {text.description}
                        </Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                );
              })}
            </Stack>
          </Radio.Group>
        ),
      },
      {
        id: 'matcher',
        label: labels.matcherStep,
        when: (values) => eventSupportsMatcher(values.event),
        validate: (values) => validateMatcherStep(values, messages),
        render: ({ values, setValue, errors }) => (
          <Stack gap="sm">
            <Autocomplete
              label={labels.matcher}
              description={labels.matcherHint}
              inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
              placeholder="Bash"
              data={knownTools}
              value={values.matcher}
              error={errors.matcher}
              onChange={(matcher) => setValue('matcher', matcher)}
              classNames={{ input: classes.mono }}
            />
            {!errors.matcher && (
              <Text size="xs" c="dimmed">
                {describeMatcher(values.matcher, messages)}
              </Text>
            )}
          </Stack>
        ),
      },
      {
        id: 'action',
        label: labels.actionStep,
        validate: (values) => validateActionStep(values, messages),
        render: ({ values, setValue, errors }) => (
          <Stack gap="sm">
            <SegmentedControl
              value={values.type}
              onChange={(type) => setValue('type', type as HookType)}
              data={[
                { value: 'command', label: labels.command },
                { value: 'prompt', label: labels.prompt },
              ]}
            />
            {values.type === 'command' ? (
              <Textarea
                label={labels.command}
                placeholder="npx prettier --write ."
                autosize
                minRows={3}
                maxRows={8}
                value={values.command}
                error={errors.command}
                onChange={(event) => setValue('command', event.currentTarget.value)}
                classNames={{ input: classes.mono }}
              />
            ) : (
              <Textarea
                label={labels.prompt}
                placeholder="Allow the call only when..."
                autosize
                minRows={3}
                maxRows={8}
                value={values.prompt}
                error={errors.prompt}
                onChange={(event) => setValue('prompt', event.currentTarget.value)}
              />
            )}
            <NumberInput
              label={labels.timeout}
              description={labels.timeoutHint}
              inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
              min={1}
              max={MAX_HOOK_TIMEOUT}
              allowDecimal={false}
              suffix=" s"
              value={values.timeout}
              error={errors.timeout}
              onChange={(timeout) =>
                setValue('timeout', typeof timeout === 'number' ? timeout : '')
              }
            />
          </Stack>
        ),
      },
      {
        id: 'scope',
        label: labels.scopeStep,
        render: ({ values, setValue }) => (
          <Radio.Group
            value={values.scope}
            onChange={(scope) => setValue('scope', scope as HookDraft['scope'])}
            aria-label={labels.scopeStep}
          >
            <Stack gap="xs">
              {HOOK_SCOPE_ORDER.map((scope) => {
                const text = getHookScopeText(scope, labels.scopes);
                return (
                  <Radio.Card key={scope} value={scope} radius="md" p="sm">
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Radio.Indicator />
                      <Stack gap={2} miw={0}>
                        <Text size="sm" fw={500}>
                          {text.label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {text.description}
                        </Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                );
              })}
            </Stack>
          </Radio.Group>
        ),
      },
    ],
    [knownTools, labels, messages]
  );

  return (
    <WizardModal<HookDraft>
      opened={opened}
      onClose={onClose}
      title={isEdit ? labels.editTitle : labels.addTitle}
      steps={steps}
      initialValues={initialValues}
      review={(values) => <HookSummary values={values} labels={labels} messages={messages} />}
      labels={{ finish: isEdit ? labels.save : labels.add }}
      onComplete={async (values) => {
        await onSubmit(buildHook(values, initialHook?.id ?? createId()));
        onClose();
      }}
    />
  );
});

HookWizard.displayName = 'HookWizard';
