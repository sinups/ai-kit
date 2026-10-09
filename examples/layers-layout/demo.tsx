import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Group,
  Modal,
  Select,
  Switch,
  Text,
  useMantineColorScheme,
} from '@mantine/core';
import { IconFileText, IconMoon, IconRefresh, IconSparkles, IconSun } from '@tabler/icons-react';
import {
  AgentChat,
  AiKitProvider,
  Markdown,
  quietPresentation,
  type AgentChatLabels,
  type ChatMessage,
  type ToolApprovals,
  type ToolPart,
} from '../../package/src';
import classes from './demo.module.css';

type Scenario = 'read' | 'create' | 'empty' | 'error';
type Phase =
  | 'idle'
  | 'waiting'
  | 'reading'
  | 'consent'
  | 'writing'
  | 'answer'
  | 'done'
  | 'cancelled'
  | 'error';
const SEARCH = 'tool-mcp__layers__page_search';
const CREATE = 'tool-mcp__layers__page_create';
const CALL = 'demo-create';
const PAGE = 'План на неделю';
const PAGE_CONTENT =
  '## План на неделю\n\n### Главное\n\n- Завершить подготовку новой формы.\n- Согласовать план проекта.\n- Проверить итоги недели.\n\n### Встречи\n\n| День | Событие |\n| --- | --- |\n| Вторник | Планирование проекта |\n| Пятница | Итоги недели |';
const ANSWERS: Record<Scenario, string> = {
  read: 'Нашёл **3 страницы** в пространстве команды.\n\n- [План на неделю](#page=plan)\n- [Цели команды](#page=goals)\n- [Заметки встречи](#page=notes)\n\n## На этой неделе\n\nВ плане три приоритета: подготовить форму, согласовать проект и подвести итоги.\n\n| День | Событие |\n| --- | --- |\n| Вторник | Планирование проекта |\n| Пятница | Итоги недели |',
  create:
    'Страница создана.\n\n[План на неделю](#page=plan)\n\nОна приватная: в веб ничего не опубликовано.',
  empty:
    'В доступных страницах не нашёл совпадений с вашим запросом. Это результат этой выборки, а не проверка всех данных команды.',
  error: '',
};
const CATALOG = {
  mcp__layers__page_search: { title: 'Поиск страниц', annotations: { readOnlyHint: true } },
  mcp__layers__page_create: { title: 'Создание страницы', annotations: { readOnlyHint: false } },
};
const LABELS: Partial<AgentChatLabels> = {
  durationUnits: { seconds: ' с', minutes: ' мин', hours: ' ч' },
  placeholder: 'Спросите о задачах, страницах или проектах',
  errorTitle: 'Не удалось получить ответ',
  inputBar: { send: 'Отправить', stop: 'Остановить' },
  messageList: {
    working: 'Обрабатываю',
    planning: 'Подготавливаю',
    copyMessage: 'Скопировать сообщение',
    copied: 'Скопировано',
    messageActions: 'Действия сообщения',
    answerReady: 'Ответ готов',
    answerFailed: 'Ответ остановлен с ошибкой',
    answerStopped: 'Ответ остановлен',
    newMessages: (n) => `Новые сообщения · ${n}`,
    toolRuns: {
      otherTools: (n) => `Действия · ${n}`,
      working: 'Обрабатываю',
      thought: 'Подготовка',
    },
  },
  toolApproval: {
    approve: 'Создать',
    reject: 'Не создавать',
    approved: 'Разрешено',
    skipped: 'Отклонено',
    starting: 'Начинаю',
    waiting: 'Ожидаю',
    canceled: 'Отменено',
  },
  toolRow: {
    running: 'Выполняю',
    queued: 'В очереди',
    awaitingPermission: 'Жду разрешения',
    rejected: 'Отклонено',
    interrupted: 'Остановлено',
  },
  toolCall: {
    queued: 'В очереди',
    awaitingPermission: 'Жду разрешения',
    rejected: 'Отклонено',
    interrupted: 'Остановлено',
  },
  mcpTool: {
    arguments: 'Действие',
    result: 'Результат',
    failed: 'Не выполнено',
    interrupted: 'Остановлено',
  },
  errorMessage: { retry: 'Повторить' },
};

/** A transport-free rehearsal: the clock advances fixtures, never a real MCP operation. */
export function LayersLayoutDemo({ initialScenario = 'read' }: { initialScenario?: Scenario }) {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stoppedAt, setStoppedAt] = useState<Phase>('idle');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected'>();
  const [compact, setCompact] = useState(true);
  const [run, setRun] = useState(0);
  const [page, setPage] = useState('');
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const busy = ['waiting', 'reading', 'consent', 'writing', 'answer'].includes(phase);

  useEffect(() => {
    const onHash = () =>
      setPage(new URLSearchParams(window.location.hash.slice(1)).get('page') ?? '');
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let next: Phase | undefined;
    if (phase === 'waiting') {
      next = scenario === 'create' ? 'consent' : 'reading';
    }
    if (phase === 'reading') {
      next = scenario === 'error' ? 'error' : 'answer';
    }
    if (phase === 'writing') {
      next = 'answer';
    }
    if (!next) {
      return;
    }
    const timer = window.setTimeout(() => setPhase(next!), phase === 'waiting' ? 1400 : 2200);
    return () => window.clearTimeout(timer);
  }, [phase, scenario]);

  useEffect(() => {
    if (phase !== 'answer') {
      return;
    }
    const answer = ANSWERS[scenario];
    const timer = window.setInterval(() => {
      setText((previous) => answer.slice(0, previous.length + 4));
    }, 35);
    return () => window.clearInterval(timer);
  }, [phase, scenario]);

  useEffect(() => {
    if (phase === 'answer' && text === ANSWERS[scenario]) {
      setPhase('done');
    }
  }, [phase, text, scenario]);

  function reset(nextScenario = scenario) {
    setScenario(nextScenario);
    setPhase('idle');
    setPrompt('');
    setText('');
    setDecision(undefined);
    setRun((n) => n + 1);
  }
  function send({ content }: { content: string }) {
    setPrompt(content);
    setText('');
    setDecision(undefined);
    setPhase('waiting');
    setRun((n) => n + 1);
  }
  function stop() {
    if (phase === 'consent') {
      setDecision('rejected');
    }
    setStoppedAt(phase);
    setPhase('cancelled');
  }
  const messages = useMemo<ChatMessage[]>(() => {
    if (phase === 'idle') {
      return [];
    }
    const parts: ChatMessage['parts'] = [];
    const operationPhase = phase === 'cancelled' ? stoppedAt : phase;
    if (scenario === 'create' && !['waiting', 'idle'].includes(operationPhase)) {
      parts.push({
        type: CREATE,
        toolCallId: CALL,
        input: { title: PAGE },
        state:
          decision === 'approved' && ['answer', 'done'].includes(operationPhase)
            ? 'output-available'
            : 'input-available',
        ...(decision === 'approved' && ['answer', 'done'].includes(operationPhase)
          ? { output: { content: [{ type: 'text', text: 'Приватная страница создана.' }] } }
          : {}),
      } as ToolPart);
    } else if (!['waiting', 'cancelled'].includes(phase)) {
      parts.push({
        type: SEARCH,
        toolCallId: 'demo-search',
        input: { query: prompt },
        state:
          phase === 'reading'
            ? 'input-available'
            : phase === 'error'
              ? 'output-error'
              : 'output-available',
        ...(phase === 'error'
          ? { errorText: 'Сервис временно не ответил. Данные не изменены.' }
          : {}),
        ...(['answer', 'done'].includes(phase)
          ? {
              output: {
                content: [
                  {
                    type: 'text',
                    text:
                      scenario === 'empty'
                        ? 'Совпадений нет.'
                        : 'Найдены три страницы пространства команды.',
                  },
                ],
              },
            }
          : {}),
      } as ToolPart);
    }
    if (phase === 'cancelled') {
      parts.push({
        type: 'text',
        text:
          scenario === 'create' && decision === 'approved' && ['answer', 'done'].includes(stoppedAt)
            ? 'Страница уже создана. Ответ остановлен.'
            : text
              ? `${text}\n\nОтвет остановлен.`
              : 'Остановлено. Ничего не изменено.',
      });
    } else if (decision === 'rejected') {
      parts.push({ type: 'text', text: 'Не создаю страницу.' });
    } else if (text) {
      parts.push({ type: 'text', text });
    }
    return [
      { id: `u-${run}`, role: 'user', parts: [{ type: 'text', text: prompt }] },
      { id: `a-${run}`, role: 'assistant', parts },
    ];
  }, [phase, scenario, prompt, run, text, decision, stoppedAt]);

  const approvals: ToolApprovals | undefined =
    scenario === 'create' && phase !== 'idle'
      ? {
          [CALL]: decision
            ? { outcome: { decision, scope: 'once' } }
            : {
                isPending: true,
                reason: 'Создать приватную страницу «План на неделю». Без публикации в веб.',
                onApprove: () => {
                  setDecision('approved');
                  setPhase('writing');
                },
                onReject: () => {
                  setDecision('rejected');
                  setPhase('done');
                },
              },
        }
      : undefined;

  return (
    <AiKitProvider>
      <main className={classes.root}>
        <header className={classes.header}>
          <Group gap="xs">
            <IconSparkles size={18} />
            <Text fw={600}>Layers</Text>
            <Text size="xs" c="dimmed">
              Демо
            </Text>
          </Group>
          <Group gap="sm" className={classes.controls}>
            <Select
              aria-label="Сценарий"
              value={scenario}
              onChange={(v) => reset(v as Scenario)}
              allowDeselect={false}
              data={[
                { value: 'read', label: 'Поиск страниц' },
                { value: 'create', label: 'Создание страницы' },
                { value: 'empty', label: 'Нет результатов' },
                { value: 'error', label: 'Ошибка сервиса' },
              ]}
            />
            <Switch
              label="Компактная история"
              checked={compact}
              onChange={(e) => setCompact(e.currentTarget.checked)}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Начать заново"
              title="Начать заново"
              onClick={() => reset()}
            >
              <IconRefresh size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Сменить тему"
              title="Сменить тему"
              onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Group>
        </header>
        <section className={classes.chat} aria-label="Чат">
          <AgentChat
            key={run}
            messages={messages}
            status={
              phase === 'waiting'
                ? 'submitted'
                : busy
                  ? 'streaming'
                  : phase === 'error'
                    ? 'error'
                    : 'ready'
            }
            onSend={send}
            onStop={stop}
            onRetry={() => {
              setPhase('waiting');
              setText('');
            }}
            error={
              phase === 'error'
                ? new Error('Сервис временно не ответил. Попробуйте позже.')
                : undefined
            }
            presentation={compact ? quietPresentation : 'cards'}
            toolCatalog={CATALOG}
            approvals={approvals}
            contentWidth={760}
            alignComposer
            showCopyToolbar
            labels={LABELS}
            locale="ru"
            workingRow
            toolActivity
            animateAppearance
            frameBatched
            toolArgs={{
              'tool-mcp__layers__*': (_part, ctx) =>
                scenario === 'create'
                  ? `Приватная страница: ${PAGE}`
                  : `Запрос: ${String(ctx.args.query ?? prompt)}`,
            }}
            toolOutputs={{
              'tool-mcp__layers__*': () =>
                phase === 'error'
                  ? 'Сервис не ответил'
                  : scenario === 'create'
                    ? 'Приватная страница'
                    : scenario === 'empty'
                      ? 'Нет совпадений'
                      : '3 страницы',
            }}
            emptyState={{
              layout: 'welcome',
              avatar: <IconSparkles size={28} />,
              title: 'С чего начнём?',
              actions: [
                {
                  id: 'pages',
                  label: 'Найти страницы',
                  value: 'Найди страницы команды и покажи план на неделю',
                  icon: <IconFileText />,
                },
                { id: 'plan', label: 'Подготовить план', value: 'Помоги составить план на неделю' },
              ],
            }}
          />
        </section>
        <Modal
          opened={!!page}
          onClose={() => {
            window.location.hash = '';
            setPage('');
          }}
          title={page === 'plan' ? PAGE : page === 'goals' ? 'Цели команды' : 'Заметки встречи'}
          size="lg"
        >
          <Markdown
            content={
              page === 'plan'
                ? PAGE_CONTENT
                : 'Материал команды для демонстрации перехода по ссылке.'
            }
          />
        </Modal>
      </main>
    </AiKitProvider>
  );
}
