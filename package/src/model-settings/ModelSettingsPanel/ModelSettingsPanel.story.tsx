import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Paper } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { DAILY_USAGE, LIMITS, MCP_SERVERS, MODEL_USAGE, MODELS, OUTPUT_STYLES } from '../fixtures';
import type { EffortLevelValue, UsagePeriod } from '../types';
import { ModelSettingsPanel } from './ModelSettingsPanel';

export default { title: 'Settings/ModelSettingsPanel' };

function Demo() {
  const [model, setModel] = useState('qwen-2.5-coder-32b');
  const [effort, setEffort] = useState<EffortLevelValue>('high');
  const [thinking, setThinking] = useState(true);
  const [style, setStyle] = useState('default');
  const [period, setPeriod] = useState<UsagePeriod>('week');

  return (
    <Paper withBorder radius="md" h={640}>
      <ModelSettingsPanel
        models={MODELS}
        model={model}
        onModelChange={setModel}
        effort={{ value: effort, onChange: setEffort, thinking, onThinkingChange: setThinking }}
        outputStyle={{ styles: OUTPUT_STYLES, value: style, onChange: setStyle }}
        usage={{
          period,
          onPeriodChange: setPeriod,
          withTitle: false,
          summary: { tokens: 6_200_000, cost: 67.54, requests: 1_284 },
          limits: LIMITS,
          models: MODEL_USAGE,
          daily: DAILY_USAGE,
        }}
        status={{
          withTitle: false,
          version: '2.1.4',
          model: 'Qwen 2.5 Coder 32B',
          account: { email: 'dev@example.com', plan: 'Max' },
          cwd: '/Users/dev/projects/acme-web',
          mcpServers: MCP_SERVERS,
          context: { used: 142_000, total: 200_000 },
        }}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <WidthFrame width={760}>
      <Demo />
    </WidthFrame>
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

interface NavigationFlowArgs {
  onActiveSectionChange: (section: string) => void;
  onOutputStyleChange: (id: string) => void;
  onPeriodChange: (period: UsagePeriod) => void;
}

export function NavigationFlow(args: NavigationFlowArgs) {
  const [style, setStyle] = useState('default');
  const [period, setPeriod] = useState<UsagePeriod>('week');
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" h={640}>
        <ModelSettingsPanel
          models={MODELS}
          model="qwen-2.5-coder-32b"
          effort={{ value: 'high', onChange: () => {} }}
          outputStyle={{
            styles: OUTPUT_STYLES,
            value: style,
            onChange: (id) => {
              setStyle(id);
              args.onOutputStyleChange(id);
            },
          }}
          usage={{
            period,
            onPeriodChange: (next) => {
              setPeriod(next);
              args.onPeriodChange(next);
            },
            withTitle: false,
            summary: { tokens: 6_200_000, cost: 67.54, requests: 1_284 },
          }}
          status={{ withTitle: false, version: '2.1.4', model: 'Qwen 2.5 Coder 32B' }}
          onActiveSectionChange={args.onActiveSectionChange}
        />
      </Paper>
    </WidthFrame>
  );
}

NavigationFlow.args = {
  onActiveSectionChange: fn(),
  onOutputStyleChange: fn(),
  onPeriodChange: fn(),
};

NavigationFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: NavigationFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const nav = await canvas.findByRole('navigation', { name: 'Settings sections' });
  const section = (name: RegExp) => within(nav).getByRole('button', { name });
  await expect(canvas.getByText('Default model')).toBeInTheDocument();

  await userEvent.click(section(/Output style/));
  await expect(args.onActiveSectionChange).toHaveBeenCalledWith('output-style');
  await userEvent.click(await canvas.findByRole('radio', { name: /Learning/ }));
  await expect(args.onOutputStyleChange).toHaveBeenCalledWith('learning');

  await userEvent.click(section(/Usage/));
  await expect(args.onActiveSectionChange).toHaveBeenLastCalledWith('usage');
  await expect(await canvas.findByText('6.2M')).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('radio', { name: 'Month' }));
  await expect(args.onPeriodChange).toHaveBeenCalledWith('month');

  await userEvent.click(section(/Status/));
  await expect(args.onActiveSectionChange).toHaveBeenLastCalledWith('status');
  await expect(await canvas.findByText('2.1.4')).toBeInTheDocument();

  await userEvent.click(section(/Output style/));
  await expect(await canvas.findByRole('radio', { name: /Learning/ })).toHaveAttribute(
    'aria-checked',
    'true'
  );
};
