import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import { setElementWidth } from '../../primitives/_testing/element-width';
import { DIFF_FIXTURES, DIFF_SOURCES } from '../fixtures';
import { DiffReview } from './DiffReview';
import { DiffReviewModal } from './DiffReviewModal';

describe('DiffReview', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(1200);
    });
    afterEach(() => restore());

    it('navigates files with buttons and j/k while focus is inside', async () => {
      const onSelectedPathChange = jest.fn();
      render(<DiffReview changes={DIFF_FIXTURES} onSelectedPathChange={onSelectedPathChange} />);

      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous file' })).toBeDisabled();

      await userEvent.keyboard('j');
      expect(onSelectedPathChange).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Next file' }));
      expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/src/types.ts');

      await userEvent.keyboard('j');
      expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/src/invoice.test.ts');
      await userEvent.keyboard('k');
      expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/src/types.ts');

      await userEvent.click(screen.getByRole('textbox', { name: 'Filter files' }));
      await userEvent.keyboard('j');
      expect(onSelectedPathChange).toHaveBeenCalledTimes(3);
    });

    it('scopes hotkeys to the focused review', async () => {
      const first = jest.fn();
      const second = jest.fn();
      render(
        <>
          <DiffReview changes={DIFF_FIXTURES} onSelectedPathChange={first} />
          <DiffReview changes={DIFF_FIXTURES} onSelectedPathChange={second} />
        </>
      );

      const [, secondNext] = await screen.findAllByRole('button', { name: 'Next file' });
      await userEvent.click(secondNext);
      await userEvent.keyboard('j');
      expect(second).toHaveBeenCalledTimes(2);
      expect(first).not.toHaveBeenCalled();
    });

    it('follows the tree order in the tree layout', async () => {
      const onSelectedPathChange = jest.fn();
      render(
        <DiffReview
          changes={DIFF_FIXTURES}
          defaultView="tree"
          onSelectedPathChange={onSelectedPathChange}
        />
      );

      const previous = await screen.findByRole('button', { name: 'Previous file' });
      expect(previous).toBeEnabled();
      await userEvent.click(previous);
      expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/src/invoice.test.ts');
      await userEvent.keyboard('k');
      expect(onSelectedPathChange).toHaveBeenLastCalledWith(
        'packages/billing/src/legacy/fetch-totals.ts'
      );
    });

    it('switches between change sources and opens the first file', async () => {
      const onSourceChange = jest.fn();
      const onSelectedPathChange = jest.fn();
      render(
        <DiffReview
          sources={DIFF_SOURCES}
          onSourceChange={onSourceChange}
          onSelectedPathChange={onSelectedPathChange}
        />
      );

      expect(await screen.findByText('0 / 9 viewed')).toBeInTheDocument();
      await userEvent.click(await screen.findByRole('radio', { name: 'Turn 2 (1)' }));
      expect(onSourceChange).toHaveBeenCalledWith('turn-2');
      expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/package.json');
      expect(screen.getByText('0 / 1 viewed')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(1);
    });

    it('opens the first file once changes arrive after loading', async () => {
      const { rerender } = render(<DiffReview changes={[]} loading />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      rerender(<DiffReview changes={DIFF_FIXTURES} />);
      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous file' })).toBeDisabled();
    });

    it('marks files as viewed and counts them', async () => {
      const onViewedPathsChange = jest.fn();
      render(<DiffReview changes={DIFF_FIXTURES} onViewedPathsChange={onViewedPathsChange} />);

      expect(await screen.findByText('0 / 7 viewed')).toBeInTheDocument();
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Viewed' }));
      expect(screen.getByText('1 / 7 viewed')).toBeInTheDocument();
      expect(onViewedPathsChange).toHaveBeenLastCalledWith(['packages/billing/src/invoice.ts']);
    });

    it('accepts a file and shows a rejected bulk action', async () => {
      let resolve: () => void = () => {};
      const onAccept = jest.fn(() => new Promise<void>((done) => (resolve = done)));
      const onRejectAll = jest.fn().mockRejectedValue(new Error('Working tree is dirty'));
      render(
        <DiffReview
          changes={DIFF_FIXTURES}
          onAccept={onAccept}
          onReject={jest.fn()}
          onAcceptAll={jest.fn()}
          onRejectAll={onRejectAll}
        />
      );

      await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      expect(onAccept).toHaveBeenCalledWith(DIFF_FIXTURES[0]);
      expect(screen.getByRole('button', { name: 'Accept' })).toHaveAttribute(
        'data-loading',
        'true'
      );
      await act(async () => resolve());

      await userEvent.click(screen.getByRole('button', { name: 'Reject all' }));
      expect(await screen.findByText('Working tree is dirty')).toBeInTheDocument();
    });
  });

  it('renders a header and marks the file search for autofocus', () => {
    render(
      <DiffReview changes={DIFF_FIXTURES} header={<h2>Changes</h2>} compact withHotkeys={false} />
    );
    expect(screen.getByRole('heading', { name: 'Changes' })).toBeInTheDocument();
    const toolbarRow = screen.getByRole('button', { name: 'Next file' }).closest('[data-compact]');
    expect(toolbarRow).toContainElement(screen.getByRole('heading', { name: 'Changes' }));
    expect(document.querySelector('[data-autofocus="true"]')).toContainElement(
      screen.getByRole('button', { name: 'Filter files' })
    );
  });

  it('hides the source switcher until the width is measured', () => {
    render(<DiffReview sources={DIFF_SOURCES} withHotkeys={false} />);
    const input = document.querySelector('input[aria-label="Changes"]');
    expect(input?.closest('[data-measuring="true"]')).not.toBeNull();
  });

  it('opens a file from the list when narrow and goes back', async () => {
    render(<DiffReview changes={DIFF_FIXTURES} withHotkeys={false} />);

    await userEvent.click(screen.getByRole('option', { name: /package\.json/ }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getAllByText('package.json', { selector: 'span' }).filter((node) => {
        return !node.closest('[hidden]');
      })
    ).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'All files' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders inside a modal and handles hotkeys there', async () => {
    const onSelectedPathChange = jest.fn();
    render(
      <DiffReviewModal
        opened
        onClose={jest.fn()}
        changes={DIFF_FIXTURES}
        onSelectedPathChange={onSelectedPathChange}
      />
    );
    expect(await screen.findByText('Review changes')).toBeInTheDocument();
    expect(screen.getByText('0 / 7 viewed')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Modal-inner')).toHaveClass('ae-overlay-inner');

    await userEvent.click(screen.getByText('0 / 7 viewed'));
    await userEvent.keyboard('j');
    expect(onSelectedPathChange).toHaveBeenLastCalledWith('packages/billing/src/types.ts');
  });
});
