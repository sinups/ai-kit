import React from 'react';
import { Stack } from '@mantine/core';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { JsonSchema } from './schema';
import { SchemaView } from './SchemaView';

export default { title: 'primitives/SchemaView' };

const CREATE_ISSUE: JsonSchema = {
  type: 'object',
  required: ['repo', 'title'],
  properties: {
    repo: { type: 'string', description: 'Repository in owner/name form' },
    title: { type: 'string', description: 'Issue title' },
    body: { type: ['string', 'null'], description: 'Markdown body' },
    priority: {
      description: 'How urgent the issue is',
      oneOf: [{ const: 'low' }, { const: 'medium' }, { const: 'high' }],
      default: 'medium',
    },
    estimate: { type: 'integer', minimum: 1, maximum: 13, description: 'Story points' },
    due: { type: 'string', format: 'date', description: 'Due date' },
    labels: { type: 'array', items: { type: 'string' }, default: [] },
    assignee: {
      type: 'object',
      description: 'Who works on it',
      required: ['login'],
      properties: {
        login: { type: 'string' },
        notify: { type: 'boolean', default: true },
        team: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            role: { type: 'string', enum: ['member', 'lead'] },
          },
        },
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
    target: {
      description: 'Where to file the issue',
      anyOf: [
        { title: 'Project', type: 'object', properties: { projectId: { type: 'string' } } },
        { title: 'Milestone', type: 'object', properties: { milestone: { type: 'integer' } } },
      ],
    },
  },
};

export function Usage() {
  return (
    <Stack p="xl" maw={960}>
      <SchemaView schema={CREATE_ISSUE} />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <SchemaView schema={CREATE_ISSUE} />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaView schema={CREATE_ISSUE} />
    </WidthFrame>
  );
}

export function FullyExpanded() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaView schema={CREATE_ISSUE} defaultExpandedDepth={Infinity} />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <SchemaView schema={{ type: 'object', properties: {} }} />
    </WidthFrame>
  );
}

export function ExpandFlow() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <SchemaView schema={CREATE_ISSUE} />
    </WidthFrame>
  );
}

ExpandFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(await canvas.findByText('login')).toBeInTheDocument();
  await expect(canvas.queryByText('slug')).not.toBeInTheDocument();

  const expandTeam = await canvas.findByRole('button', { name: 'Expand team' });
  await expect(expandTeam).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(expandTeam);
  await expect(await canvas.findByText('slug')).toBeInTheDocument();
  await expect(canvas.getByText('role')).toBeInTheDocument();
  await expect(canvas.getByRole('button', { name: 'Collapse team' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );

  await userEvent.click(canvas.getByRole('button', { name: 'Collapse assignee' }));
  await waitFor(() => expect(canvas.queryByText('login')).not.toBeInTheDocument());
  await expect(canvas.queryByText('slug')).not.toBeInTheDocument();
};
