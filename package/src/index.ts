import './styles/vars.module.css';

export { TextShimmer } from './TextShimmer/TextShimmer';
export type { TextShimmerProps } from './TextShimmer/TextShimmer';
export { SpiralLoader } from './SpiralLoader/SpiralLoader';
export type { SpiralLoaderProps } from './SpiralLoader/SpiralLoader';
export { ToolRowBase } from './ToolRowBase/ToolRowBase';
export type { ToolRowBaseProps } from './ToolRowBase/ToolRowBase';

export { useToolComplete } from './hooks/use-tool-complete';
export { useStreamingText } from './hooks/use-streaming-text';
export type { UseStreamingTextOptions } from './hooks/use-streaming-text';
export { useInputTyping } from './hooks/use-input-typing';

export {
  mapToolInvocationToStep,
  mapToolStateToStepState,
  mapToolNameToVariant,
} from './utils/tool-adapters';
export type { ToolInvocation } from './utils/tool-adapters';
export { getToolStatus, areToolPropsEqual } from './utils/format-tool';
export type { ToolStatus } from './utils/format-tool';
export { normalizeToolPart, normalizeAssistantToolParts } from './utils/tool-part-normalizer';
export { diffLines, countDiffStats } from './utils/line-diff';

export { FileExtIcon } from './icons/FileExtIcon';
export type { FileExtIconProps } from './icons/FileExtIcon';
export { AgentModeIcon, PlanModeIcon } from './icons/mode-icons';
export type { ModeIconProps } from './icons/mode-icons';
export type { SourceType } from './icons/source-icons';

export type {
  ChatStatus,
  ChatMessage,
  MessagePart,
  TextPart,
  ErrorPart,
  FilePart,
  ToolPart,
  ToolPartState,
  CompactionPart,
  CollapseToolRunsOptions,
  ChatClassNames,
  ChatSlots,
  ModelOption,
  AgentChatProps,
  AgentChatEmptyState,
  CustomToolRendererProps,
  ToolRendererSlotProps,
  InputSuggestions,
  AttachedImage,
  AttachedFile,
} from './types';
export type { TimelineStep, ToolCallStep, StepState, DiffLine, Turn } from './types/timeline';

export { AgentChat } from './AgentChat/AgentChat';
export type { ChatWelcomeAction } from './AgentChat/ChatWelcome';
export { MessageList, DEFAULT_MESSAGE_LIST_LABELS } from './MessageList/MessageList';
export type { MessageListProps, MessageListLabels } from './MessageList/MessageList';
export { UserMessage, DEFAULT_USER_MESSAGE_LABELS } from './UserMessage/UserMessage';
export type { UserMessageProps, UserMessageLabels } from './UserMessage/UserMessage';
export { ErrorMessage, DEFAULT_ERROR_MESSAGE_LABELS } from './ErrorMessage/ErrorMessage';
export type {
  ErrorMessageProps,
  ErrorMessageRetry,
  ErrorMessageLabels,
} from './ErrorMessage/ErrorMessage';
export { Markdown } from './Markdown/Markdown';
export type { MarkdownProps } from './Markdown/Markdown';
export { ImageLightbox } from './ImageLightbox/ImageLightbox';
export type { ImageLightboxProps, LightboxImage } from './ImageLightbox/ImageLightbox';

export { InputBar, DEFAULT_INPUT_BAR_LABELS } from './input/InputBar';
export type { InputBarProps, QueuedMessage, InputBarLabels } from './input/InputBar';
export type { CompletionItem, CompletionSource } from './input/use-completion-items';

export type { CompletionToken } from './input/completion-token';
export { AttachmentButton } from './input/AttachmentButton';
export type { AttachmentButtonProps, AttachmentButtonIcon } from './input/AttachmentButton';
export { FileAttachment } from './input/FileAttachment';
export type { FileAttachmentProps } from './input/FileAttachment';
export { SendButton } from './input/SendButton';
export type { SendButtonProps } from './input/SendButton';
export { Suggestions } from './input/Suggestions';
export type { SuggestionsProps, SuggestionItem } from './input/Suggestions';
export { ModelPicker, ModelBadge } from './input/ModelPicker';
export type { ModelPickerProps, ModelBadgeProps } from './input/ModelPicker';
export { ModeSelector } from './input/ModeSelector';
export type { ModeSelectorProps, ModeOption } from './input/ModeSelector';
export { InputPopover } from './input/InputPopover';
export type { InputPopoverProps, PopoverSide, PopoverAlign } from './input/InputPopover';
export { QuestionPrompt } from './question/QuestionPrompt';
export type {
  QuestionPromptProps,
  QuestionConfig,
  QuestionOption,
  QuestionAnswer,
} from './question/QuestionPrompt';
export { QuestionTool } from './question/QuestionTool';
export type { QuestionToolProps, QuestionToolPart } from './question/QuestionTool';

export { ToolRenderer } from './tools/ToolRenderer';
export type { ToolRendererProps } from './tools/ToolRenderer';
export { BashTool, BashToolTerminalCard } from './tools/BashTool';
export type { BashToolProps, BashToolTerminalCardProps } from './tools/BashTool';
export { EditTool, EditToolDiffCard } from './tools/EditTool';
export type { EditToolProps, EditToolDiffCardProps } from './tools/EditTool';
export { DiffView } from './tools/DiffView';
export type { DiffViewProps } from './tools/DiffView';
export { SearchTool, SearchGroupRich } from './tools/SearchTool';
export type { SearchToolProps, SearchGroupRichProps, SearchResult } from './tools/SearchTool';
export { TodoTool } from './tools/TodoTool';
export type { TodoToolProps, TodoItem, TodoChange, DetectedChanges } from './tools/TodoTool';
export { PlanTool } from './tools/PlanTool';
export type { PlanToolProps, Plan } from './tools/PlanTool';
export { ToolGroup } from './tools/ToolGroup';
export type { ToolGroupProps } from './tools/ToolGroup';
export { SubagentTool } from './tools/SubagentTool';
export type { SubagentToolProps } from './tools/SubagentTool';
export { McpTool, unwrapMcpOutput } from './tools/McpTool';
export type { McpToolProps } from './tools/McpTool';
export { ThinkingTool, ThinkingCollapsed } from './tools/ThinkingTool';
export type { ThinkingToolProps, ThinkingCollapsedProps } from './tools/ThinkingTool';
export { GenericTool, GenericToolRow } from './tools/GenericTool';
export type { GenericToolProps, GenericToolRowProps } from './tools/GenericTool';
export { ActionRow } from './tools/ActionRow';
export type { ActionRowProps } from './tools/ActionRow';
export { ToolApprovalFooter, DEFAULT_TOOL_APPROVAL_LABELS } from './tools/ToolApprovalFooter';
export type {
  ToolApproval,
  ToolApprovalFooterProps,
  ToolApprovalOption,
  ToolApprovalLabels,
} from './tools/ToolApprovalFooter';
export { toolRegistry, parseMcpToolType } from './tools/tool-registry';
export type { ToolMeta, ToolVariant, McpToolInfo } from './tools/tool-registry';
export { routeToolCall } from './tools/tool-router';

export { ElicitationForm, DEFAULT_ELICITATION_FORM_LABELS } from './elicitation/ElicitationForm';
export type {
  ElicitationFormProps,
  ElicitationAction,
  ElicitationFormLabels,
} from './elicitation/ElicitationForm';
export {
  getElicitationFields,
  validateElicitationField,
  buildElicitationContent,
} from './elicitation/elicitation-schema';
export type {
  ElicitationRequestedSchema,
  ElicitationPrimitiveSchema,
  ElicitationStringSchema,
  ElicitationNumberSchema,
  ElicitationBooleanSchema,
  ElicitationMultiSelectSchema,
  ElicitationContent,
  ElicitationValue,
  ElicitationField,
} from './elicitation/elicitation-schema';

export { AgentStatus, DEFAULT_AGENT_STATUS_LABELS } from './AgentStatus/AgentStatus';
export type { AgentStatusProps, AgentStatusLabels } from './AgentStatus/AgentStatus';
export { useStalled } from './AgentStatus/use-stalled';
export type { UseStalledOptions } from './AgentStatus/use-stalled';

export { ContextUsage, DEFAULT_CONTEXT_USAGE_LABELS } from './ContextUsage/ContextUsage';
export type {
  ContextUsageProps,
  ContextUsageSegment,
  ContextUsageLabels,
} from './ContextUsage/ContextUsage';
export { getUsageLevel, getUsageRatio } from './ContextUsage/context-usage';
export type { ContextUsageLevel } from './ContextUsage/context-usage';

export {
  CompactBoundary,
  DEFAULT_COMPACT_BOUNDARY_LABELS,
} from './CompactBoundary/CompactBoundary';
export type {
  CompactBoundaryProps,
  CompactBoundaryLabels,
} from './CompactBoundary/CompactBoundary';

export { formatTokens } from './utils/format-tokens';
export type { ContentWidth } from './utils/content-width';

export { Wizard, DEFAULT_WIZARD_LABELS } from './primitives/Wizard/Wizard';
export type { WizardProps, WizardLabels } from './primitives/Wizard/Wizard';
export { WizardModal } from './primitives/Wizard/WizardModal';
export type { WizardModalProps } from './primitives/Wizard/WizardModal';
export { useWizard } from './primitives/Wizard/use-wizard';
export type {
  UseWizardOptions,
  UseWizardReturn,
  WizardNextResult,
} from './primitives/Wizard/use-wizard';
export type { WizardStep, WizardStepContext, WizardErrors } from './primitives/Wizard/wizard-state';

export { StatusBadge } from './primitives/StatusBadge/StatusBadge';
export type { StatusBadgeProps } from './primitives/StatusBadge/StatusBadge';
export { AGENT_UI_STATUSES } from './primitives/StatusBadge/status-meta';
export type { AgentUiStatus, StatusMeta } from './primitives/StatusBadge/status-meta';

export { ShortcutHint } from './primitives/ShortcutHint/ShortcutHint';
export type { ShortcutHintProps } from './primitives/ShortcutHint/ShortcutHint';
export { formatShortcut, detectShortcutPlatform } from './primitives/ShortcutHint/format-shortcut';
export type { ShortcutPlatform } from './primitives/ShortcutHint/format-shortcut';

export { EntityList, DEFAULT_ENTITY_LIST_LABELS } from './primitives/EntityList/EntityList';
export type {
  EntityListProps,
  EntityListItemState,
  EntityListEmpty,
  EntityListSearch,
  EntityListFilters,
  EntityListFilterOption,
  EntityListLabels,
} from './primitives/EntityList/EntityList';
export {
  EntityListItem,
  DEFAULT_ENTITY_LIST_ITEM_LABELS,
} from './primitives/EntityList/EntityListItem';
export type {
  EntityListItemProps,
  EntityListItemAction,
  EntityListItemLabels,
} from './primitives/EntityList/EntityListItem';

export type { EntityGroup } from './primitives/EntityList/entity-list';

export {
  CommandPalette,
  DEFAULT_COMMAND_PALETTE_LABELS,
} from './primitives/CommandPalette/CommandPalette';
export type {
  CommandPaletteProps,
  CommandPaletteLabels,
} from './primitives/CommandPalette/CommandPalette';

export type {
  PaletteCommand,
  PaletteEntry,
  PaletteSection,
} from './primitives/CommandPalette/command-palette';
export { fuzzyFilter } from './primitives/CommandPalette/fuzzy';
export type { FuzzyMatch, FuzzyKey, FuzzyResult } from './primitives/CommandPalette/fuzzy';
export { useFuzzySearch } from './primitives/CommandPalette/use-fuzzy-search';
export type { UseFuzzySearchOptions } from './primitives/CommandPalette/use-fuzzy-search';

export {
  SettingsLayout,
  DEFAULT_SETTINGS_LAYOUT_LABELS,
} from './primitives/SettingsLayout/SettingsLayout';
export type {
  SettingsLayoutProps,
  SettingsLayoutLabels,
} from './primitives/SettingsLayout/SettingsLayout';
export { SettingsSection } from './primitives/SettingsLayout/SettingsSection';
export type { SettingsSectionProps } from './primitives/SettingsLayout/SettingsSection';
export { SettingRow } from './primitives/SettingsLayout/SettingRow';
export type { SettingRowProps, SettingRowLayout } from './primitives/SettingsLayout/SettingRow';
export { filterSettingsNav, groupSettingsNav } from './primitives/SettingsLayout/settings-nav';
export type { SettingsNavItem, SettingsNavGroup } from './primitives/SettingsLayout/settings-nav';

export { MasterDetail, DEFAULT_MASTER_DETAIL_LABELS } from './primitives/MasterDetail/MasterDetail';
export type { MasterDetailProps, MasterDetailLabels } from './primitives/MasterDetail/MasterDetail';

export {
  KeyValueEditor,
  DEFAULT_KEY_VALUE_EDITOR_LABELS,
} from './primitives/KeyValueEditor/KeyValueEditor';
export type {
  KeyValueEditorProps,
  KeyValueEditorLabels,
} from './primitives/KeyValueEditor/KeyValueEditor';
export {
  parseKeyValueText,
  validateKeyValuePairs,
  createKeyValuePair,
  envKeyValidator,
  headerKeyValidator,
} from './primitives/KeyValueEditor/key-value';
export type { KeyValuePair, KeyValidator } from './primitives/KeyValueEditor/key-value';

export { SchemaView, DEFAULT_SCHEMA_VIEW_LABELS } from './primitives/SchemaView/SchemaView';
export type { SchemaViewProps, SchemaViewLabels } from './primitives/SchemaView/SchemaView';
export { flattenSchema, getSchemaTypeLabel } from './primitives/SchemaView/schema';
export type { JsonSchema, JsonSchemaType, SchemaRow } from './primitives/SchemaView/schema';

export {
  ConfirmDialog,
  DEFAULT_CONFIRM_DIALOG_LABELS,
} from './primitives/ConfirmDialog/ConfirmDialog';
export type {
  ConfirmDialogLabels,
  ConfirmDialogProps,
} from './primitives/ConfirmDialog/ConfirmDialog';
export type { PendingActionOptions, UsePendingActionsReturn } from './hooks/use-pending-actions';

export { DEFAULT_MCP_SERVER_DETAIL_LABELS, McpServerDetail } from './mcp/McpServerDetail';
export type {
  McpServerDetailLabels,
  McpServerDetailProps,
  McpServerDetailTab,
} from './mcp/McpServerDetail';
export { DEFAULT_MCP_SERVER_LIST_LABELS, McpServerList } from './mcp/McpServerList';
export type { McpServerListLabels, McpServerListProps } from './mcp/McpServerList';
export {
  DEFAULT_MCP_SERVER_WIZARD_LABELS,
  McpServerWizard,
  McpServerWizardModal,
} from './mcp/McpServerWizard';
export type {
  McpServerWizardLabels,
  McpServerWizardModalProps,
  McpServerWizardProps,
} from './mcp/McpServerWizard';
export { DEFAULT_MCP_SETTINGS_PANEL_LABELS, McpSettingsPanel } from './mcp/McpSettingsPanel';
export type { McpSettingsPanelLabels, McpSettingsPanelProps } from './mcp/McpSettingsPanel';
export {
  DEFAULT_MCP_TOOL_ANNOTATION_LABELS,
  McpToolAnnotationBadges,
} from './mcp/McpToolAnnotationBadges';
export type {
  McpToolAnnotationBadgesProps,
  McpToolAnnotationLabels,
} from './mcp/McpToolAnnotationBadges';
export { DEFAULT_MCP_TOOL_DETAIL_LABELS, McpToolDetail } from './mcp/McpToolDetail';
export type { McpToolDetailLabels, McpToolDetailProps } from './mcp/McpToolDetail';
export { McpTransportIcon } from './mcp/McpTransportIcon';
export type { McpTransportIconProps } from './mcp/McpTransportIcon';
export { createMcpServerDraft, isValidMcpUrl, splitMcpCommandLine } from './mcp/mcp-draft';
export type { McpDraftErrors, McpDraftLabels } from './mcp/mcp-draft';
export {
  getMcpAgentUiStatus,
  getMcpServerTarget,
  needsMcpAttention,
  getMcpToolAnnotationKinds,
  getMcpToolDisplayName,
  MCP_STATUS_LABELS,
  MCP_SCOPE_LABELS,
  MCP_SCOPE_ORDER,
} from './mcp/mcp-server';
export type {
  McpServerFilter,
  McpServerFilterOption,
  McpToolAnnotationKind,
} from './mcp/mcp-server';
export type {
  McpConfigWarning,
  McpConfigWarningKind,
  McpDiscoveredServer,
  McpPrompt,
  McpPromptArgument,
  McpResource,
  McpServer,
  McpServerCandidate,
  McpServerCapabilities,
  McpServerDraft,
  McpServerScope,
  McpServerStatus,
  McpToolAnnotations,
  McpToolDefinition,
  McpTransport,
} from './mcp/types';

export {
  AddPermissionRuleWizard,
  DEFAULT_ADD_PERMISSION_RULE_WIZARD_LABELS,
} from './permissions/AddPermissionRuleWizard';
export type {
  AddPermissionRuleWizardLabels,
  AddPermissionRuleWizardProps,
} from './permissions/AddPermissionRuleWizard';
export {
  DEFAULT_PERMISSION_MODE_SELECTOR_LABELS,
  PermissionModeSelector,
} from './permissions/PermissionModeSelector';
export type {
  PermissionModeSelectorLabels,
  PermissionModeSelectorProps,
} from './permissions/PermissionModeSelector';
export { PermissionRuleInput } from './permissions/PermissionRuleInput';
export type { PermissionRuleInputProps } from './permissions/PermissionRuleInput';
export {
  DEFAULT_PERMISSION_RULES_PANEL_LABELS,
  PermissionRulesPanel,
} from './permissions/PermissionRulesPanel';
export type {
  PermissionRuleSaveMode,
  PermissionRulesPanelLabels,
  PermissionRulesPanelProps,
  PermissionRulesTab,
} from './permissions/PermissionRulesPanel';
export {
  parseRule,
  formatRule,
  validateRule,
  describeRule,
  matchToolName,
  matchRule,
  getBroadRuleWarning,
  suggestRuleFromDenial,
  validateDirectoryPath,
  DEFAULT_PERMISSION_TOOLS,
  PERMISSION_RULE_EXAMPLES,
} from './permissions/permission-rule';
export type { ParsedPermissionRule, PermissionRuleValidation } from './permissions/permission-rule';
export { buildPermissionRule } from './permissions/rule-wizard';
export type { PermissionRuleDraft } from './permissions/rule-wizard';
export {
  EDITABLE_PERMISSION_SCOPES,
  PERMISSION_BEHAVIORS,
  PERMISSION_BEHAVIOR_ORDER,
  PERMISSION_MODES,
  PERMISSION_MODE_ORDER,
  PERMISSION_SCOPES,
  PERMISSION_SCOPE_ORDER,
} from './permissions/types';
export type {
  PermissionBehavior,
  PermissionBehaviorMeta,
  PermissionDenial,
  PermissionMode,
  PermissionModeMeta,
  PermissionRule,
  PermissionScope,
  PermissionScopeMeta,
  WorkspaceDirectory,
} from './permissions/types';

export { DEFAULT_HOOK_WIZARD_LABELS, HookWizard } from './hooks-config/HookWizard';
export type { HookWizardLabels, HookWizardProps } from './hooks-config/HookWizard';
export { DEFAULT_HOOKS_PANEL_LABELS, HooksPanel } from './hooks-config/HooksPanel';
export type { HookSaveMode, HooksPanelLabels, HooksPanelProps } from './hooks-config/HooksPanel';
export {
  eventSupportsMatcher,
  isRegexMatcher,
  validateMatcher,
  validateHookDraft,
  buildHook,
  describeMatcher,
  getHookPayloadExample,
  countHooksByEvent,
  getHookSummary,
  MAX_HOOK_TIMEOUT,
  DEFAULT_HOOK_MESSAGES,
  DEFAULT_HOOK_TOOLS,
} from './hooks-config/hook-wizard';
export type { HookDraft, HookDraftErrors, HookMessages } from './hooks-config/hook-wizard';
export { HOOK_EVENTS, HOOK_EVENT_ORDER, HOOK_SCOPES, HOOK_SCOPE_ORDER } from './hooks-config/types';
export type {
  HookConfig,
  HookEvent,
  HookEventMeta,
  HookEventText,
  HookEventTextOverrides,
  HookScope,
  HookScopeMeta,
  HookScopeText,
  HookScopeTextOverrides,
  HookType,
} from './hooks-config/types';

export type { GroupCheckState } from './agents/tool-selection';
export type {
  AgentDefinition,
  AgentDraft,
  AgentDraftErrors,
  AgentDraftField,
  AgentSource,
  AgentToolSelection,
  ToolCatalogItem,
} from './agents/types';
export {
  validateAgentName,
  validateAgentDraft,
  resolveAgentTools,
  summarizeTools,
  slugifyAgentName,
  createAgentDraft,
  AGENT_NAME_PATTERN,
  AGENT_DESCRIPTION_MIN_LENGTH,
  DEFAULT_AGENT_VALIDATION_MESSAGES,
  DEFAULT_AGENT_TOOL_SUMMARY_LABELS,
} from './agents/validate-agent';
export type {
  AgentValidationMessages,
  AgentToolSummaryLabels,
  ValidateAgentDraftOptions,
} from './agents/validate-agent';
export {
  AgentsSettingsPanel,
  DEFAULT_AGENTS_SETTINGS_PANEL_LABELS,
} from './agents/AgentsSettingsPanel/AgentsSettingsPanel';
export type {
  AgentsSettingsPanelLabels,
  AgentsSettingsPanelProps,
} from './agents/AgentsSettingsPanel/AgentsSettingsPanel';
export { AgentDetail, DEFAULT_AGENT_DETAIL_LABELS } from './agents/AgentDetail/AgentDetail';
export type { AgentDetailLabels, AgentDetailProps } from './agents/AgentDetail/AgentDetail';
export {
  AgentCreateWizard,
  DEFAULT_AGENT_CREATE_WIZARD_LABELS,
  toAgentDraft,
} from './agents/AgentCreateWizard/AgentCreateWizard';
export type {
  AgentCreateMethod,
  AgentCreateWizardLabels,
  AgentCreateWizardProps,
  AgentWizardValues,
} from './agents/AgentCreateWizard/AgentCreateWizard';
export { AgentAvatar } from './agents/AgentAvatar/AgentAvatar';
export type { AgentAvatarProps } from './agents/AgentAvatar/AgentAvatar';
export {
  AGENT_COLORS,
  AgentColorPicker,
  AgentIdentityFields,
  AgentModelFields,
  AgentPromptField,
  DEFAULT_AGENT_FIELD_LABELS,
} from './agents/AgentFields/AgentFields';
export type {
  AgentColorPickerProps,
  AgentFieldLabels,
  AgentIdentityFieldsProps,
  AgentModelFieldsProps,
  AgentPromptFieldProps,
} from './agents/AgentFields/AgentFields';
export { AgentList, DEFAULT_AGENT_LIST_LABELS } from './agents/AgentList/AgentList';
export type { AgentListLabels, AgentListProps } from './agents/AgentList/AgentList';
export { DEFAULT_TOOL_SELECTOR_LABELS, ToolSelector } from './agents/ToolSelector/ToolSelector';
export type { ToolSelectorLabels, ToolSelectorProps } from './agents/ToolSelector/ToolSelector';
export { AgentEditor, DEFAULT_AGENT_EDITOR_LABELS } from './agents/AgentEditor/AgentEditor';
export type { AgentEditorLabels, AgentEditorProps } from './agents/AgentEditor/AgentEditor';

export { DEFAULT_SKILL_CATALOG_LABELS, SkillCatalog } from './skills/SkillCatalog';
export type { SkillCatalogLabels, SkillCatalogProps } from './skills/SkillCatalog';
export { DEFAULT_SKILL_DETAIL_LABELS, SkillDetail } from './skills/SkillDetail';
export type { SkillDetailLabels, SkillDetailProps } from './skills/SkillDetail';
export { DEFAULT_SKILL_EDITOR_LABELS, SkillEditor } from './skills/SkillEditor';
export type { SkillEditorLabels, SkillEditorProps } from './skills/SkillEditor';
export { DEFAULT_SKILL_PICKER_LABELS, SkillPicker } from './skills/SkillPicker';
export type { SkillPickerLabels, SkillPickerProps } from './skills/SkillPicker';
export {
  DEFAULT_SKILLS_SETTINGS_PANEL_LABELS,
  DEFAULT_SKILL_REMOVE_LABELS,
  SkillsSettingsPanel,
} from './skills/SkillsSettingsPanel';
export type {
  SkillRemoveLabels,
  SkillsSettingsPanelLabels,
  SkillsSettingsPanelProps,
} from './skills/SkillsSettingsPanel';
export {
  validateSkillName,
  validateSkillDraft,
  toSkillSlug,
  searchSkills,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_PATTERN,
  SKILL_SOURCES,
  SKILL_SOURCE_LABELS,
  SKILL_SEARCH_KEYS,
  DEFAULT_SKILL_VALIDATION_MESSAGES,
} from './skills/skill-utils';
export type {
  SkillSourceFilter,
  SkillValidationMessages,
  SkillDraftErrors,
} from './skills/skill-utils';
export type { Skill, SkillDraft, SkillSource } from './skills/types';

export { DEFAULT_EXPORT_DIALOG_LABELS, ExportDialog } from './sessions/ExportDialog';
export type { ExportDialogLabels, ExportDialogProps, ExportToggles } from './sessions/ExportDialog';
export { DEFAULT_SESSION_LIST_LABELS, SessionList } from './sessions/SessionList';
export type { SessionListLabels, SessionListProps } from './sessions/SessionList';
export { DEFAULT_SESSION_PREVIEW_LABELS, SessionPreview } from './sessions/SessionPreview';
export type { SessionPreviewLabels, SessionPreviewProps } from './sessions/SessionPreview';
export { downloadFile } from './sessions/download';
export { exportConversation, getExportFilename } from './sessions/export';
export { formatRelativeTime } from './sessions/format-relative-time';
export { groupSessionsByDate } from './sessions/group-sessions';
export type { SessionDateGroupLabels, SessionDateGroup } from './sessions/group-sessions';
export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  SessionDate,
  SessionFilter,
  SessionSummary,
} from './sessions/types';

export type { PlanApproveOption } from './message-actions/plan-approval';
export { getMessagePreview, buildRewindPoints } from './message-actions/rewind-points';
export type { RewindGroupLabels } from './message-actions/rewind-points';
export { parseSlashCommand } from './message-actions/slash-command';
export type { ParsedSlashCommand } from './message-actions/slash-command';

export type {
  FeedbackDetails,
  FeedbackReason,
  MessageFeedbackValue,
  MessageListActions,
  PlanDecision,
  RewindMode,
  RewindPoint,
  RewindRequest,
  SlashCommandInfo,
  SummarizeDirection,
  SummarizeRequest,
  ToolResultNoticeVariant,
} from './message-actions/types';
export type { AsyncActionState } from './message-actions/use-async-action';
export {
  DEFAULT_EDIT_MESSAGE_COMPOSER_LABELS,
  EditMessageComposer,
} from './message-actions/EditMessageComposer/EditMessageComposer';
export type {
  EditMessageComposerLabels,
  EditMessageComposerProps,
} from './message-actions/EditMessageComposer/EditMessageComposer';
export {
  DEFAULT_MEMORY_NOTICE_LABELS,
  MemoryNotice,
} from './message-actions/MemoryNotice/MemoryNotice';
export type {
  MemoryNoticeLabels,
  MemoryNoticeProps,
} from './message-actions/MemoryNotice/MemoryNotice';
export {
  DEFAULT_TOOL_RESULT_NOTICE_LABELS,
  ToolResultNotice,
} from './message-actions/ToolResultNotice/ToolResultNotice';
export type {
  ToolResultNoticeLabels,
  ToolResultNoticeProps,
} from './message-actions/ToolResultNotice/ToolResultNotice';
export {
  DEFAULT_FEEDBACK_FORM_LABELS,
  DEFAULT_FEEDBACK_REASONS,
  FeedbackForm,
} from './message-actions/FeedbackForm/FeedbackForm';
export type {
  FeedbackFormLabels,
  FeedbackFormProps,
} from './message-actions/FeedbackForm/FeedbackForm';
export { CommandChip } from './message-actions/CommandChip/CommandChip';
export type { CommandChipProps } from './message-actions/CommandChip/CommandChip';
export {
  DEFAULT_REWIND_DIALOG_LABELS,
  RewindDialog,
} from './message-actions/RewindDialog/RewindDialog';
export type {
  RewindDialogLabels,
  RewindDialogProps,
} from './message-actions/RewindDialog/RewindDialog';
export {
  DEFAULT_PLAN_APPROVAL_LABELS,
  PlanApproval,
} from './message-actions/PlanApproval/PlanApproval';
export type {
  PlanApprovalLabels,
  PlanApprovalProps,
} from './message-actions/PlanApproval/PlanApproval';
export {
  DEFAULT_MESSAGE_ACTIONS_LABELS,
  MessageActions,
} from './message-actions/MessageActions/MessageActions';
export type {
  MessageActionsLabels,
  MessageActionsProps,
} from './message-actions/MessageActions/MessageActions';

export { DEFAULT_EFFORT_LEVELS } from './model-settings/effort';
export type { McpStatusCount } from './model-settings/status-panel';
export type {
  DailyUsage,
  EffortLevel,
  EffortLevelValue,
  ModelUsage,
  OutputStyle,
  StatusAction,
  StatusMcpServer,
  StatusMemoryFile,
  UsageLimit,
  UsagePeriod,
  UsageSummary,
} from './model-settings/types';
export {
  formatCost,
  formatLimitValue,
  formatResetIn,
  formatUsageDay,
} from './model-settings/usage';
export type { UsageLevel } from './model-settings/usage';
export { OutputStylePicker } from './model-settings/OutputStylePicker/OutputStylePicker';
export type { OutputStylePickerProps } from './model-settings/OutputStylePicker/OutputStylePicker';
export {
  DEFAULT_MODEL_SETTINGS_PANEL_LABELS,
  ModelSettingsPanel,
} from './model-settings/ModelSettingsPanel/ModelSettingsPanel';
export type {
  ModelSettingsPanelLabels,
  ModelSettingsPanelProps,
  ModelSettingsSection,
} from './model-settings/ModelSettingsPanel/ModelSettingsPanel';
export { DEFAULT_STATUS_PANEL_LABELS, StatusPanel } from './model-settings/StatusPanel/StatusPanel';
export type { StatusPanelLabels, StatusPanelProps } from './model-settings/StatusPanel/StatusPanel';
export {
  DEFAULT_EFFORT_SELECTOR_LABELS,
  EffortSelector,
} from './model-settings/EffortSelector/EffortSelector';
export type {
  EffortSelectorLabels,
  EffortSelectorProps,
} from './model-settings/EffortSelector/EffortSelector';
export { DEFAULT_USAGE_PANEL_LABELS, UsagePanel } from './model-settings/UsagePanel/UsagePanel';
export type { UsagePanelLabels, UsagePanelProps } from './model-settings/UsagePanel/UsagePanel';

export { formatCommandUsage, toPaletteCommands } from './help/commands-help';
export type { HelpGroup } from './help/commands-help';
export type { CommandHelpItem, ShortcutHelpItem } from './help/types';
export { CommandsHelp, DEFAULT_COMMANDS_HELP_LABELS } from './help/CommandsHelp/CommandsHelp';
export type { CommandsHelpLabels, CommandsHelpProps } from './help/CommandsHelp/CommandsHelp';

export { TaskElapsed, TaskKindIcon } from './tasks/TaskMeta';
export type { TaskElapsedProps, TaskKindIconProps } from './tasks/TaskMeta';
export {
  getTaskStatusLabel,
  getTaskKindLabel,
  isTaskActive,
  canStopTask,
  canRetryTask,
  summarizeTasks,
  flattenTaskTree,
  buildTaskTree,
  findTask,
  toTimestamp,
  getTaskElapsedMs,
  getProgressPercent,
  countTasksByKind,
  matchesTaskQuery,
  describeTaskSummary,
  DEFAULT_BACKGROUND_TASK_LABELS,
  BACKGROUND_TASK_KINDS,
} from './tasks/task-utils';
export type {
  AgentIdentity,
  AgentMessageData,
  BackgroundTask,
  BackgroundTaskGroup,
  BackgroundTaskHiddenSummary,
  BackgroundTaskKind,
  BackgroundTaskLabels,
  BackgroundTaskProgress,
  BackgroundTaskStatus,
  BackgroundTaskSummary,
} from './tasks/types';
export { useNow } from './tasks/use-now';
export { AgentTree } from './tasks/AgentTree/AgentTree';
export type { AgentTreeProps } from './tasks/AgentTree/AgentTree';
export { BackgroundTasksDrawer } from './tasks/BackgroundTasksPanel/BackgroundTasksDrawer';
export type { BackgroundTasksDrawerProps } from './tasks/BackgroundTasksPanel/BackgroundTasksDrawer';
export { BackgroundTasksPanel } from './tasks/BackgroundTasksPanel/BackgroundTasksPanel';
export type { BackgroundTasksPanelProps } from './tasks/BackgroundTasksPanel/BackgroundTasksPanel';
export { TaskDetail } from './tasks/TaskDetail/TaskDetail';
export type { TaskDetailProps } from './tasks/TaskDetail/TaskDetail';
export { TaskList } from './tasks/TaskList/TaskList';
export type { TaskAction, TaskListProps } from './tasks/TaskList/TaskList';
export { TaskStatusPill } from './tasks/TaskStatusPill/TaskStatusPill';
export type { TaskStatusPillProps } from './tasks/TaskStatusPill/TaskStatusPill';

export { DiffStats, FileIcon, FileStatusBadge, getFileStatusLabel } from './diff/DiffMeta';
export type { DiffStatsProps, FileIconProps, FileStatusBadgeProps } from './diff/DiffMeta';
export type { DiffRowType, DiffRow, SplitDiffRow, CollapsedItem } from './diff/diff-rows';
export {
  computeFileStats,
  summarizeChanges,
  filterChanges,
  countChangesByStatus,
} from './diff/file-tree';
export type { FileTreeNode } from './diff/file-tree';

export type {
  DiffLabels,
  DiffSource,
  FileChange,
  FileChangeStatus,
  FileDecision,
  FileStats,
  WordSegment,
  WordSegmentType,
} from './diff/types';

export { DiffFileList } from './diff/DiffFileList/DiffFileList';
export type { DiffFileListProps, DiffFileListView } from './diff/DiffFileList/DiffFileList';
export { DiffFileView } from './diff/DiffFileView/DiffFileView';
export type { DiffFileViewProps, DiffViewMode } from './diff/DiffFileView/DiffFileView';
export { DiffReview } from './diff/DiffReview/DiffReview';
export type { DiffReviewProps, FileChangeAction } from './diff/DiffReview/DiffReview';
export { DiffReviewModal } from './diff/DiffReview/DiffReviewModal';
export type { DiffReviewModalProps } from './diff/DiffReview/DiffReviewModal';

export {
  DEFAULT_IDLE_RETURN_PROMPT_LABELS,
  IdleReturnPrompt,
} from './ChatNotices/IdleReturnPrompt';
export type { IdleReturnPromptLabels, IdleReturnPromptProps } from './ChatNotices/IdleReturnPrompt';
export {
  DEFAULT_SPEND_THRESHOLD_NOTICE_LABELS,
  SpendThresholdNotice,
} from './ChatNotices/SpendThresholdNotice';
export type {
  SpendThresholdNoticeAction,
  SpendThresholdNoticeLabels,
  SpendThresholdNoticeProps,
} from './ChatNotices/SpendThresholdNotice';
export { formatAwayDuration, formatSpend } from './ChatNotices/chat-notices';
export { CodeBlock, DEFAULT_CODE_BLOCK_LABELS } from './CodeBlock/CodeBlock';
export type { CodeBlockLabels, CodeBlockProps } from './CodeBlock/CodeBlock';
export { countCodeLines, getCollapsedLineCount } from './CodeBlock/code-lines';
export { ContextEventRow, DEFAULT_CONTEXT_EVENT_LABELS } from './ContextEventRow/ContextEventRow';
export type { ContextEventLabels, ContextEventRowProps } from './ContextEventRow/ContextEventRow';
export {
  ContextBreakdown,
  DEFAULT_CONTEXT_BREAKDOWN_LABELS,
} from './ContextUsage/ContextBreakdown';
export type {
  ContextBreakdownLabels,
  ContextBreakdownProps,
} from './ContextUsage/ContextBreakdown';
export {
  getGroupTokens,
  getBreakdownTotal,
  sortBreakdownItems,
  sortSuggestions,
  getGroupShade,
} from './ContextUsage/context-breakdown';
export type {
  ContextBreakdownItem,
  ContextBreakdownGroup,
  ContextSuggestionSeverity,
  ContextSuggestion,
} from './ContextUsage/context-breakdown';
export type { TruncatedErrorMessage } from './ErrorMessage/error-message';
export { HookActivity } from './HookActivity/HookActivity';
export type { HookActivityProps } from './HookActivity/HookActivity';
export { DEFAULT_HOOK_ACTIVITY_LABELS, getHookActivityTitle } from './HookActivity/hook-activity';
export type { HookActivityLabels } from './HookActivity/hook-activity';
export type { MarkdownStreamParts } from './Markdown/markdown-stream';

export { DEFAULT_TRANSCRIPT_SEARCH_LABELS, TranscriptSearch } from './MessageList/TranscriptSearch';
export type { TranscriptSearchLabels, TranscriptSearchProps } from './MessageList/TranscriptSearch';
export { findDomMatches, findTextMatches, stepMatchIndex } from './MessageList/transcript-search';
export type { TextMatch } from './MessageList/transcript-search';
export { TurnSummary } from './TurnSummary/TurnSummary';
export type { TurnSummaryProps } from './TurnSummary/TurnSummary';
export { DEFAULT_TURN_SUMMARY_LABELS, getTurnSummarySegments } from './TurnSummary/turn-summary';
export type { TurnSummaryLabels } from './TurnSummary/turn-summary';
export type { LongTextThreshold, CollapsedText } from './UserMessage/long-text';
export {
  DEFAULT_PASTED_TEXT_ATTACHMENT_LABELS,
  PastedTextAttachment,
} from './input/PastedTextAttachment';
export type {
  PastedTextAttachmentLabels,
  PastedTextAttachmentProps,
} from './input/PastedTextAttachment';
export {
  DEFAULT_PROMPT_HISTORY_SEARCH_LABELS,
  PromptHistorySearch,
} from './input/PromptHistorySearch';
export type {
  PromptHistorySearchLabels,
  PromptHistorySearchProps,
} from './input/PromptHistorySearch';
export {
  shouldCollapsePaste,
  insertPastePlaceholder,
  expandPastedText,
  prunePastes,
  removePastePlaceholder,
  formatPasteLabel,
} from './input/pasted-text';
export type { PasteCollapseThreshold, PastedText } from './input/pasted-text';
export {
  navigatePromptHistory,
  canBrowseOlder,
  canBrowseNewer,
  getSearchablePrompts,
} from './input/prompt-history';
export type { PromptHistoryState, PromptHistoryDirection } from './input/prompt-history';
export { DEFAULT_MCP_CONFIG_WARNINGS_LABELS, McpConfigWarnings } from './mcp/McpConfigWarnings';
export type { McpConfigWarningsLabels, McpConfigWarningsProps } from './mcp/McpConfigWarnings';
export {
  DEFAULT_MCP_DISCOVERED_SERVERS_LABELS,
  McpDiscoveredServers,
} from './mcp/McpDiscoveredServers';
export type {
  McpDiscoveredServersLabels,
  McpDiscoveredServersProps,
} from './mcp/McpDiscoveredServers';
export { DEFAULT_MCP_IMPORT_DIALOG_LABELS, McpImportDialog } from './mcp/McpImportDialog';
export type { McpImportDialogLabels, McpImportDialogProps } from './mcp/McpImportDialog';
export { resolveImportNames, validateImportNames, groupConfigWarnings } from './mcp/mcp-import';
export type { McpImportNameLabels, McpConfigWarningGroup } from './mcp/mcp-import';
export { DEFAULT_MEMORY_FILE_DETAIL_LABELS, MemoryFileDetail } from './memory/MemoryFileDetail';
export type { MemoryFileDetailLabels, MemoryFileDetailProps } from './memory/MemoryFileDetail';
export { DEFAULT_MEMORY_PANEL_LABELS, MemoryPanel } from './memory/MemoryPanel';
export type { MemoryPanelLabels, MemoryPanelProps } from './memory/MemoryPanel';
export {
  MEMORY_SCOPE_LABELS,
  MEMORY_SCOPE_ORDER,
  formatMemoryUpdatedAt,
  getMemoryFileName,
  matchesMemoryQuery,
  sortMemoryFiles,
} from './memory/memory-files';
export type { MemoryFile, MemoryScope } from './memory/types';
export { SettingsModal } from './primitives/SettingsLayout/SettingsModal';
export type { SettingsModalProps } from './primitives/SettingsLayout/SettingsModal';
export {
  DEFAULT_INVALID_SETTINGS_NOTICE_LABELS,
  InvalidSettingsNotice,
} from './primitives/ValidationErrorsList/InvalidSettingsNotice';
export type {
  InvalidSettingsNoticeLabels,
  InvalidSettingsNoticeProps,
} from './primitives/ValidationErrorsList/InvalidSettingsNotice';
export {
  DEFAULT_VALIDATION_ERRORS_LIST_LABELS,
  ValidationErrorsList,
} from './primitives/ValidationErrorsList/ValidationErrorsList';
export type {
  ValidationErrorsListLabels,
  ValidationErrorsListProps,
} from './primitives/ValidationErrorsList/ValidationErrorsList';
export {
  dedupeValidationErrors,
  fillValidationTemplate,
  getValidationErrorKey,
  getValidationSeverity,
  groupValidationErrors,
} from './primitives/ValidationErrorsList/validation-errors';
export type {
  SettingsValidationError,
  SettingsValidationSeverity,
  ValidationErrorGroup,
} from './primitives/ValidationErrorsList/validation-errors';
export {
  getInitialQuestionDraft,
  canSubmitQuestion,
  buildQuestionAnswer,
  formatQuestionAnswer,
} from './question/question-answer';
export type { QuestionDraft } from './question/question-answer';
export { OVERLAY_INNER_CLASS } from './styles/overlay';
export { AgentMessage } from './tasks/AgentMessage/AgentMessage';
export type { AgentMessageProps } from './tasks/AgentMessage/AgentMessage';
export { DEFAULT_SHELL_OUTPUT_LABELS, ShellOutput } from './tools/ShellOutput';
export type { ShellOutputLabels, ShellOutputProps } from './tools/ShellOutput';
export { getBashRunInfo } from './tools/bash-output';
export type { BashRunInfo } from './tools/bash-output';
export { DEFAULT_TODO_TOOL_LABELS } from './tools/todo-utils';
export type { HiddenTodos, TodoToolLabels } from './tools/todo-utils';
export { hasAnsi, parseAnsiLines, stripAnsi } from './utils/ansi';
export type { AnsiColor, AnsiSegment, AnsiStyle } from './utils/ansi';
export type { InputWrapperOrderItem } from './utils/field-order';
export {
  clearHighlightCache,
  highlightCode,
  useHighlightedLines,
  createShikiHighlighter,
} from './utils/highlighter';
export type {
  HighlightToken,
  HighlightedLines,
  SyntaxHighlighter,
  HighlightedLinesState,
  ShikiHighlighterLike,
} from './utils/highlighter';
export {
  byteLength,
  formatBytes,
  formatJsonOutput,
  splitLinks,
  tailLines,
} from './utils/shell-output';
export type { TextLink } from './utils/shell-output';

export { ChatLauncher, DEFAULT_CHAT_LAUNCHER_LABELS } from './launcher/ChatLauncher';
export type {
  ChatLauncherClassNames,
  ChatLauncherLabels,
  ChatLauncherProps,
} from './launcher/ChatLauncher';
export type {
  ChatLauncherMode,
  ChatLauncherOffset,
  ChatLauncherPosition,
} from './launcher/launcher-layout';
export { mountChatLauncher } from './launcher/mount-chat-launcher';
export type { MountChatLauncherOptions, MountedChatLauncher } from './launcher/mount-chat-launcher';

export {
  AiKitHostScope,
  AiKitProvider,
  useAiKitTheme,
  useOptionalAiKitTheme,
} from './theme/AiKitProvider';
export type { AiKitProviderProps, AiKitThemeContextValue } from './theme/AiKitProvider';
export {
  AiKitThemeCustomizer,
  DEFAULT_AI_KIT_THEME_CUSTOMIZER_LABELS,
} from './theme/AiKitThemeCustomizer';
export type {
  AiKitThemeCustomizerLabels,
  AiKitThemeCustomizerProps,
} from './theme/AiKitThemeCustomizer';
export {
  getAiKitSettingsTheme,
  getAiKitCssVariables,
  readAiKitSettings,
  writeAiKitSettings,
  AI_KIT_ACCENT_SHADES,
  AI_KIT_ACCENTS,
  AI_KIT_RADII,
  AI_KIT_DENSITIES,
  AI_KIT_DEFAULT_DENSITY,
} from './theme/ai-kit-settings';
export type {
  AiKitAccent,
  AiKitRadius,
  AiKitDensity,
  AiKitThemeSettings,
  AiKitRadii,
  AiKitControlHeights,
  AiKitThemeOther,
  AiKitCssVariables,
} from './theme/ai-kit-settings';
export { createAiKitTheme, mergeAiKitTheme, AI_KIT_SCOPE_CLASS } from './theme/create-ai-kit-theme';
export type { AiKitControlSize, StyledProps } from './theme/create-ai-kit-theme';
export { AE_TOKENS } from './theme/tokens';
export type { AeToken, AeTokenOverrides } from './theme/tokens';
