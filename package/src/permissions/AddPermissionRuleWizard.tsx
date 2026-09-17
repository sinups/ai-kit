import React, { memo, useMemo } from 'react';
import { Alert, Button, Code, Group, Radio, Stack, Table, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { WizardStep } from '../primitives/Wizard/wizard-state';
import { WizardModal } from '../primitives/Wizard/WizardModal';
import {
  DEFAULT_PERMISSION_TOOLS,
  PERMISSION_RULE_EXAMPLES,
  createPermissionId,
  describeRule,
  formatRule,
  getBroadRuleWarning,
  validateRule,
} from './permission-rule';
import { PermissionRuleInput } from './PermissionRuleInput';
import {
  buildPermissionRule,
  createRuleDraft,
  validateRuleStep,
  validateScopeStep,
  type PermissionRuleDraft,
} from './rule-wizard';
import {
  EDITABLE_PERMISSION_SCOPES,
  PERMISSION_BEHAVIORS,
  PERMISSION_BEHAVIOR_ORDER,
  PERMISSION_SCOPES,
  type PermissionBehavior,
  type PermissionRule,
  type PermissionScope,
} from './types';

export interface AddPermissionRuleWizardLabels {
  addTitle: string;
  editTitle: string;
  add: string;
  save: string;
  behaviorStep: string;
  ruleStep: string;
  scopeStep: string;
  examples: string;
  rule: string;
  behavior: string;
  scope: string;
  description: string;
}

export interface AddPermissionRuleWizardProps {
  /** Whether the wizard modal is open */
  opened: boolean;
  /** Called when the wizard is cancelled or the rule is saved */
  onClose: () => void;
  /** Called with the built rule, a rejected promise keeps the wizard open and shows the error */
  onSubmit: (rule: PermissionRule) => void | Promise<void>;
  /** Rule to edit; a rule without `id` prefills a new rule, for example from a denial */
  initialRule?: Partial<PermissionRule>;
  /** Tool names suggested in the rule field */
  knownTools?: string[];
  /** Scopes offered in the scope step, all scopes except `policy` by default */
  scopes?: PermissionScope[];
  /** Scope preselected for a new rule, `local` by default */
  defaultScope?: PermissionScope;
  /** Rule examples inserted by a click */
  examples?: string[];
  /** Creates ids for new rules */
  createId?: () => string;
  /** Overrides of the default English labels */
  labels?: Partial<AddPermissionRuleWizardLabels>;
}

export const DEFAULT_ADD_PERMISSION_RULE_WIZARD_LABELS: AddPermissionRuleWizardLabels = {
  addTitle: 'Add permission rule',
  editTitle: 'Edit permission rule',
  add: 'Add rule',
  save: 'Save rule',
  behaviorStep: 'Behavior',
  ruleStep: 'Rule',
  scopeStep: 'Scope',
  examples: 'Examples',
  rule: 'Rule',
  behavior: 'Behavior',
  scope: 'Scope',
  description: 'Effect',
};

function RuleReview({
  values,
  labels,
}: {
  values: PermissionRuleDraft;
  labels: AddPermissionRuleWizardLabels;
}) {
  const parsed = validateRule(values.rule).rule;
  if (!parsed) {
    return null;
  }
  const rule = { behavior: values.behavior, ...parsed };
  const warning = getBroadRuleWarning(rule);
  const rows: [string, React.ReactNode][] = [
    [labels.description, describeRule(rule)],
    [labels.rule, <Code key="rule">{formatRule(parsed)}</Code>],
    [labels.behavior, PERMISSION_BEHAVIORS[values.behavior].label],
    [labels.scope, PERMISSION_SCOPES[values.scope].label],
  ];
  return (
    <Stack gap="md">
      <Table variant="vertical" layout="fixed" withTableBorder fz="sm">
        <Table.Tbody>
          {rows.map(([label, value]) => (
            <Table.Tr key={label}>
              <Table.Th w="30%">{label}</Table.Th>
              <Table.Td>{value}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {warning && (
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={16} />}>
          {warning}
        </Alert>
      )}
    </Stack>
  );
}

/** Wizard that creates or edits a permission rule: behavior, rule pattern, scope and a review of its effect */
export const AddPermissionRuleWizard = memo(function AddPermissionRuleWizard({
  opened,
  onClose,
  onSubmit,
  initialRule,
  knownTools = DEFAULT_PERMISSION_TOOLS,
  scopes = EDITABLE_PERMISSION_SCOPES,
  defaultScope = 'local',
  examples = PERMISSION_RULE_EXAMPLES,
  createId = createPermissionId,
  labels: labelsProp,
}: AddPermissionRuleWizardProps) {
  const labels = useMemo(
    () => ({ ...DEFAULT_ADD_PERMISSION_RULE_WIZARD_LABELS, ...labelsProp }),
    [labelsProp]
  );
  const isEdit = !!initialRule?.id;
  const initialValues = useMemo(
    () => createRuleDraft(initialRule, defaultScope),
    [initialRule, defaultScope]
  );

  const steps = useMemo<WizardStep<PermissionRuleDraft>[]>(
    () => [
      {
        id: 'behavior',
        label: labels.behaviorStep,
        render: ({ values, setValue }) => (
          <Radio.Group
            value={values.behavior}
            onChange={(value) => setValue('behavior', value as PermissionBehavior)}
            aria-label={labels.behaviorStep}
          >
            <Stack gap="xs">
              {PERMISSION_BEHAVIOR_ORDER.map((behavior) => (
                <Radio.Card key={behavior} value={behavior} radius="md" p="sm">
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Radio.Indicator color={PERMISSION_BEHAVIORS[behavior].color} />
                    <Stack gap={2} miw={0}>
                      <Text size="sm" fw={500}>
                        {PERMISSION_BEHAVIORS[behavior].label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {PERMISSION_BEHAVIORS[behavior].description}
                      </Text>
                    </Stack>
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
        ),
      },
      {
        id: 'rule',
        label: labels.ruleStep,
        validate: validateRuleStep,
        render: ({ values, setValue, errors }) => (
          <Stack gap="sm">
            <PermissionRuleInput
              label={labels.rule}
              value={values.rule}
              onChange={(value) => setValue('rule', value)}
              behavior={values.behavior}
              knownTools={knownTools}
              error={errors.rule}
            />
            {examples.length > 0 && (
              <Stack gap={6}>
                <Text size="xs" c="dimmed">
                  {labels.examples}
                </Text>
                <Group gap={6}>
                  {examples.map((example) => (
                    <Button
                      key={example}
                      size="compact-xs"
                      variant="default"
                      radius="xl"
                      ff="monospace"
                      fw={400}
                      onClick={() => setValue('rule', example)}
                    >
                      {example}
                    </Button>
                  ))}
                </Group>
              </Stack>
            )}
          </Stack>
        ),
      },
      {
        id: 'scope',
        label: labels.scopeStep,
        validate: validateScopeStep,
        render: ({ values, setValue, errors }) => (
          <Radio.Group
            value={values.scope}
            onChange={(value) => setValue('scope', value as PermissionScope)}
            aria-label={labels.scopeStep}
            error={errors.scope}
          >
            <Stack gap="xs">
              {scopes.map((scope) => (
                <Radio.Card
                  key={scope}
                  value={scope}
                  radius="md"
                  p="sm"
                  disabled={PERMISSION_SCOPES[scope].readOnly}
                >
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Radio.Indicator />
                    <Stack gap={2} miw={0}>
                      <Text size="sm" fw={500}>
                        {PERMISSION_SCOPES[scope].label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {PERMISSION_SCOPES[scope].description}
                      </Text>
                    </Stack>
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
        ),
      },
    ],
    [examples, knownTools, labels, scopes]
  );

  return (
    <WizardModal<PermissionRuleDraft>
      opened={opened}
      onClose={onClose}
      title={isEdit ? labels.editTitle : labels.addTitle}
      steps={steps}
      initialValues={initialValues}
      review={(values) => <RuleReview values={values} labels={labels} />}
      labels={{ finish: isEdit ? labels.save : labels.add }}
      onComplete={async (values) => {
        await onSubmit(buildPermissionRule(values, initialRule?.id ?? createId(), initialRule));
        onClose();
      }}
    />
  );
});

AddPermissionRuleWizard.displayName = 'AddPermissionRuleWizard';
