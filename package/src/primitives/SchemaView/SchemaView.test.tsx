import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../_testing/element-width';
import type { JsonSchema } from './schema';
import { SchemaView } from './SchemaView';

const SCHEMA: JsonSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', description: 'Search text' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    filters: {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['open', 'closed'] },
        author: {
          type: 'object',
          properties: { login: { type: 'string' } },
        },
      },
    },
  },
};

describe('primitives/SchemaView', () => {
  it('shows the empty state for a schema without properties', () => {
    render(
      <SchemaView schema={{ type: 'object', properties: {} }} labels={{ empty: 'No inputs' }} />
    );
    expect(screen.getByText('No inputs')).toBeInTheDocument();
  });

  it('renders stacked rows when narrow and toggles nested objects', async () => {
    render(<SchemaView schema={SCHEMA} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('query')).toBeInTheDocument();
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.getByText('Search text')).toBeInTheDocument();
    expect(screen.getByText('1 – 100')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('state')).toBeInTheDocument();
    expect(screen.getByText('"closed"')).toBeInTheDocument();
    expect(screen.queryByText('login')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Expand author' }));
    expect(screen.getByText('login')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse filters' }));
    expect(screen.queryByText('state')).not.toBeInTheDocument();
    expect(screen.queryByText('login')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand filters' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('respects defaultExpandedDepth', () => {
    render(<SchemaView schema={SCHEMA} defaultExpandedDepth={0} />);
    expect(screen.queryByText('state')).not.toBeInTheDocument();
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(900);
    });
    afterEach(() => restore());

    it('renders a table with overridable headers', async () => {
      render(<SchemaView schema={SCHEMA} labels={{ name: 'Parameter' }} />);

      const table = await screen.findByRole('table');
      expect(screen.getByRole('columnheader', { name: 'Parameter' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Default' })).toBeInTheDocument();
      expect(table.querySelectorAll('tbody tr')).toHaveLength(5);
      expect(screen.getByRole('row', { name: /limit/ })).toHaveTextContent('integer');
    });
  });
});
