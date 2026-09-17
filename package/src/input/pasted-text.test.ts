import {
  countLines,
  expandPastedText,
  formatPasteLabel,
  getPastePlaceholder,
  insertPastePlaceholder,
  prunePastes,
  removePastePlaceholder,
  shouldCollapsePaste,
} from './pasted-text';

describe('input/pasted-text', () => {
  it('counts lines ignoring a trailing newline', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('one')).toBe(1);
    expect(countLines('one\ntwo\n')).toBe(2);
    expect(countLines('a\r\nb\rc')).toBe(3);
  });

  it('collapses by characters or lines', () => {
    expect(shouldCollapsePaste('short', undefined)).toBe(false);
    expect(shouldCollapsePaste('x'.repeat(10_000), undefined)).toBe(true);
    expect(shouldCollapsePaste('a\n'.repeat(50), undefined)).toBe(true);
    expect(shouldCollapsePaste('a\n'.repeat(5), { lines: 5 })).toBe(true);
    expect(shouldCollapsePaste('x'.repeat(20_000), false)).toBe(false);
  });

  it('inserts, expands, prunes and removes placeholders', () => {
    const inserted = insertPastePlaceholder('see  please', 4, 4, 1);
    expect(inserted.text).toBe('see [Pasted text #1] please');
    expect(inserted.caret).toBe(4 + getPastePlaceholder(1).length);
    expect(insertPastePlaceholder('replace me', 0, 7, 2).text).toBe('[Pasted text #2] me');

    const pastes = [
      { id: 1, text: 'LOG', lines: 1 },
      { id: 2, text: 'DIFF', lines: 1 },
    ];
    expect(expandPastedText('a [Pasted text #1] b [Pasted text #3]', pastes)).toBe(
      'a LOG b [Pasted text #3]'
    );
    expect(prunePastes('only [Pasted text #2]', pastes)).toEqual([pastes[1]]);
    expect(prunePastes('[Pasted text #1][Pasted text #2]', pastes)).toBe(pastes);
    expect(removePastePlaceholder('x [Pasted text #1] y', 1)).toBe('x  y');
    expect(getPastePlaceholder(4, 'Texto pegado {id}')).toBe('[Texto pegado 4]');
    expect(expandPastedText('a [Texto pegado 1]', [pastes[0]], 'Texto pegado {id}')).toBe(
      `a ${pastes[0].text}`
    );
    expect(
      formatPasteLabel({ id: 3, text: '', lines: 240 }, 'Pasted text #{id} · {lines} lines')
    ).toBe('Pasted text #3 · 240 lines');
  });
});
