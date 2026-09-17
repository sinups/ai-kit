import type { QuestionAnswer, QuestionConfig, QuestionOption } from './QuestionPrompt';

export const QUESTION_CUSTOM_ID = '__custom__';

export type QuestionDraft = {
  selectedIds: string[];
  customText: string;
  textValue: string;
  notes: string;
};

export function getInitialQuestionDraft(
  answer: QuestionAnswer | undefined,
  question: QuestionConfig | undefined
): QuestionDraft {
  const notes = answer?.notes ?? '';
  if (!answer || answer.kind === 'skip') {
    return { selectedIds: [], customText: '', textValue: '', notes };
  }
  if (question?.kind === 'text') {
    return { selectedIds: [], customText: '', textValue: answer.text ?? '', notes };
  }
  const selected = new Set(answer.selectedIds ?? []);
  const customText = answer.text ?? '';
  if (question?.allowCustom && customText.trim().length > 0) {
    selected.add(QUESTION_CUSTOM_ID);
  }
  return { selectedIds: Array.from(selected), customText, textValue: '', notes };
}

export function canSubmitQuestion(question: QuestionConfig, draft: QuestionDraft): boolean {
  if (question.kind === 'text') {
    return draft.textValue.trim().length > 0;
  }
  const selectedNonCustom = draft.selectedIds.filter((id) => id !== QUESTION_CUSTOM_ID).length;
  const total = selectedNonCustom + (draft.customText.trim().length > 0 ? 1 : 0);
  if (question.kind === 'single') {
    return total === 1;
  }
  const max = question.maxSelections;
  if (typeof max === 'number' && total > max) {
    return false;
  }
  return total >= (question.minSelections ?? 1);
}

export function buildQuestionAnswer(
  question: QuestionConfig,
  draft: QuestionDraft
): QuestionAnswer {
  const notes = question.allowNotes ? draft.notes.trim() : '';
  const withNotes = (answer: QuestionAnswer): QuestionAnswer =>
    notes ? { ...answer, notes } : answer;
  if (question.kind === 'text') {
    return withNotes({ kind: 'text', text: draft.textValue.trim() });
  }
  return withNotes({
    kind: question.kind,
    selectedIds: draft.selectedIds.filter((id) => id !== QUESTION_CUSTOM_ID),
    text: draft.customText.trim() || undefined,
  });
}

/** Option whose preview is shown: the focused or hovered option, else the first selected one with a preview, else the first option with a preview */
export function getPreviewOption(
  options: QuestionOption[],
  selectedIds: string[],
  activeId: string | null
): QuestionOption | undefined {
  const withPreview = options.filter((option) => option.preview);
  return (
    withPreview.find((option) => option.id === activeId) ??
    withPreview.find((option) => selectedIds.includes(option.id)) ??
    withPreview[0]
  );
}

export function toPreviewMarkdown(preview: NonNullable<QuestionOption['preview']>): string {
  if (preview.kind === 'markdown') {
    return preview.content;
  }
  const longestRun = Math.max(0, ...(preview.content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  return `${fence}${preview.language ?? ''}\n${preview.content}\n${fence}`;
}

export function formatQuestionAnswer(answer: QuestionAnswer, options: QuestionOption[]): string {
  if (answer.kind === 'skip') {
    return 'Skipped';
  }
  let result: string;
  if (answer.kind === 'text') {
    result = answer.text || 'Answered';
  } else {
    const ids = answer.selectedIds?.length
      ? answer.selectedIds.map((id) => options.find((o) => o.id === id)?.label ?? id).join(', ')
      : '';
    if (answer.text) {
      result = ids ? `${ids} (${answer.text})` : answer.text;
    } else {
      result = ids || 'Answered';
    }
  }
  return answer.notes ? `${result} — ${answer.notes}` : result;
}
