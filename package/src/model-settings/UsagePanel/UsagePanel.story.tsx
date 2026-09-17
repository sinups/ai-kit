import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { DAILY_USAGE, LIMITS, MODEL_USAGE } from '../fixtures';
import type { UsagePeriod } from '../types';
import { UsagePanel } from './UsagePanel';

export default { title: 'model-settings/UsagePanel' };

function Demo() {
  const [period, setPeriod] = useState<UsagePeriod>('week');
  return (
    <UsagePanel
      period={period}
      onPeriodChange={setPeriod}
      summary={{ tokens: 6_200_000, cost: 67.54, requests: 1_284 }}
      limits={LIMITS}
      models={MODEL_USAGE}
      daily={DAILY_USAGE}
    />
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <Stack p="xl" maw={640}>
      <UsagePanel period="week" onPeriodChange={() => {}} loading />
    </Stack>
  );
}

export function Error() {
  return (
    <Stack p="xl" maw={640}>
      <UsagePanel
        period="week"
        onPeriodChange={() => {}}
        error="Usage data is temporarily unavailable"
        onRetry={() => {}}
      />
    </Stack>
  );
}

export function Empty() {
  return (
    <Stack p="xl" maw={640}>
      <UsagePanel period="day" onPeriodChange={() => {}} summary={{ tokens: 0 }} />
    </Stack>
  );
}

const PERIOD_SUMMARY: Record<UsagePeriod, { tokens: number; cost: number; requests: number }> = {
  day: { tokens: 820_000, cost: 9.1, requests: 140 },
  week: { tokens: 6_200_000, cost: 67.54, requests: 1_284 },
  month: { tokens: 24_800_000, cost: 271.3, requests: 5_120 },
};

interface PeriodsFlowArgs {
  onPeriodChange: (period: UsagePeriod) => void;
}

export function PeriodsFlow(args: PeriodsFlowArgs) {
  const [period, setPeriod] = useState<UsagePeriod>('week');
  return (
    <Stack p="xl" maw={640}>
      <UsagePanel
        period={period}
        onPeriodChange={(next) => {
          setPeriod(next);
          args.onPeriodChange(next);
        }}
        summary={PERIOD_SUMMARY[period]}
        models={MODEL_USAGE}
      />
    </Stack>
  );
}

PeriodsFlow.args = { onPeriodChange: fn() };

PeriodsFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: PeriodsFlowArgs;
}) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('6.2M')).toBeInTheDocument();
  await expect(canvas.getByText('$67.54')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('radio', { name: 'Day' }));
  await expect(args.onPeriodChange).toHaveBeenCalledWith('day');
  await expect(await canvas.findByText('820k')).toBeInTheDocument();
  await expect(canvas.getByText('$9.10')).toBeInTheDocument();
  await expect(canvas.getByText('140')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('radio', { name: 'Month' }));
  await expect(args.onPeriodChange).toHaveBeenLastCalledWith('month');
  await expect(await canvas.findByText('24.8M')).toBeInTheDocument();
  await expect(canvas.getByText('5,120')).toBeInTheDocument();
  await expect(canvas.queryByText('820k')).not.toBeInTheDocument();
};
