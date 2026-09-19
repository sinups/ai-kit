import type { AgentChatLabels } from '@sinups/ai-kit';
import type { KitLabels, Messages } from './en';

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? one
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? few
        : many;
  return `${count} ${word}`;
}

const TOOL_OUTPUT_LABELS = {
  items: (count: number) => plural(count, 'результат', 'результата', 'результатов'),
  empty: 'Ничего не найдено',
  more: (count: number) => `ещё ${count}`,
};

const TOOL_CALL_LABELS = {
  queued: 'В очереди',
  awaitingPermission: 'Ждёт подтверждения',
  rejected: 'Отклонено',
  renderError: 'Не удалось показать вызов',
  interrupted: 'Прервано',
};

const CHAT_LABELS: Partial<AgentChatLabels> = {
  errorTitle: 'Запрос не выполнен',
  durationUnits: { hours: ' ч', minutes: ' мин', seconds: ' с', milliseconds: ' мс' },
  messageList: {
    newMessages: (count) => plural(count, 'новое сообщение', 'новых сообщения', 'новых сообщений'),
    scrollToPrompt: 'К вопросу',
    working: 'Работаю',
    planning: 'Работаю…',
    copyMessage: 'Скопировать сообщение',
    copied: 'Скопировано',
    messageActions: 'Действия с сообщением',
    toolRuns: {
      reads: (count) => `прочитал ${plural(count, 'файл', 'файла', 'файлов')}`,
      edits: (count) => `изменил ${plural(count, 'файл', 'файла', 'файлов')}`,
      searches: (count) => `искал по ${plural(count, 'шаблону', 'шаблонам', 'шаблонам')}`,
      webSearches: (count) => `искал в сети ${plural(count, 'раз', 'раза', 'раз')}`,
      otherTools: (count) =>
        `использовал ${plural(count, 'инструмент', 'инструмента', 'инструментов')}`,
      reading: 'Читаю…',
      editing: 'Меняю…',
      searching: 'Ищу…',
      working: 'Работаю…',
      thought: 'думал',
    },
  },
  errorMessage: {
    title: 'Что-то пошло не так',
    retry: 'Повторить',
    retrying: (secondsLeft, retry) => {
      const attempt = retry.maxAttempts
        ? `${retry.attempt} из ${retry.maxAttempts}`
        : `${retry.attempt}`;
      return secondsLeft > 0
        ? `Повтор через ${secondsLeft} с · попытка ${attempt}`
        : `Повторяю · попытка ${attempt}`;
    },
    resetsAt: (time) => `Снова доступно в ${time}`,
    showMore: 'Показать полностью',
    showLess: 'Свернуть',
  },
  turnSummary: {
    worked: (duration) => `Заняло ${duration}`,
    tokens: (used, budget) => (budget ? `${used} / ${budget}` : `${used} токенов`),
    backgroundTasks: (count) => `В фоне: ${plural(count, 'задача', 'задачи', 'задач')}`,
  },
  mcpTool: {
    ...TOOL_OUTPUT_LABELS,
    preparing: 'Готовлю вызов {name}',
    interrupted: '{name}: прервано',
    arguments: 'Аргументы',
    failed: 'Ошибка',
    result: 'Результат',
  },
  toolCall: TOOL_CALL_LABELS,
  thinkingTool: {
    thinking: 'Думаю',
    thought: (duration) => (duration ? `Думал ${duration}` : 'Думал'),
  },
  toolRow: {
    ...TOOL_CALL_LABELS,
    ...TOOL_OUTPUT_LABELS,
    hiddenLines: (count) => `… ещё ${plural(count, 'строка', 'строки', 'строк')}`,
    running: 'Выполняется…',
    approved: 'Разрешено',
    outcomeRejected: 'Отклонено',
    noOutput: '(Пустой ответ)',
    showResult: 'показать результат',
  },
  toolCard: {
    taskRunning: 'Выполняю задачу',
    taskCompleted: 'Задача выполнена',
    taskInterrupted: 'Задача прервана',
    agentRunning: 'Работает агент',
    agentCompleted: 'Агент закончил',
    agentInterrupted: 'Агент прерван',
    running: 'Выполняю {name}',
  },
};

const KIT: KitLabels = {
  chat: CHAT_LABELS,
  chatHeader: { header: 'Шапка чата' },
  approval: {
    approve: 'Разрешить',
    reject: 'Отклонить',
    approved: 'Разрешено',
    skipped: 'Отклонено',
    starting: 'Запускаю',
    waiting: 'Жду очереди',
    canceled: 'Отменено',
    feedback: 'Отклонить с пояснением',
    feedbackPlaceholder: 'Скажите агенту, что сделать вместо этого',
    feedbackBack: 'Назад',
    feedbackSend: 'Отправить',
    moreOptions: 'Другие варианты',
    explain: 'Почему?',
    risk: { low: 'Низкий риск', medium: 'Средний риск', high: 'Высокий риск' },
    showReasoning: 'Показать обоснование',
    hideReasoning: 'Скрыть обоснование',
    explainError: 'Не удалось загрузить объяснение',
    retry: 'Повторить',
    alwaysAllow: 'Всегда разрешать',
    ruleInput: 'Правило доступа',
    ruleConfirm: 'Сохранить',
    ruleBack: 'Назад',
    matchedRule: 'Спрошено из-за правила:',
    scopes: { once: 'один раз', session: 'в этом чате' },
  },
  serverDetail: {
    tools: 'Инструменты',
    resources: 'Ресурсы',
    prompts: 'Промпты',
    configuration: 'Настройки',
    searchTools: 'Поиск инструментов',
    noTools: 'Инструментов нет',
    showSchema: 'Показать схему',
    hideSchema: 'Скрыть схему',
    noInput: 'Без аргументов',
    noResources: 'Ресурсов нет',
    noPrompts: 'Промптов нет',
    notConnected: 'Подключите сервер, чтобы увидеть, что он умеет',
    reconnect: 'Переподключить',
    authenticate: 'Войти',
    enable: 'Включить',
    disable: 'Выключить',
    edit: 'Изменить',
    remove: 'Удалить',
    notAuthenticated: 'Доступно после входа',
    notEnabled: 'Включите сервер, чтобы увидеть, что он умеет',
    connectionFailed: 'Не удалось подключиться',
    needsAuth: 'Войдите на сервер, чтобы пользоваться его инструментами',
    actionFailed: 'Действие не выполнено',
    dismiss: 'Скрыть',
    removeTitle: 'Удалить сервер',
    removeMessage: '{name} и его инструменты станут недоступны агенту.',
    cancel: 'Отмена',
    version: 'Версия',
    transport: 'Транспорт',
    scope: 'Где настроен',
    command: 'Команда',
    arguments: 'Аргументы',
    url: 'Адрес',
    environment: 'Переменные окружения',
    headers: 'Заголовки',
    capabilities: 'Возможности',
    instructions: 'Инструкции сервера',
    showValue: 'Показать значение',
    hideValue: 'Скрыть значение',
    promptArguments: 'Аргументы',
    status: {
      connected: 'Подключён',
      connecting: 'Подключается',
      disconnected: 'Отключён',
      error: 'Ошибка',
      'needs-auth': 'Нужен вход',
      disabled: 'Выключен',
    },
    scopes: { user: 'Пользователь', project: 'Проект', local: 'Локально' },
    transports: { stdio: 'stdio', http: 'HTTP', sse: 'SSE' },
    annotations: {
      'read-only': { label: 'только чтение', description: 'Ничего не меняет' },
      destructive: { label: 'удаляет', description: 'Может изменить или удалить данные' },
      idempotent: { label: 'повторяемый', description: 'Повторный вызов ничего не добавляет' },
      'open-world': { label: 'внешний', description: 'Обращается к внешним системам' },
    },
  },
  rulesPanel: {
    title: 'Правила доступа',
    description:
      'Правила решают, какие вызовы проходят без вопроса, какие требуют подтверждения, а какие запрещены.',
    addRule: 'Добавить правило',
    edit: 'Изменить',
    delete: 'Удалить',
    search: 'Поиск',
    cancel: 'Отмена',
    emptyRulesTitle: 'Правил пока нет',
    emptyRulesDescription: 'Разрешите вызов «всегда» — и правило появится здесь.',
  },
  input: {
    pastedText: 'Вставленный текст {id}',
    pastedTextLines: '{lines} строк',
    removePastedText: 'Убрать вставленный текст',
    queued: 'В очереди',
    removeQueuedMessage: 'Убрать сообщение из очереди',
    removeContext: 'Убрать {label}',
    restoreContext: 'Вернуть контекст: {label}',
  },
  welcome: { actions: 'С чего начать' },
  contextUsage: { compact: 'Сжать переписку' },
};

export const ru: Messages = {
  locale: 'ru-RU',
  languageName: 'Русский',
  title: 'MCP-чат',
  header: {
    inspector: 'Серверы и правила',
    showInspector: 'Показать серверы и правила',
    toggleTheme: 'Сменить тему',
    language: 'Язык',
  },
  me: 'я',
  context: {
    description: 'Уходит вместе с каждым сообщением, пока вы его не уберёте',
  },
  composer: {
    placeholder: 'Спросите что-нибудь…',
    approvalMode: 'Режим подтверждения',
    approvalModeTitle: 'Режим',
    chooseModel: 'Выбрать модель',
    model: 'Модель',
    contextUsage: 'Использование контекста',
  },
  welcome: {
    title: 'Чат с вашими MCP-серверами',
    description:
      'Спросите про файлы, документацию библиотек или устройство репозитория — ответ приходит из подключённых серверов. Перед любыми изменениями чат спросит разрешения.',
    prompts: {
      team: 'Кто в команде и в каких часовых поясах?',
      release: 'Что нового в последнем релизе?',
      note: 'Запиши в notes.md три шага онбординга одной строкой каждый',
      docs: 'Как сделать Splitter в Mantine?',
      repo: 'Что внутри репозитория mantinedev/mantine?',
    },
    short: {
      team: 'Команда',
      release: 'Что нового',
      docs: 'Splitter в Mantine',
    },
  },
  approvalModes: [
    {
      id: 'ask-writes',
      label: 'Спрашивать',
      badge: 'По умолчанию',
      description: 'Чтение идёт сразу, запись и удаление ждут вашего решения',
    },
    { id: 'ask-all', label: 'Всегда спрашивать', description: 'Каждый вызов ждёт вашего решения' },
    {
      id: 'read-only',
      label: 'Только чтение',
      description: 'Инструменты, которые что-то меняют, не запускаются',
    },
    { id: 'auto', label: 'Без вопросов', description: 'Все вызовы выполняются сразу' },
  ],
  approval: {
    options: [
      { value: 'once', label: 'Разрешить один раз', description: 'В следующий раз спрошу снова' },
      {
        value: 'session',
        label: 'Разрешить в этом чате',
        description: 'Пока чат не начат заново',
      },
    ],
    alwaysAllowTool: 'Всегда разрешать этот инструмент',
    byRule: 'по правилу',
    interrupted: 'ход прерван',
    automatic: 'автоматически',
    effect: {
      read: () => 'Только читает, ничего не меняет.',
      write: (server) => `Запишет изменения в ${server}.`,
      destructive: () => 'Может изменить или удалить данные.',
      unmarked: () =>
        'Сервер не отметил инструмент как только читающий — считаем, что он может изменять данные.',
    },
    askedForEveryCall: 'Вы попросили спрашивать про каждый вызов.',
    needsPermission: 'Без вашего разрешения вызов не выполнится.',
  },
  chat: {
    interrupted: 'Прервано: ход закончился раньше, чем инструмент ответил.',
    approvalFailed: 'Сервер не принял решение. Попробуйте ещё раз.',
    chatFailed: 'Чат ответил ошибкой {status}.',
  },
  serverLost: {
    title: (server) => `${server} недоступен`,
    fallback: 'Сервер перестал отвечать.',
    reconnect: 'Переподключить',
  },
  inspector: {
    servers: 'Серверы',
    rules: 'Правила',
    noServers: 'MCP-серверы не настроены.',
    serverUnavailable: (server) => `Сервер ${server} недоступен`,
    toolCount: (count) => plural(count, 'инструмент', 'инструмента', 'инструментов'),
    status: {
      connected: 'Подключён',
      connecting: 'Подключается',
      disconnected: 'Отключён',
      error: 'Ошибка',
      'needs-auth': 'Нужен вход',
      disabled: 'Выключен',
    },
  },
  toolTitles: {
    'files/read_text_file': 'Прочитать файл',
    'files/read_file': 'Прочитать файл',
    'files/read_multiple_files': 'Прочитать файлы',
    'files/write_file': 'Записать файл',
    'files/edit_file': 'Изменить файл',
    'files/create_directory': 'Создать папку',
    'files/list_directory': 'Посмотреть папку',
    'files/directory_tree': 'Посмотреть дерево папок',
    'files/move_file': 'Переместить файл',
    'files/search_files': 'Найти файлы',
    'files/get_file_info': 'Сведения о файле',
    'files/list_allowed_directories': 'Доступные папки',
    'context7/resolve-library-id': 'Найти библиотеку в Context7',
    'context7/query-docs': 'Прочитать документацию',
    'deepwiki/ask_question': 'Спросить про репозиторий',
    'deepwiki/read_wiki_structure': 'Посмотреть оглавление вики',
    'deepwiki/read_wiki_contents': 'Прочитать вики',
  },
  kit: KIT,
};
