import { mergeLabels } from './merge-labels';

describe('utils/mergeLabels', () => {
  it('merges nested sections key by key and lets later sources win', () => {
    const format = (count: number) => `${count}`;
    expect(
      mergeLabels<Record<string, unknown>>(
        { send: 'Send', historySearch: { title: 'Search', empty: 'Nothing' } },
        { historySearch: { title: 'Поиск' }, count: format },
        undefined,
        { send: 'Отправить', stop: undefined }
      )
    ).toEqual({
      send: 'Отправить',
      historySearch: { title: 'Поиск', empty: 'Nothing' },
      count: format,
    });
  });
});
