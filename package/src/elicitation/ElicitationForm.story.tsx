import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Code, Stack } from '@mantine/core';
import type { ElicitationRequestedSchema } from './elicitation-schema';
import { ElicitationForm } from './ElicitationForm';

export default { title: 'ElicitationForm' };

function Frame({ children, width = 420 }: { children: React.ReactNode; width?: number }) {
  return (
    <Stack p="xl" maw={width} gap="xl">
      {children}
    </Stack>
  );
}

const DEPLOY_SCHEMA: ElicitationRequestedSchema = {
  type: 'object',
  properties: {
    environment: {
      type: 'string',
      title: 'Environment',
      oneOf: [
        { const: 'staging', title: 'Staging' },
        { const: 'production', title: 'Production' },
      ],
    },
    replicas: { type: 'integer', title: 'Replicas', minimum: 1, maximum: 10, default: 2 },
    notify: { type: 'string', title: 'Notify email', format: 'email' },
    date: { type: 'string', title: 'Release date', format: 'date' },
    dryRun: { type: 'boolean', title: 'Dry run', default: true },
    regions: {
      type: 'array',
      title: 'Regions',
      minItems: 1,
      items: { enum: ['eu', 'us', 'ap'], enumNames: ['Europe', 'United States', 'Asia Pacific'] },
    },
  },
  required: ['environment', 'regions'],
};

export function Form() {
  const [result, setResult] = useState<string>('');
  return (
    <Frame>
      <ElicitationForm
        serverName="deploy-server"
        message="Choose where to deploy the new build."
        requestedSchema={DEPLOY_SCHEMA}
        onAccept={(content) => setResult(JSON.stringify({ action: 'accept', content }, null, 2))}
        onDecline={() => setResult('{ "action": "decline" }')}
        onCancel={() => setResult('{ "action": "cancel" }')}
      />
      {result && <Code block>{result}</Code>}
    </Frame>
  );
}

export function Url() {
  return (
    <Frame>
      <ElicitationForm
        mode="url"
        serverName="files"
        message="Authorize access to your repositories to continue."
        url="https://auth.example.com/login"
        onAccept={() => {}}
        onDecline={() => {}}
      />
    </Frame>
  );
}

export function Disabled() {
  return (
    <Frame>
      <ElicitationForm
        disabled
        message="Waiting for the previous request."
        requestedSchema={DEPLOY_SCHEMA}
      />
    </Frame>
  );
}

export function Narrow() {
  return (
    <Frame width={360}>
      <ElicitationForm
        serverName="deploy-server"
        message="Choose where to deploy the new build."
        requestedSchema={DEPLOY_SCHEMA}
        onCancel={() => {}}
      />
    </Frame>
  );
}

export function Wide() {
  return (
    <Frame width={900}>
      <ElicitationForm
        serverName="deploy-server"
        message="Choose where to deploy the new build."
        requestedSchema={DEPLOY_SCHEMA}
        onCancel={() => {}}
      />
    </Frame>
  );
}

type FlowArgs = {
  onAccept: (content: Record<string, unknown>) => void;
  onDecline: () => void;
  onCancel: () => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

const CONTACT_SCHEMA: ElicitationRequestedSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    email: { type: 'string', title: 'Email', format: 'email' },
    notify: { type: 'boolean', title: 'Notify me' },
  },
  required: ['name'],
};

const flowArgs = () => ({ onAccept: fn(), onDecline: fn(), onCancel: fn() });

function FlowForm(args: FlowArgs) {
  return (
    <Frame>
      <ElicitationForm
        serverName="files"
        message="Who should be notified about the release?"
        requestedSchema={CONTACT_SCHEMA}
        onAccept={args.onAccept}
        onDecline={args.onDecline}
        onCancel={args.onCancel}
      />
    </Frame>
  );
}

export const ValidationFlow = {
  args: flowArgs(),
  render: FlowForm,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('Required')).toBeInTheDocument();
    await userEvent.type(canvas.getByLabelText('Email'), 'nope');
    await userEvent.tab();
    await expect(await canvas.findByText('Enter a valid email')).toBeInTheDocument();
    await expect(args.onAccept).not.toHaveBeenCalled();
  },
};

export const AcceptFlow = {
  args: flowArgs(),
  render: FlowForm,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/Name/), 'Ada');
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(canvas.getByLabelText('Notify me'));
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(args.onAccept).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      notify: true,
    });
    await expect(await canvas.findByText('Accepted')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Submit' })).toBeDisabled();
  },
};

export const DeclineCancelFlow = {
  args: flowArgs(),
  render: FlowForm,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Decline' }));
    await expect(args.onDecline).toHaveBeenCalledTimes(1);
    await expect(await canvas.findByText('Declined')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Decline' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(args.onCancel).not.toHaveBeenCalled();
    await expect(args.onAccept).not.toHaveBeenCalled();
  },
};

export const UrlFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Frame>
      <ElicitationForm
        mode="url"
        serverName="files"
        message="Authorize access to your repositories to continue."
        url="https://auth.example.com/login"
        onAccept={args.onAccept}
        onDecline={args.onDecline}
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('auth.example.com')).toBeInTheDocument();
    const link = canvas.getByRole('link', { name: 'Open link' });
    await expect(link).toHaveAttribute('href', 'https://auth.example.com/login');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    await userEvent.click(link);
    await expect(args.onAccept).toHaveBeenCalledWith({});
    await expect(await canvas.findByText('Accepted')).toBeInTheDocument();
  },
};
