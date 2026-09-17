import React from 'react';
import { act } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { skills } from './fixtures';
import { SkillCatalog } from './SkillCatalog';

function controllableResizeObserver() {
  const original = window.ResizeObserver;
  const observed: Array<{ callback: ResizeObserverCallback; target: Element }> = [];
  class ManualObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      observed.push({ callback: this.callback, target });
    }
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ManualObserver as unknown as typeof ResizeObserver;
  return {
    resize(width: number) {
      act(() => {
        for (const { callback, target } of observed) {
          const size = [{ inlineSize: width, blockSize: 600 }];
          callback(
            [
              {
                target,
                borderBoxSize: size,
                contentBoxSize: size,
                devicePixelContentBoxSize: size,
                contentRect: {
                  width,
                  height: 600,
                  x: 0,
                  y: 0,
                  top: 0,
                  left: 0,
                  right: width,
                  bottom: 600,
                },
              } as unknown as ResizeObserverEntry,
            ],
            {} as ResizeObserver
          );
        }
      });
    },
    restore() {
      window.ResizeObserver = original;
    },
  };
}

describe('skills/SkillCatalog', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('keeps the search input and its value when the width is measured', async () => {
    const observer = controllableResizeObserver();
    render(<SkillCatalog skills={skills} onCreate={() => {}} />);
    const input = screen.getByRole('textbox', { name: 'Search skills' });
    await userEvent.type(input, 'pdf');

    observer.resize(320);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    observer.resize(900);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.getByRole('textbox', { name: 'Search skills' })).toBe(input);
    expect(input).toHaveValue('pdf');
    expect(screen.getAllByRole('textbox', { name: 'Search skills' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'New skill' })).toHaveLength(1);
    observer.restore();
  });

  it('groups by source and searches with fuzzy matching across tags', async () => {
    render(<SkillCatalog skills={skills} />);
    expect(screen.getByRole('group', { name: 'Built-in' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(5);

    await userEvent.type(screen.getByRole('textbox', { name: 'Search skills' }), 'writng');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('release-notes');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search skills' }), 'zzz');
    expect(screen.getByText('No skills match your search')).toBeInTheDocument();
  });

  it('filters by source', async () => {
    const onSourceChange = jest.fn();
    render(<SkillCatalog skills={skills} onSourceChange={onSourceChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Source' }));
    await userEvent.click(await screen.findByText('Project (1)'));
    expect(onSourceChange).toHaveBeenCalledWith('project');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('toggles without selecting, shows pending and the rejection message', async () => {
    const onSelect = jest.fn();
    let reject: (reason: Error) => void = () => {};
    const onToggle = jest.fn(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        })
    );
    render(<SkillCatalog skills={skills} onSelect={onSelect} onToggle={onToggle} />);

    const toggle = screen.getByRole('switch', { name: 'Enabled: release-notes' });
    await userEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'release-notes' }), true);
    expect(onSelect).not.toHaveBeenCalled();
    expect(toggle).toBeDisabled();

    reject(new Error('Not allowed'));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(toggle).not.toBeDisabled();
  });

  it('offers actions only for editable skills and creates from the toolbar', async () => {
    const onEdit = jest.fn();
    const onCreate = jest.fn();
    render(
      <SkillCatalog
        skills={skills.slice(0, 2)}
        onEdit={onEdit}
        onRemove={() => {}}
        onCreate={onCreate}
        isEditable={(skill) => skill.source !== 'builtin'}
      />
    );

    expect(screen.getAllByRole('button', { name: /Skill actions/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Skill actions/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'code-review' }));

    await userEvent.click(screen.getByRole('button', { name: 'New skill' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders cards in the grid variant and selects with the keyboard', async () => {
    const onSelect = jest.fn();
    render(<SkillCatalog skills={skills} variant="grid" onSelect={onSelect} selectedId="pdf" />);

    const cards = screen.getAllByRole('button', { pressed: false });
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('pdf');
    cards[0].focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'code-review' }));
  });

  it('shows empty, loading and error states', async () => {
    const onRetry = jest.fn();
    const { rerender } = render(<SkillCatalog skills={[]} onCreate={() => {}} />);
    expect(screen.getByText('No skills yet')).toBeInTheDocument();

    rerender(<SkillCatalog skills={skills} loading />);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    rerender(
      <SkillCatalog skills={skills} variant="grid" error="Registry down" onRetry={onRetry} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
