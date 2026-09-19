import React from 'react';
import { Stack } from '@mantine/core';
import { expect, userEvent, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { JsonSchema } from './schema';
import { SchemaValues } from './SchemaValues';

export default { title: 'Primitives/SchemaValues' };

const CREATE_ISSUE: JsonSchema = {
  type: 'object',
  required: ['repo', 'title'],
  properties: {
    repo: { type: 'string', description: 'Repository in owner/name form' },
    title: { type: 'string', description: 'Issue title' },
    body: { type: ['string', 'null'], description: 'Markdown body' },
    estimate: { type: 'integer', minimum: 1, maximum: 13, description: 'Story points' },
    labels: { type: 'array', items: { type: 'string' }, description: 'Labels to apply' },
    assignee: {
      type: 'object',
      description: 'Who works on it',
      required: ['login'],
      properties: {
        login: { type: 'string' },
        notify: { type: 'boolean' },
      },
    },
    attachments: {
      type: 'array',
      description: 'Files to attach',
      items: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string', format: 'uri' }, name: { type: 'string' } },
      },
    },
    apiToken: { type: 'string', description: 'Token used to file the issue' },
  },
};

const ARGUMENTS = {
  repo: 'sinups/ai-kit',
  title: 'Retry the token refresh once before failing the request',
  body: 'The refresh call fails on a cold start because the clock skew check rejects a token that is still valid. '.repeat(
    3
  ),
  labels: ['bug', 'auth'],
  assignee: { login: 'sinups', notify: true },
  attachments: [{ url: 'https://example.com/trace.json', name: 'trace.json' }],
  apiToken: 'ghp_exampleexampleexample',
  draft: true,
};

export function Usage() {
  return (
    <Stack p="xl" maw={960}>
      <SchemaValues schema={CREATE_ISSUE} values={ARGUMENTS} />
    </Stack>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaValues schema={CREATE_ISSUE} values={ARGUMENTS} />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <SchemaValues schema={CREATE_ISSUE} values={ARGUMENTS} />
    </WidthFrame>
  );
}

export function OnlyProvided() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaValues schema={CREATE_ISSUE} values={ARGUMENTS} hideMissing />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <SchemaValues schema={{ type: 'object', properties: {} }} values={{}} />
    </WidthFrame>
  );
}

export function RevealFlow() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaValues schema={CREATE_ISSUE} values={ARGUMENTS} />
    </WidthFrame>
  );
}

RevealFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const reveal = await canvas.findByRole('button', { name: 'Show value: apiToken' });
  await expect(canvas.getByText('••••••••')).toBeVisible();

  await userEvent.click(reveal);
  await expect(await canvas.findByText('ghp_exampleexampleexample')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Show more' }));
  await expect(await canvas.findByText('Show less')).toBeInTheDocument();
};
