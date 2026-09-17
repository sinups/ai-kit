import {
  QUESTION_CUSTOM_ID,
  buildQuestionAnswer,
  canSubmitQuestion,
  formatQuestionAnswer,
  getInitialQuestionDraft,
  getPreviewOption,
  toPreviewMarkdown,
} from './question-answer';
import type { QuestionConfig } from './QuestionPrompt';

const SINGLE: QuestionConfig = {
  kind: 'single',
  title: 'Layout',
  allowCustom: true,
  allowNotes: true,
  options: [
    {
      id: 'grid',
      label: 'Grid',
      preview: { kind: 'code', content: 'display: grid', language: 'css' },
    },
    { id: 'list', label: 'List' },
    { id: 'cards', label: 'Cards', preview: { kind: 'markdown', content: '**Cards**' } },
  ],
};

describe('question/question-answer', () => {
  it('restores a draft from an answer including notes and custom text', () => {
    expect(
      getInitialQuestionDraft(
        { kind: 'single', selectedIds: [], text: 'Masonry', notes: 'wide' },
        SINGLE
      )
    ).toEqual({
      selectedIds: [QUESTION_CUSTOM_ID],
      customText: 'Masonry',
      textValue: '',
      notes: 'wide',
    });
    expect(getInitialQuestionDraft(undefined, SINGLE).notes).toBe('');
  });

  it('checks whether a question can be submitted', () => {
    const draft = { selectedIds: [], customText: '', textValue: '', notes: '' };
    expect(canSubmitQuestion(SINGLE, draft)).toBe(false);
    expect(canSubmitQuestion(SINGLE, { ...draft, selectedIds: ['grid'] })).toBe(true);
    expect(canSubmitQuestion({ kind: 'text', title: 'Why' }, { ...draft, textValue: ' x ' })).toBe(
      true
    );
  });

  it('builds the answer with trimmed notes only when notes are allowed', () => {
    const draft = { selectedIds: ['grid'], customText: '', textValue: '', notes: '  keep gaps ' };
    expect(buildQuestionAnswer(SINGLE, draft)).toEqual({
      kind: 'single',
      selectedIds: ['grid'],
      text: undefined,
      notes: 'keep gaps',
    });
    expect(buildQuestionAnswer({ ...SINGLE, allowNotes: false }, draft)).not.toHaveProperty(
      'notes'
    );
    expect(
      buildQuestionAnswer(
        { kind: 'text', title: 'Why', allowNotes: true },
        { ...draft, textValue: ' ok ' }
      )
    ).toEqual({
      kind: 'text',
      text: 'ok',
      notes: 'keep gaps',
    });
  });

  it('picks the previewed option by focus, then selection, then the first preview', () => {
    const options = SINGLE.options!;
    expect(getPreviewOption(options, [], null)?.id).toBe('grid');
    expect(getPreviewOption(options, ['cards'], null)?.id).toBe('cards');
    expect(getPreviewOption(options, ['cards'], 'grid')?.id).toBe('grid');
    expect(getPreviewOption(options, ['list'], 'list')?.id).toBe('grid');
    expect(getPreviewOption([{ id: 'a', label: 'A' }], [], null)).toBeUndefined();
  });

  it('turns previews into markdown and formats answers', () => {
    expect(toPreviewMarkdown({ kind: 'code', content: 'a', language: 'ts' })).toBe('```ts\na\n```');
    expect(toPreviewMarkdown({ kind: 'code', content: 'a\n```\nb' })).toBe('````\na\n```\nb\n````');
    expect(toPreviewMarkdown({ kind: 'markdown', content: '# A' })).toBe('# A');
    expect(
      formatQuestionAnswer(
        { kind: 'single', selectedIds: ['grid'], notes: 'wide' },
        SINGLE.options!
      )
    ).toBe('Grid — wide');
    expect(formatQuestionAnswer({ kind: 'skip' }, [])).toBe('Skipped');
  });
});
