import React, { useState } from 'react';
import { act } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { EntityList, type EntityListProps } from './EntityList';
import { EntityListItem } from './EntityListItem';

interface Server {
  id: string;
  name: string;
  transport: string;
  disabled?: boolean;
}

const SERVERS: Server[] = [
  { id: 'repo', name: 'Repository', transport: 'remote' },
  { id: 'files', name: 'Filesystem', transport: 'local' },
  { id: 'tracker', name: 'Tracker', transport: 'remote', disabled: true },
  { id: 'db', name: 'Postgres', transport: 'local' },
];

function renderList(props: Partial<EntityListProps<Server>> = {}) {
  return render(
    <EntityList<Server>
      items={SERVERS}
      getId={(server) => server.id}
      isItemDisabled={(server) => !!server.disabled}
      renderItem={(server, { selected }) => (
        <EntityListItem
          title={server.name}
          selected={selected}
          disabled={server.disabled}
          actions={[{ label: 'Remove', onClick: () => {} }]}
        />
      )}
      ariaLabel="Servers"
      {...props}
    />
  );
}

describe('EntityList', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders options and marks the selected one', () => {
    renderList({ selectedId: 'files' });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('tabindex', '0');
    expect(options[0]).toHaveAttribute('tabindex', '-1');
  });

  it('selects on click but not when the actions menu is used', async () => {
    const onSelect = jest.fn();
    const onRemove = jest.fn();
    render(
      <EntityList<Server>
        items={SERVERS.slice(0, 1)}
        getId={(server) => server.id}
        onSelect={onSelect}
        renderItem={(server) => (
          <EntityListItem title={server.name} actions={[{ label: 'Remove', onClick: onRemove }]} />
        )}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Repository'));
    expect(onSelect).toHaveBeenCalledWith(SERVERS[0]);
  });

  it('does not turn an item with onClick into a nested button', async () => {
    const onSelect = jest.fn();
    const onClick = jest.fn();
    render(
      <EntityList<Server>
        items={SERVERS.slice(0, 1)}
        getId={(server) => server.id}
        onSelect={onSelect}
        renderItem={(server) => <EntityListItem title={server.name} onClick={onClick} />}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Repository'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('moves focus with arrows, skips disabled items and selects with Enter', async () => {
    const onSelect = jest.fn();
    renderList({ onSelect });
    const options = screen.getAllByRole('option');

    act(() => options[0].focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(options[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(options[3]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(options[3]).toHaveFocus();
    await userEvent.keyboard('{Home}{Enter}');
    expect(options[0]).toHaveFocus();
    expect(onSelect).toHaveBeenCalledWith(SERVERS[0]);
  });

  it('filters with the search filter and shows no results', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <EntityList<Server>
          items={SERVERS}
          getId={(server) => server.id}
          renderItem={(server) => <EntityListItem title={server.name} />}
          search={{
            value,
            onChange: setValue,
            placeholder: 'Search servers',
            filter: (server, query) => server.name.toLowerCase().includes(query.toLowerCase()),
          }}
          noResults="Nothing matches"
        />
      );
    }
    render(<Controlled />);

    await userEvent.type(screen.getByPlaceholderText('Search servers'), 'repo');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.type(screen.getByPlaceholderText('Search servers'), 'zzz');
    expect(screen.getByText('Nothing matches')).toBeInTheDocument();
  });

  it('renders group headers in groupOrder', () => {
    renderList({ groupBy: (server) => server.transport, groupOrder: ['local'] });
    const groups = screen.getAllByRole('group');
    expect(groups[0]).toHaveAccessibleName('local');
    expect(groups[1]).toHaveAccessibleName('remote');
  });

  it('renders loading, error and empty states', async () => {
    const onRetry = jest.fn();
    const { rerender } = renderList({ loading: true });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    rerender(
      <EntityList<Server>
        items={SERVERS}
        getId={(server) => server.id}
        renderItem={(server) => <EntityListItem title={server.name} />}
        error="Failed to load"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <EntityList<Server>
        items={[]}
        getId={(server) => server.id}
        renderItem={(server) => <EntityListItem title={server.name} />}
        empty={{
          title: 'No servers',
          description: 'Add one',
          action: <button type="button">Add</button>,
        }}
      />
    );
    expect(screen.getByText('No servers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('reports filter changes through the select on a narrow list', async () => {
    const onChange = jest.fn();
    renderList({
      filters: {
        value: 'all',
        onChange,
        options: [
          { value: 'all', label: 'All', count: 4 },
          { value: 'local', label: 'Local', count: 2 },
        ],
      },
    });

    await userEvent.click(screen.getByRole('combobox', { name: 'Filter' }));
    await userEvent.click(await screen.findByText('Local (2)'));
    expect(onChange).toHaveBeenCalledWith('local');
  });
});
