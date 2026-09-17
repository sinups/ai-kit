import { act, renderHook } from '@testing-library/react';
import {
  useCompletionItems,
  type CompletionItem,
  type CompletionSource,
} from './use-completion-items';

const item = (value: string): CompletionItem => ({ value, label: value });

describe('useCompletionItems', () => {
  it('keeps the previous async results, filtered, while the next query resolves', async () => {
    const pending: Array<(items: CompletionItem[]) => void> = [];
    const source: CompletionSource = {
      trigger: '@',
      items: () => new Promise((resolve) => pending.push(resolve)),
    };
    const { result, rerender } = renderHook(({ query }) => useCompletionItems(source, query), {
      initialProps: { query: 'r' as string | null },
    });
    await act(async () => {});
    await act(async () => pending[0]([item('readme'), item('router'), item('main')]));
    expect(result.current.map((entry) => entry.value)).toEqual(['readme', 'router', 'main']);

    rerender({ query: 'ro' });
    expect(result.current.map((entry) => entry.value)).toEqual(['router']);

    await act(async () => {});
    await act(async () => pending[1]([item('routes')]));
    expect(result.current.map((entry) => entry.value)).toEqual(['routes']);
  });
});
