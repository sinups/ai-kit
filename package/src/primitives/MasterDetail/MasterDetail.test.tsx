import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { setElementWidth } from '../_testing/element-width';
import { MasterDetail } from './MasterDetail';

describe('MasterDetail', () => {
  describe('narrow', () => {
    it('shows only the list while nothing is selected', () => {
      render(<MasterDetail list={<div>Item list</div>} detail={null} />);
      expect(screen.getByText('Item list')).toBeInTheDocument();
      expect(screen.getByText('Select an item')).not.toBeVisible();
    });

    it('replaces the list with the detail and goes back', async () => {
      const onBack = jest.fn();
      render(
        <MasterDetail list={<div>Item list</div>} detail={<div>Item detail</div>} onBack={onBack} />
      );

      expect(screen.getByText('Item list')).not.toBeVisible();
      expect(screen.getByText('Item detail')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('keeps the list when detailOpen is false', () => {
      render(
        <MasterDetail
          list={<div>Item list</div>}
          detail={<div>Item detail</div>}
          detailOpen={false}
        />
      );
      expect(screen.getByText('Item list')).toBeInTheDocument();
      expect(screen.getByText('Item detail')).not.toBeVisible();
    });
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(1000);
    });
    afterEach(() => restore());

    it('shows both panes without a back button', async () => {
      render(
        <MasterDetail
          list={<div>Item list</div>}
          detail={<div>Item detail</div>}
          onBack={() => {}}
          backLabel="Return"
        />
      );

      expect(await screen.findByText('Item list')).toBeInTheDocument();
      expect(screen.getByText('Item detail')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Return', hidden: true })).not.toBeVisible()
      );
    });

    it('shows the empty state when nothing is selected', async () => {
      const { rerender } = render(<MasterDetail list={<div>Item list</div>} detail={null} />);
      expect(await screen.findByText('Select an item')).toBeInTheDocument();

      rerender(
        <MasterDetail list={<div>Item list</div>} detail={null} emptyTitle="Nothing selected" />
      );
      expect(await screen.findByText('Nothing selected')).toBeInTheDocument();

      rerender(
        <MasterDetail list={<div>Item list</div>} detail={null} emptyDetail="Pick a server" />
      );
      expect(await screen.findByText('Pick a server')).toBeInTheDocument();
    });

    it('uses a splitter when resizable', async () => {
      render(<MasterDetail list="Item list" detail="Item detail" resizable />);
      expect(await screen.findByRole('separator')).toBeInTheDocument();
      expect(screen.getByText('Item detail')).toBeInTheDocument();
    });
  });

  it('keeps the resizable panes mounted when the layout switches', async () => {
    const onMount = jest.fn();
    function Detail() {
      React.useEffect(onMount, []);
      return <div>Item detail</div>;
    }
    function Resizable() {
      const [wide, setWide] = React.useState(false);
      return (
        <div>
          <button type="button" onClick={() => setWide(true)}>
            Widen
          </button>
          <MasterDetail
            resizable
            breakpoint={wide ? 0 : 100000}
            list={<div>Item list</div>}
            detail={<Detail />}
          />
        </div>
      );
    }
    const restore = setElementWidth(800);
    try {
      const { container } = render(<Resizable />);
      await waitFor(() => expect(container.querySelector('[data-layout="narrow"]')).not.toBeNull());
      expect(screen.getByText('Item list')).not.toBeVisible();
      expect(screen.getByText('Item detail')).toBeVisible();

      await userEvent.click(screen.getByRole('button', { name: 'Widen' }));
      await waitFor(() => expect(container.querySelector('[data-layout="wide"]')).not.toBeNull());
      expect(screen.getByText('Item list')).toBeVisible();
      expect(onMount).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it('keeps the same list and detail nodes when the layout switches', async () => {
    function Resizable() {
      const [wide, setWide] = React.useState(false);
      return (
        <div>
          <button type="button" onClick={() => setWide(true)}>
            Widen
          </button>
          <MasterDetail
            breakpoint={wide ? 0 : 100000}
            list={<button type="button">List item</button>}
            detail={<div>Item detail</div>}
            detailOpen={false}
          />
        </div>
      );
    }
    const restore = setElementWidth(800);
    try {
      const { container } = render(<Resizable />);
      const item = await screen.findByRole('button', { name: 'List item' });
      const detail = screen.getByText('Item detail');
      await waitFor(() => expect(container.querySelector('[data-layout="narrow"]')).not.toBeNull());
      expect(detail).not.toBeVisible();

      await userEvent.click(screen.getByRole('button', { name: 'Widen' }));
      await waitFor(() => expect(container.querySelector('[data-layout="wide"]')).not.toBeNull());
      expect(screen.getByRole('button', { name: 'List item' })).toBe(item);
      expect(screen.getByText('Item detail')).toBe(detail);
      expect(detail).toBeVisible();
    } finally {
      restore();
    }
  });
});
