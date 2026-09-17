import React, { useMemo, useRef, useState } from 'react';
import { Box, rem, Stack, Text } from '@mantine/core';
import type { AgentChatProps, ChatMessage } from '../types';
import type { QuestionAnswer, QuestionConfig } from '../question/QuestionPrompt';
import { getContentWidthStyle } from '../utils/content-width';
import { cx } from '../utils/cx';
import { MessageList } from '../MessageList/MessageList';
import { InputBar } from '../input/InputBar';
import { Suggestions, type SuggestionItem } from '../input/Suggestions';
import { ChatWelcome, type ChatWelcomeAction } from './ChatWelcome';
import classes from './AgentChat.module.css';

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
  collapseToolRuns,
  messageActions,
  onRetry,
  onToolAction,
  inputBarProps,
  statusBar,
  withSearch = false,
  stickyPrompt,
  highlighter,
  longMessageThreshold,
  contentWidth,
  initialScrollBehavior,
  enableImagePreview,
  suggestions,
  emptyStatePosition = 'default',
  emptyState,
  hideSuggestionsWhenNotEmpty = false,
  alignComposer = false,
  topFade,
  wrapLines,
  responsiveTables,
  emptySuggestionsPlacement = 'input',
  emptyStateWidth,
  questionTool,
  className,
  style,
}: AgentChatProps) {
  const [draft, setDraft] = useState('');
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const resolvedEmptyStateWidth = emptyStateWidth ?? (emptyState ? 600 : undefined);
  const rootStyle: React.CSSProperties | undefined = {
    ...(resolvedEmptyStateWidth === undefined
      ? {}
      : {
          '--ae-empty-state-width':
            typeof resolvedEmptyStateWidth === 'number'
              ? rem(resolvedEmptyStateWidth)
              : resolvedEmptyStateWidth,
        }),
    ...(alignComposer && scrollbarWidth > 0
      ? { '--ae-scrollbar-width': `${scrollbarWidth}px` }
      : {}),
    ...style,
  } as React.CSSProperties;
  const [searchOpened, setSearchOpened] = useState(false);

  const ResolvedInputBar = slots?.InputBar ?? InputBar;
  const isEmpty = !error && messages.length === 0;
  const emptyLayout =
    emptyState?.layout ?? (emptyStatePosition === 'center' ? 'center' : 'welcome');
  const isCenteredEmptyState =
    isEmpty && (emptyState ? emptyLayout === 'center' : emptyStatePosition === 'center');
  const isWelcome = isEmpty && Boolean(emptyState) && emptyLayout === 'welcome';
  const rootRef = useRef<HTMLDivElement>(null);

  const pendingQuestion = useMemo(
    () => findPendingQuestion(messages, questionTool),
    [messages, questionTool]
  );
  const suggestionConfig = resolveSuggestions(suggestions);
  const emptySuggestionItems = emptyState?.suggestions ?? suggestionConfig.items;
  const showInputSuggestions =
    (emptySuggestionsPlacement === 'input' || emptySuggestionsPlacement === 'both') &&
    !(hideSuggestionsWhenNotEmpty && !isEmpty) &&
    !isWelcome;
  const welcomeActions: ChatWelcomeAction[] =
    emptyState?.actions ??
    (emptyState?.suggestions ?? suggestionConfig.items).map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      icon: item.icon,
    }));

  const handleWelcomeAction = (action: ChatWelcomeAction) => {
    setDraft(action.value ?? action.label);
    requestAnimationFrame(() => {
      const textarea = rootRef.current?.querySelector<HTMLTextAreaElement>('textarea');
      textarea?.focus();
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  };
  const showEmptySuggestions =
    isCenteredEmptyState &&
    (emptyState?.suggestions !== undefined ||
      emptySuggestionsPlacement === 'empty' ||
      emptySuggestionsPlacement === 'both') &&
    emptySuggestionItems.length > 0;

  const handleEmptySuggestionSelect = (item: SuggestionItem) => {
    setDraft(item.value ?? item.label);
  };

  const emptySuggestionsNode = showEmptySuggestions ? (
    <Suggestions
      items={emptySuggestionItems}
      onSelect={handleEmptySuggestionSelect}
      disabled={status === 'streaming' || status === 'submitted'}
      className={cx(
        classes.emptySuggestions,
        classes.emptySuggestionsTop,
        suggestionConfig.className
      )}
      itemClassName={cx(classes.emptySuggestionItem, suggestionConfig.itemClassName)}
    />
  ) : null;

  const inputBarNode = (
    <ResolvedInputBar
      {...inputBarProps}
      onSend={onSend}
      status={status}
      onStop={onStop}
      value={draft}
      onChange={setDraft}
      placeholder={inputBarProps?.placeholder ?? 'Send a message...'}
      className={cx(
        classNames?.inputBar,
        inputBarProps?.className,
        isCenteredEmptyState && classes.centeredInputBar,
        alignComposer && !isCenteredEmptyState && classes.alignedInputBar
      )}
      onAttach={attachments?.onAttach ?? inputBarProps?.onAttach}
      attachedImages={attachments?.images ?? inputBarProps?.attachedImages}
      attachedFiles={attachments?.files ?? inputBarProps?.attachedFiles}
      onRemoveImage={attachments?.onRemoveImage ?? inputBarProps?.onRemoveImage}
      onRemoveFile={attachments?.onRemoveFile ?? inputBarProps?.onRemoveFile}
      onPaste={attachments?.onPaste ?? inputBarProps?.onPaste}
      isDragOver={attachments?.isDragOver ?? inputBarProps?.isDragOver}
      suggestions={showInputSuggestions ? (suggestions ?? inputBarProps?.suggestions) : []}
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
              onSubmit: (answer: QuestionAnswer, { questionIndex }: { questionIndex: number }) => {
                questionTool?.onAnswer?.({
                  toolCallId: pendingQuestion.toolCallId,
                  question:
                    pendingQuestion.questions[questionIndex - 1] ?? pendingQuestion.question,
                  answer,
                });
              },
              onSkip: ({ questionIndex }: { questionIndex: number }) => {
                questionTool?.onAnswer?.({
                  toolCallId: pendingQuestion.toolCallId,
                  question:
                    pendingQuestion.questions[questionIndex - 1] ?? pendingQuestion.question,
                  answer: { kind: 'skip' },
                });
              },
            }
          : undefined
      }
    />
  );

  const listMessages = useMemo<ChatMessage[]>(
    () =>
      error
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
        : messages,
    [messages, error]
  );

  return (
    <Box
      ref={rootRef}
      className={cx(classes.root, classNames?.root, className)}
      style={getContentWidthStyle(contentWidth, rootStyle)}
      data-empty-width={resolvedEmptyStateWidth === undefined ? undefined : true}
      data-empty-centered={isCenteredEmptyState || undefined}
      data-align-composer={alignComposer || undefined}
      onKeyDown={
        withSearch && !isCenteredEmptyState && !isWelcome
          ? (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (
                !event.defaultPrevented &&
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'f'
              ) {
                event.preventDefault();
                setSearchOpened(true);
                event.currentTarget
                  .querySelector<HTMLInputElement>('[role="search"] input')
                  ?.focus();
              }
            }
          : undefined
      }
    >
      {isCenteredEmptyState ? (
        <div className={classes.emptyState}>
          <div className={classes.emptyStateInner}>
            {emptyState && (emptyState.title || emptyState.description) && (
              <Stack gap={6} align="center" ta="center" className={classes.emptyStateHeading}>
                {emptyState.title && (
                  <Text component="h2" size="md" fw={500} className={classes.emptyStateTitle}>
                    {emptyState.title}
                  </Text>
                )}
                {emptyState.description && (
                  <Text size="sm" c="dimmed">
                    {emptyState.description}
                  </Text>
                )}
              </Stack>
            )}
            {emptySuggestionsNode}
            {inputBarNode}
          </div>
        </div>
      ) : isWelcome && emptyState ? (
        <ChatWelcome
          avatar={emptyState.avatar}
          title={emptyState.title}
          description={emptyState.description}
          actions={welcomeActions}
          onAction={handleWelcomeAction}
          labels={emptyState.labels}
        />
      ) : (
        <MessageList
          messages={listMessages}
          status={status}
          classNames={classNames}
          slots={slots}
          toolRenderers={toolRenderers}
          showCopyToolbar={showCopyToolbar}
          collapseToolRuns={collapseToolRuns}
          messageActions={messageActions}
          onRetry={onRetry}
          onToolAction={onToolAction}
          withSearch={withSearch}
          searchOpened={searchOpened}
          onSearchOpenedChange={setSearchOpened}
          stickyPrompt={stickyPrompt}
          topFade={topFade}
          onScrollbarWidthChange={alignComposer ? setScrollbarWidth : undefined}
          wrapLines={wrapLines}
          responsiveTables={responsiveTables}
          highlighter={highlighter}
          longMessageThreshold={longMessageThreshold}
          initialScrollBehavior={initialScrollBehavior}
          enableImagePreview={enableImagePreview}
          suppressQuestionTool={Boolean(pendingQuestion) && !pendingQuestion?.toolCallId}
          suppressQuestionToolCallId={pendingQuestion?.toolCallId}
        />
      )}
      {statusBar && !isCenteredEmptyState ? (
        <div className={cx(classes.statusBar, alignComposer && classes.alignedStatusBar)}>
          {statusBar}
        </div>
      ) : null}
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

/**
 * Finds the unanswered `tool-Question` part to dock in the input bar.
 * Only messages after the last user message are considered: anything before it
 * has already been answered or superseded by the user.
 */
export function findPendingQuestion(
  messages: AgentChatProps['messages'],
  questionTool: AgentChatProps['questionTool']
) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === 'user') {
      return null;
    }
    if (message?.role !== 'assistant') {
      continue;
    }
    const parts = message.parts ?? [];
    for (let p = parts.length - 1; p >= 0; p -= 1) {
      const part = parts[p] as {
        type?: string;
        toolCallId?: string;
        state?: string;
        input?: QuestionToolInput;
        output?: unknown;
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
      if (
        part.state === 'output-available' ||
        part.state === 'output-error' ||
        part.output != null
      ) {
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
