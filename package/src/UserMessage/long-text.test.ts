import { collapseLongText } from './long-text';

describe('UserMessage/collapseLongText', () => {
  it('keeps short text as is', () => {
    expect(collapseLongText('short\ntext')).toBeNull();
  });

  it('collapses many lines to head and tail lines', () => {
    const text = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
    const collapsed = collapseLongText(text, { lines: 20 })!;
    expect(collapsed.head.split('\n')).toEqual([
      'line 1',
      'line 2',
      'line 3',
      'line 4',
      'line 5',
      'line 6',
    ]);
    expect(collapsed.tail.split('\n')).toEqual(['line 47', 'line 48', 'line 49', 'line 50']);
    expect(collapsed.hiddenLines).toBe(40);
  });

  it('collapses one long line by characters', () => {
    const text = 'x'.repeat(5000);
    const collapsed = collapseLongText(text, { chars: 1000 })!;
    expect(collapsed.head).toHaveLength(300);
    expect(collapsed.tail).toHaveLength(200);
    expect(collapsed.hiddenChars).toBe(4500);
    expect(collapsed.hiddenLines).toBe(0);
  });
});
