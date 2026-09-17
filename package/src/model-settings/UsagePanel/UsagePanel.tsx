import React, { memo } from 'react';
import {
  Alert,
  Button,
  EmptyState,
  Group,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  type MantineColor,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconAlertCircle, IconChartBar } from '@tabler/icons-react';
import { formatTokens } from '../../utils/format-tokens';
import type { DailyUsage, ModelUsage, UsageLimit, UsagePeriod, UsageSummary } from '../types';
import {
  formatCost,
  formatLimitValue,
  formatResetIn,
  formatUsageDay,
  getRatio,
  getRelativePercents,
  getUsageLevel,
  sortDailyUsage,
  type UsageLevel,
} from '../usage';
import classes from './UsagePanel.module.css';

export interface UsagePanelLabels {
  title: string;
  periods: Record<UsagePeriod, string>;
  periodLabel: string;
  tokens: string;
  cost: string;
  requests: string;
  limits: string;
  byModel: string;
  byDay: string;
  model: string;
  resetsIn: (duration: string) => string;
  empty: string;
  emptyDescription: string;
  retry: string;
}

const DEFAULT_LABELS: UsagePanelLabels = {
  title: 'Usage',
  periods: { day: 'Day', week: 'Week', month: 'Month' },
  periodLabel: 'Period',
  tokens: 'Tokens',
  cost: 'Cost',
  requests: 'Requests',
  limits: 'Plan limits',
  byModel: 'By model',
  byDay: 'By day',
  model: 'Model',
  resetsIn: (duration) => `Resets in ${duration}`,
  empty: 'No usage yet',
  emptyDescription: 'Usage appears here after the first conversation in this period',
  retry: 'Retry',
};

const LEVEL_COLOR: Record<UsageLevel, MantineColor> = {
  normal: 'blue',
  warning: 'yellow',
  danger: 'red',
};

export interface UsagePanelProps {
  /** Selected period */
  period: UsagePeriod;
  /** Called with the picked period; the period switch is hidden when omitted */
  onPeriodChange?: (period: UsagePeriod) => void;
  /** Periods offered by the switch, `day`, `week`, `month` by default */
  periods?: UsagePeriod[];
  /** Totals of the period */
  summary?: UsageSummary;
  /** Plan limits with their progress */
  limits?: UsageLimit[];
  /** Usage split by model */
  models?: ModelUsage[];
  /** Usage per day, rendered as horizontal bars */
  daily?: DailyUsage[];
  /** Ratio of a limit at which its bar turns yellow, `0.75` by default */
  warnAt?: number;
  /** Ratio of a limit at which its bar turns red, `0.9` by default */
  dangerAt?: number;
  /** Currency of all costs, `USD` by default */
  currency?: string;
  /** Shows skeletons instead of data */
  loading?: boolean;
  /** Error message shown instead of data */
  error?: React.ReactNode;
  /** Adds a retry button to the error */
  onRetry?: () => void;
  /** Time used to compute reset countdowns, the current time by default */
  now?: Date;
  /** Locale of numbers, costs, dates and durations, `en-US` by default */
  locale?: string;
  /** Hides the heading */
  withoutTitle?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<UsagePanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="md" fw={500} className={classes.stat}>
        {value}
      </Text>
    </Stack>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Title order={4} size="h6">
      {children}
    </Title>
  );
}

/** Token and cost usage for a period: totals, plan limits, split by model and by day */
export const UsagePanel = memo(function UsagePanel({
  period,
  onPeriodChange,
  periods = ['day', 'week', 'month'],
  summary,
  limits = [],
  models = [],
  daily = [],
  warnAt = 0.75,
  dangerAt = 0.9,
  currency = 'USD',
  loading = false,
  error,
  onRetry,
  now,
  locale = 'en-US',
  withoutTitle = false,
  labels: labelsProp,
  className,
  style,
}: UsagePanelProps) {
  const labels = {
    ...DEFAULT_LABELS,
    ...labelsProp,
    periods: { ...DEFAULT_LABELS.periods, ...labelsProp?.periods },
  };
  const { ref, width } = useElementSize();
  const isNarrow = width > 0 && width < 420;
  const summaryCurrency = summary?.currency ?? currency;
  const hasModelCost = models.some((item) => item.cost !== undefined);

  const header =
    !withoutTitle || onPeriodChange ? (
      <Group justify="space-between" gap="sm">
        {!withoutTitle && (
          <Title order={3} size="h5">
            {labels.title}
          </Title>
        )}
        {onPeriodChange && (
          <SegmentedControl
            size="xs"
            aria-label={labels.periodLabel}
            value={period}
            onChange={(value) => onPeriodChange(value as UsagePeriod)}
            data={periods.map((value) => ({ value, label: labels.periods[value] }))}
          />
        )}
      </Group>
    ) : null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack gap="md" aria-busy="true">
        <SimpleGrid cols={2} spacing="sm">
          <Skeleton height={56} radius="md" />
          <Skeleton height={56} radius="md" />
        </SimpleGrid>
        <Skeleton height={8} radius="xl" />
        <Skeleton height={8} width="70%" radius="xl" />
        <Skeleton height={120} radius="md" />
      </Stack>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="light" color="red" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else if (
    (!summary || summary.tokens === 0) &&
    limits.length === 0 &&
    models.length === 0 &&
    daily.length === 0
  ) {
    body = (
      <EmptyState
        size="sm"
        py="lg"
        icon={<IconChartBar size={24} />}
        title={labels.empty}
        description={labels.emptyDescription}
      />
    );
  } else {
    const modelPercents = getRelativePercents(models.map((item) => item.tokens));
    const days = sortDailyUsage(daily);
    const dayPercents = getRelativePercents(days.map((day) => day.tokens));

    body = (
      <Stack gap="lg">
        {summary && (
          <SimpleGrid type="container" cols={{ base: 2, '520px': 3 }} spacing="sm">
            <Stat label={labels.tokens} value={formatTokens(summary.tokens)} />
            {summary.cost !== undefined && (
              <Stat label={labels.cost} value={formatCost(summary.cost, summaryCurrency, locale)} />
            )}
            {summary.requests !== undefined && (
              <Stat label={labels.requests} value={summary.requests.toLocaleString(locale)} />
            )}
          </SimpleGrid>
        )}

        {limits.length > 0 && (
          <Stack gap="sm">
            <SectionTitle>{labels.limits}</SectionTitle>
            {limits.map((limit) => {
              const level = getUsageLevel(limit.used, limit.limit, warnAt, dangerAt);
              const reset = formatResetIn(limit.resetsAt, now, locale);
              const percent = Math.round(getRatio(limit.used, limit.limit) * 100);
              return (
                <Stack key={limit.id} gap={4} data-level={level}>
                  <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Text size="sm" truncate="end" miw={0}>
                      {limit.label}
                    </Text>
                    <Text size="xs" c="dimmed" className={classes.numeric}>
                      {formatLimitValue(limit.used, limit.unit, currency, locale)} /{' '}
                      {formatLimitValue(limit.limit, limit.unit, currency, locale)} · {percent}%
                    </Text>
                  </Group>
                  <Progress
                    value={percent}
                    color={LEVEL_COLOR[level]}
                    size="sm"
                    aria-label={limit.label}
                  />
                  {reset && (
                    <Text size="xs" c="dimmed">
                      {labels.resetsIn(reset)}
                    </Text>
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}

        {models.length > 0 && (
          <Stack gap="xs">
            <SectionTitle>{labels.byModel}</SectionTitle>
            <Table verticalSpacing={6} horizontalSpacing="xs" layout="fixed" withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{labels.model}</Table.Th>
                  <Table.Th className={classes.numeric} w="25%">
                    {labels.tokens}
                  </Table.Th>
                  {hasModelCost && !isNarrow && (
                    <Table.Th className={classes.numeric} w="20%">
                      {labels.cost}
                    </Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {models.map((item, index) => (
                  <Table.Tr key={item.model}>
                    <Table.Td className={classes.modelCell}>
                      <Stack gap={4}>
                        <Text size="sm" truncate="end">
                          {item.model}
                        </Text>
                        <Progress value={modelPercents[index]} size="xs" aria-hidden />
                      </Stack>
                    </Table.Td>
                    <Table.Td className={classes.numeric}>
                      <Text size="sm">{formatTokens(item.tokens)}</Text>
                      {hasModelCost && isNarrow && item.cost !== undefined && (
                        <Text size="xs" c="dimmed">
                          {formatCost(item.cost, currency, locale)}
                        </Text>
                      )}
                    </Table.Td>
                    {hasModelCost && !isNarrow && (
                      <Table.Td className={classes.numeric}>
                        <Text size="sm">
                          {item.cost === undefined ? '—' : formatCost(item.cost, currency, locale)}
                        </Text>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}

        {days.length > 0 && (
          <Stack gap={6}>
            <SectionTitle>{labels.byDay}</SectionTitle>
            {days.map((day, index) => {
              const dayLabel = formatUsageDay(day.date, locale);
              return (
                <Group key={String(day.date)} gap="xs" wrap="nowrap">
                  <Text size="xs" c="dimmed" className={classes.dayLabel}>
                    {dayLabel}
                  </Text>
                  <Progress
                    value={dayPercents[index]}
                    size="md"
                    flex={1}
                    aria-label={`${dayLabel}: ${formatTokens(day.tokens)}`}
                  />
                  <Text size="xs" className={classes.dayValue}>
                    {formatTokens(day.tokens)}
                  </Text>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Stack ref={ref} gap="md" className={className} style={style}>
      {header}
      {body}
    </Stack>
  );
});

UsagePanel.displayName = 'UsagePanel';
