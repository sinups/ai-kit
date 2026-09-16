import React, { useRef, useState } from 'react';
import { Box } from '@mantine/core';
import type { AgentChatProps, ChatMessage } from '../types';
import type { QuestionAnswer, QuestionConfig } from '../question/QuestionPrompt';
import { cx } from '../utils/cx';
import { MessageList } from '../MessageList/MessageList';
import { InputBar } from '../input/InputBar';
import { Suggestions, type SuggestionItem } from '../input/Suggestions';
import classes from './AgentChat.module.css';

type InputBarComponent = React.ComponentType<React.ComponentProps<typeof InputBar>>;

/** Drop-in chat surface: message list, composer, suggestions and question bar */
export function AgentChat({
  messages,
  onSend,
  status,
  onStop,
  error,
  classNames,
  slots,
  toolRenderers,
  attachments,
  showCopyToolbar,
  initialScrollBehavior,
  enableImagePreview,
  suggestions,
  emptyStatePosition = 'default',
  emptySuggestionsPlacement = 'input',
  emptySuggestionsPosition = 'top',
  questionTool,
  className,
  style,
}: AgentChatProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  const ResolvedInputBar = (slots?.InputBar ?? InputBar) as InputBarComponent;
  const isEmpty = !error && messages.length === 0;
  const isCenteredEmptyState = isEmpty && emptyStatePosition === 'center';

  const pendingQuestion = findPendingQuestion(messages, questionTool);
  const suggestionConfig = resolveSuggestions(suggestions);
  const showInputSuggestions =
    emptySuggestionsPlacement === 'input' || emptySuggestionsPlacement === 'both';
  const showEmptySuggestions =
    isCenteredEmptyState &&
    (emptySuggestionsPlacement === 'empty' || emptySuggestionsPlacement === 'both') &&
    suggestionConfig.items.length > 0;

  const handleEmptySuggestionSelect = (item: SuggestionItem) => {
    setDraft(item.value ?? item.label);
  };

  const emptySuggestionsNode = showEmptySuggestions ? (
    <Suggestions
      items={suggestionConfig.items}
      onSelect={handleEmptySuggestionSelect}
      disabled={status === 'streaming' || status === 'submitted'}
      className={cx(
        classes.emptySuggestions,
        emptySuggestionsPosition === 'top'
          ? classes.emptySuggestionsTop
          : classes.emptySuggestionsBottom,
        suggestionConfig.className
      )}
      itemClassName={cx(classes.emptySuggestionItem, suggestionConfig.itemClassName)}
    />
  ) : null;

  const inputBarNode = (
    <ResolvedInputBar
      onSend={onSend}
      status={status}
      onStop={onStop}
      value={draft}
      onChange={setDraft}
      placeholder="Send a message..."
      className={cx(classNames?.inputBar, isCenteredEmptyState && classes.centeredInputBar)}
      onAttach={attachments?.onAttach}
      attachedImages={attachments?.images}
      attachedFiles={attachments?.files}
      onRemoveImage={attachments?.onRemoveImage}
      onRemoveFile={attachments?.onRemoveFile}
      onPaste={attachments?.onPaste}
      isDragOver={attachments?.isDragOver}
      suggestions={showInputSuggestions ? suggestions : []}
      questionBar={
        pendingQuestion
          ? {
              id: pendingQuestion.id,
              questions: pendingQuestion.questions,
              questionIndex: pendingQuestion.questionIndex,
              totalQuestions: pendingQuestion.totalQuestions,
              onPreviousQuestion: pendingQuestion.onPreviousQuestion,
              onNextQuestion: pendingQuestion.onNextQuestion,
              submitLabel: pendingQuestion.submitLabel,
              skipLabel: pendingQuestion.skipLabel,
              allowSkip: pendingQuestion.allowSkip,
              onSubmit: (answer: QuestionAnswer) => {
                questionTool?.onAnswer?.({
                  toolCallId: pendingQuestion.toolCallId,
                  question:
                    pendingQuestion.questions[
                      pendingQuestion.questionIndex ? pendingQuestion.questionIndex - 1 : 0
                    ] ?? pendingQuestion.question,
                  answer,
                });
              },
            }
          : undefined
      }
    />
  );

  const listMessages: ChatMessage[] = error
    ? [
        ...messages,
        {
          id: 'agent-chat-error',
          role: 'assistant',
          parts: [
            {
              type: 'error',
              title: 'Request failed',
              message: error.message,
            },
          ],
        },
      ]
    : messages;

  return (
    <Box
      ref={rootRef}
      className={cx(classes.root, classNames?.root, className)}
      style={style}
      data-empty-centered={isCenteredEmptyState || undefined}
    >
      {isCenteredEmptyState ? (
        <div className={classes.emptyState}>
          <div className={classes.emptyStateInner}>
            {emptySuggestionsPosition === 'top' ? emptySuggestionsNode : null}
            {inputBarNode}
            {emptySuggestionsPosition === 'bottom' ? emptySuggestionsNode : null}
          </div>
        </div>
      ) : (
        <MessageList
          messages={listMessages}
          status={status}
          classNames={classNames}
          slots={slots}
          toolRenderers={toolRenderers}
          showCopyToolbar={showCopyToolbar}
          initialScrollBehavior={initialScrollBehavior}
          enableImagePreview={enableImagePreview}
          suppressQuestionTool={Boolean(pendingQuestion)}
        />
      )}
      {!isCenteredEmptyState ? inputBarNode : null}
    </Box>
  );
}

AgentChat.displayName = 'AgentChat';

function resolveSuggestions(suggestions: AgentChatProps['suggestions']) {
  if (Array.isArray(suggestions)) {
    return {
      items: suggestions,
      className: undefined,
      itemClassName: undefined,
    };
  }
  return {
    items: suggestions?.items ?? [],
    className: suggestions?.className,
    itemClassName: suggestions?.itemClassName,
  };
}

type QuestionToolInput = {
  questions?: QuestionConfig[];
  question?: QuestionConfig;
  questionIndex?: number;
  totalQuestions?: number;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
};

function findPendingQuestion(
  messages: AgentChatProps['messages'],
  questionTool: AgentChatProps['questionTool']
) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== 'assistant') {
      continue;
    }
    const parts = message.parts ?? [];
    for (let p = parts.length - 1; p >= 0; p -= 1) {
      const part = parts[p] as {
        type?: string;
        toolCallId?: string;
        input?: QuestionToolInput;
        output?: { answer?: QuestionAnswer };
      };
      if (part?.type !== 'tool-Question') {
        continue;
      }
      const input = part.input;
      const questions = input?.questions ?? [];
      const firstQuestion = questions[0] ?? input?.question;
      if (!firstQuestion) {
        continue;
      }
      if (part.output?.answer) {
        return null;
      }
      return {
        id: part.toolCallId ?? `question-${i}-${p}`,
        toolCallId: part.toolCallId,
        questions,
        question: firstQuestion,
        questionIndex: input?.questionIndex,
        totalQuestions:
          input?.totalQuestions ?? (questions.length > 0 ? questions.length : undefined),
        onPreviousQuestion: input?.onPreviousQuestion,
        onNextQuestion: input?.onNextQuestion,
        submitLabel: questionTool?.submitLabel ?? input?.submitLabel,
        skipLabel: questionTool?.skipLabel ?? input?.skipLabel,
        allowSkip: questionTool?.allowSkip ?? input?.allowSkip,
      };
    }
  }
  return null;
}
