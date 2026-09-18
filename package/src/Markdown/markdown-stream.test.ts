import {
  closeUnfinishedMarkdown,
  createMarkdownStreamReader,
  cutTailToLastLine,
  hasOpenFence,
  splitMarkdownStream,
} from './markdown-stream';

describe('Markdown/splitMarkdownStream', () => {
  it('keeps everything in the tail until a blank line is followed by a new block', () => {
    expect(splitMarkdownStream('# Title')).toEqual({
      stable: [],
      tail: '# Title',
    });
    expect(splitMarkdownStream('# Title\n\n')).toEqual({
      stable: [],
      tail: '# Title\n\n',
    });
    expect(splitMarkdownStream('# Title\n\nPara')).toEqual({
      stable: ['# Title'],
      tail: 'Para',
    });
  });

  it('splits several blocks and skips repeated blank lines', () => {
    expect(splitMarkdownStream('One\n\n\nTwo\n\n- a\n- b\n\nTail')).toEqual({
      stable: ['One', 'Two', '- a\n- b'],
      tail: 'Tail',
    });
  });

  it('does not split inside fences, including blank lines in code', () => {
    const content = '```ts\nconst a = 1;\n\nconst b = 2;\n```\n\nAfter';
    expect(splitMarkdownStream(content)).toEqual({
      stable: ['```ts\nconst a = 1;\n\nconst b = 2;\n```'],
      tail: 'After',
    });
    const open = 'Intro\n\n```ts\nconst a = 1;\n\nconst b';
    expect(splitMarkdownStream(open)).toEqual({
      stable: ['Intro'],
      tail: '```ts\nconst a = 1;\n\nconst b',
    });
  });

  it('keeps indented continuation with the previous block', () => {
    const content = '1. Step\n\n   more about the step\n\nNext';
    expect(splitMarkdownStream(content)).toEqual({
      stable: ['1. Step\n\n   more about the step'],
      tail: 'Next',
    });
  });

  it('keeps the items of a loose list together', () => {
    expect(splitMarkdownStream('- a\n\n- b\n\nAfter')).toEqual({
      stable: ['- a\n\n- b'],
      tail: 'After',
    });
    expect(splitMarkdownStream('1. a\n\n2. b')).toEqual({
      stable: [],
      tail: '1. a\n\n2. b',
    });
    expect(splitMarkdownStream('- a\n\n1. b').stable).toEqual(['- a']);
    expect(splitMarkdownStream('- a\n\n* b').stable).toEqual(['- a']);
  });

  it('does not split content with reference definitions', () => {
    const content = 'See [docs][1].\n\nMore\n\n[1]: https://example.com';
    expect(splitMarkdownStream(content)).toEqual({ stable: [], tail: content });
  });

  it('only closes a fence with the same marker of at least the same length', () => {
    expect(splitMarkdownStream('````\n```\n\nstill code').stable).toEqual([]);
    expect(splitMarkdownStream('~~~\ncode\n~~~\n\nText').stable).toEqual(['~~~\ncode\n~~~']);
  });

  it('reassembles to the original content', () => {
    const content = '# A\n\nText\n\n```\nx\n\ny\n```\n\n- item\n\n  nested\n\nEnd';
    const { stable, tail } = splitMarkdownStream(content);
    expect([...stable, tail].join('\n\n')).toBe(content);
  });
});

describe('Markdown/hasOpenFence', () => {
  it('reports a fence that is still waiting for its closing marker', () => {
    expect(hasOpenFence('```ts\nconst a')).toBe(true);
    expect(hasOpenFence('```ts\nconst a\n```')).toBe(false);
    expect(hasOpenFence('Plain text')).toBe(false);
  });
});

describe('Markdown/closeUnfinishedMarkdown', () => {
  it('closes an open fence with the matching marker', () => {
    expect(closeUnfinishedMarkdown('```ts\nconst a')).toBe('```ts\nconst a\n```');
    expect(closeUnfinishedMarkdown('~~~~\ncode\n')).toBe('~~~~\ncode\n~~~~');
  });

  it('leaves closed fences and plain text alone', () => {
    expect(closeUnfinishedMarkdown('```\nx\n```')).toBe('```\nx\n```');
    expect(closeUnfinishedMarkdown('Hello **wor')).toBe('Hello **wor');
  });

  it('drops a dangling empty list marker', () => {
    expect(closeUnfinishedMarkdown('- one\n- ')).toBe('- one');
    expect(closeUnfinishedMarkdown('1. one\n2.')).toBe('1. one');
  });
});

describe('Markdown/createMarkdownStreamReader', () => {
  it('returns what a fresh split returns while the answer grows', () => {
    const read = createMarkdownStreamReader();
    const content = '# A\n\nText\n\n```\nx\n\ny\n```\n\n- item\n\n  nested\n\nEnd';
    for (let length = 1; length <= content.length; length++) {
      const grown = content.slice(0, length);
      expect(read(grown)).toEqual(splitMarkdownStream(grown));
    }
  });

  it('scans only the part that arrived since the last call', () => {
    const seen: string[] = [];
    const read = createMarkdownStreamReader((part) => {
      seen.push(part);
      return part;
    });
    read('# Title\n\nFirst');
    seen.length = 0;
    expect(read('# Title\n\nFirst paragraph')).toEqual({
      stable: ['# Title'],
      tail: 'First paragraph',
    });
    expect(seen).toEqual(['First paragraph']);
  });

  it('normalizes every stable block exactly once', () => {
    const normalized: string[] = [];
    const read = createMarkdownStreamReader((part) => {
      normalized.push(part);
      return part;
    });
    read('One\n\nTwo\n\nThree');
    read('One\n\nTwo\n\nThree\n\nFour');
    read('One\n\nTwo\n\nThree\n\nFour\n\nFive');
    expect(normalized.filter((part) => part === 'One')).toHaveLength(1);
    expect(normalized.filter((part) => part === 'Two')).toHaveLength(1);
  });

  it('starts over when the content no longer starts with the stable prefix', () => {
    const read = createMarkdownStreamReader();
    expect(read('One\n\nTwo\n\nThree')).toEqual({ stable: ['One', 'Two'], tail: 'Three' });
    expect(read('Other\n\nAnswer')).toEqual({ stable: ['Other'], tail: 'Answer' });
    expect(read('One\n\nTwo')).toEqual({ stable: ['One'], tail: 'Two' });
  });

  it('keeps everything in the tail once a reference definition arrives', () => {
    const read = createMarkdownStreamReader();
    expect(read('See [docs][1].\n\nMore')).toEqual({ stable: ['See [docs][1].'], tail: 'More' });
    const withDefinition = 'See [docs][1].\n\nMore\n\n[1]: https://example.com';
    expect(read(withDefinition)).toEqual({ stable: [], tail: withDefinition });
  });

  it('holds a block that ends with a bare ordered marker together with what follows', () => {
    expect(splitMarkdownStream('1.\n\nStep\n\nNext')).toEqual({
      stable: ['1.\n\nStep'],
      tail: 'Next',
    });
  });
});

describe('Markdown/cutTailToLastLine', () => {
  it('holds back the unfinished last line', () => {
    expect(cutTailToLastLine('Done line\nhalf wo')).toBe('Done line\n');
    expect(cutTailToLastLine('half wo')).toBe('');
    expect(cutTailToLastLine('Done line\n')).toBe('Done line\n');
  });
});
