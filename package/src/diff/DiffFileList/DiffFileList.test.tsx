import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { summarizeChanges } from '../file-tree';
import { DIFF_FIXTURES } from '../fixtures';
import { DiffFileList } from './DiffFileList';

describe('DiffFileList', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('lists files with directory, status, counts and a summary', () => {
    render(
      <DiffFileList
        changes={DIFF_FIXTURES}
        selectedPath="packages/billing/src/types.ts"
        viewedPaths={['packages/billing/src/invoice.ts']}
        decisions={{ 'packages/billing/package.json': 'rejected' }}
      />
    );

    expect(screen.getAllByRole('option')).toHaveLength(7);
    expect(screen.getByRole('option', { name: /types\.ts/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('7 files changed')).toBeInTheDocument();
    expect(screen.getByText('docs/billing.md → docs/billing/')).toBeInTheDocument();
    expect(screen.getByLabelText('Deleted')).toHaveTextContent('D');
    expect(screen.getByLabelText('Viewed')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    const { additions, deletions } = summarizeChanges(DIFF_FIXTURES);
    expect(screen.getAllByText(`+${additions}`)).not.toHaveLength(0);
    expect(screen.getAllByText(`−${deletions}`)).not.toHaveLength(0);
  });

  it('filters by path and selects a file', async () => {
    const onSelect = jest.fn();
    render(<DiffFileList changes={DIFF_FIXTURES} onSelect={onSelect} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Filter files' }), 'legacy');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.click(screen.getByRole('option'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ status: 'deleted' }));

    await userEvent.type(screen.getByRole('textbox', { name: 'Filter files' }), 'zzz');
    expect(screen.getByText('No matching files')).toBeInTheDocument();
  });

  it('drops the status filter when no file with that status is left', async () => {
    const { rerender } = render(<DiffFileList changes={DIFF_FIXTURES} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Change status' }));
    await userEvent.click(screen.getByRole('option', { name: /^Deleted \(/ }));
    expect(screen.getAllByRole('option')).toHaveLength(1);

    const remaining = DIFF_FIXTURES.filter((change) => change.status !== 'deleted');
    rerender(<DiffFileList changes={remaining} />);
    expect(screen.getAllByRole('option')).toHaveLength(remaining.length);
  });

  it('shows a folder tree with collapsible folders', async () => {
    const onSelect = jest.fn();
    render(<DiffFileList changes={DIFF_FIXTURES} onSelect={onSelect} defaultView="tree" />);

    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getByText('packages/billing')).toBeInTheDocument();
    expect(screen.getByText('legacy')).toBeInTheDocument();

    await userEvent.click(screen.getByText('packages/billing'));
    expect(screen.queryByText('invoice.ts')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('packages/billing'));
    await userEvent.click(screen.getByText('invoice.ts'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'packages/billing/src/invoice.ts' })
    );
  });

  it('switches the view and reports it', async () => {
    const onViewChange = jest.fn();
    render(<DiffFileList changes={DIFF_FIXTURES} onViewChange={onViewChange} />);
    await userEvent.click(screen.getByText('Tree'));
    expect(onViewChange).toHaveBeenCalledWith('tree');
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('renders empty, loading and error states', async () => {
    const onRetryLoad = jest.fn();
    const { rerender } = render(<DiffFileList changes={[]} />);
    expect(screen.getByText('No changes')).toBeInTheDocument();

    rerender(<DiffFileList changes={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(
      <DiffFileList changes={[]} error="Could not load the diff" onRetryLoad={onRetryLoad} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryLoad).toHaveBeenCalled();
  });

  it('keeps one ghost toolbar row when compact', async () => {
    const onViewChange = jest.fn();
    render(
      <DiffFileList changes={DIFF_FIXTURES} compact searchAutofocus onViewChange={onViewChange} />
    );

    const searchButton = screen.getByRole('button', { name: 'Filter files' });
    expect(searchButton).not.toHaveAttribute('data-autofocus');
    const focusTarget = document.querySelector('[data-autofocus="true"]');
    expect(focusTarget).toHaveAttribute('tabindex', '-1');
    expect(focusTarget).toContainElement(searchButton);
    expect(screen.getByText('7 files changed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tree' }));
    expect(onViewChange).toHaveBeenCalledWith('tree');
    expect(screen.getByRole('button', { name: 'Tree' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(searchButton);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter files' }), 'zzz');
    expect(screen.getByText('No matching files')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close search' }));
    expect(screen.queryByRole('textbox', { name: 'Filter files' })).not.toBeInTheDocument();
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });
});
