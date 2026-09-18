import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../_testing/element-width';
import type { JsonSchema } from './schema';
import { SchemaValues } from './SchemaValues';

const SCHEMA: JsonSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', description: 'Search text' },
    limit: { type: 'integer' },
    filters: {
      type: 'object',
      properties: { state: { type: 'string' } },
    },
    apiToken: { type: 'string' },
  },
};

const VALUES = {
  query: 'refresh token',
  filters: { state: 'open' },
  apiToken: 'ghp_secret',
  debug: 1,
};

describe('primitives/SchemaValues', () => {
  it('shows the empty state when there is nothing to render', () => {
    render(
      <SchemaValues
        schema={{ type: 'object', properties: {} }}
        values={{}}
        labels={{ empty: 'No arguments' }}
      />
    );
    expect(screen.getByText('No arguments')).toBeInTheDocument();
  });

  it('renders values with their names, marks and nesting', async () => {
    render(<SchemaValues schema={SCHEMA} values={VALUES} />);

    expect(screen.getByText('refresh token')).toBeInTheDocument();
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.getByText('extra')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getByText('1 keys')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse filters' }));
    expect(screen.queryByText('open')).not.toBeInTheDocument();
  });

  it('masks a credential-looking value until it is revealed', async () => {
    render(<SchemaValues schema={SCHEMA} values={VALUES} />);

    expect(screen.queryByText('ghp_secret')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show value: apiToken' }));
    expect(screen.getByText('ghp_secret')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Hide value: apiToken' }));
    expect(screen.queryByText('ghp_secret')).not.toBeInTheDocument();
  });

  it('truncates a long value behind a toggle', async () => {
    const long = 'a'.repeat(40);
    render(<SchemaValues schema={SCHEMA} values={{ query: long }} maxValueLength={10} />);

    expect(screen.getByText(`${'a'.repeat(10)}…`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it('hides missing optional fields on request', () => {
    render(<SchemaValues schema={SCHEMA} values={VALUES} hideMissing />);
    expect(screen.queryByText('Not set')).not.toBeInTheDocument();
    expect(screen.queryByText('limit')).not.toBeInTheDocument();
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(900);
    });
    afterEach(() => restore());

    it('renders a table with overridable headers', async () => {
      render(<SchemaValues schema={SCHEMA} values={VALUES} labels={{ value: 'Argument' }} />);

      await screen.findByRole('table');
      expect(screen.getByRole('columnheader', { name: 'Argument' })).toBeInTheDocument();
      expect(screen.getByRole('row', { name: /query/ })).toHaveTextContent('refresh token');
    });
  });
});
