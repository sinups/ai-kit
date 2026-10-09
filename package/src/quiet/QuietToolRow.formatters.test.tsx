import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToolPresentationProvider } from '../tools/tool-presentation';
import { QuietToolRow } from './QuietToolRow';
import { AgentChat } from '../AgentChat/AgentChat';
import { quietPresentation } from './quiet-presentation';

const part = {
  type: 'tool-mcp__layers__search',
  toolCallId: 'search',
  state: 'output-available' as const,
  input: { query: 'Team plan' },
  output: { internalId: 'internal-payload-should-not-appear', title: 'Team plan' },
};

it('renders host summaries as prose, without raw payloads or code panels', () => {
  const { container } = render(
    <MantineProvider>
      <ToolPresentationProvider
        catalog={{ mcp__layers__search: { title: 'Search pages' } }}
        args={{ 'tool-*': () => 'Query: Team plan' }}
        outputs={{ 'tool-*': () => 'Found one page' }}
      >
        <QuietToolRow part={part} />
      </ToolPresentationProvider>
    </MantineProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Search pages/ }));
  expect(screen.getByText('Query: Team plan')).toBeVisible();
  expect(container.querySelector('[data-code-block]')).toBeNull();
  expect(container.textContent).not.toContain('internal-payload-should-not-appear');
});

it('lets host result components replace the raw result, rather than duplicating it', () => {
  const { container } = render(
    <MantineProvider>
      <ToolPresentationProvider
        catalog={{ mcp__layers__search: { title: 'Search pages' } }}
        outputs={{ 'tool-*': () => <a href="/space/pages/plan">Team plan</a> }}
      >
        <QuietToolRow part={part} />
      </ToolPresentationProvider>
    </MantineProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Search pages/ }));
  expect(screen.getByRole('link')).toHaveAttribute('href', '/space/pages/plan');
  expect(container.textContent).not.toContain('internal-payload-should-not-appear');
});

it('preserves the host permission preview and one approval footer in quiet mode', () => {
  render(
    <MantineProvider>
      <AgentChat
        messages={[
          {
            id: 'a',
            role: 'assistant',
            parts: [{ ...part, state: 'input-available', output: undefined }],
          },
        ]}
        status="streaming"
        onSend={() => {}}
        onStop={() => {}}
        presentation={quietPresentation}
        toolRenderers={{ [part.type]: () => <p>Create a private team page</p> }}
        approvals={{
          search: {
            isPending: true,
            onApprove: () => {},
            onReject: () => {},
            labels: { approve: 'Allow once' },
          },
        }}
      />
    </MantineProvider>
  );
  expect(screen.getByText('Create a private team page')).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Allow once' })).toHaveLength(1);
});
