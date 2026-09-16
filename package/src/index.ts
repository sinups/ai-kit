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
  ChatClassNames,
  ChatSlots,
  ModelOption,
  AgentChatProps,
  CustomToolRendererProps,
  ToolRendererSlotProps,
  InputSuggestions,
  AttachedImage,
  AttachedFile,
} from './types';
export type { TimelineStep, ToolCallStep, StepState, DiffLine, Turn } from './types/timeline';

export { AgentChat } from './AgentChat/AgentChat';
export { MessageList } from './MessageList/MessageList';
export type { MessageListProps } from './MessageList/MessageList';
export { UserMessage } from './UserMessage/UserMessage';
export type { UserMessageProps } from './UserMessage/UserMessage';
export { ErrorMessage } from './ErrorMessage/ErrorMessage';
export type { ErrorMessageProps } from './ErrorMessage/ErrorMessage';
export { Markdown } from './Markdown/Markdown';
export type { MarkdownProps } from './Markdown/Markdown';
export { ImageLightbox } from './ImageLightbox/ImageLightbox';
export type { ImageLightboxProps, LightboxImage } from './ImageLightbox/ImageLightbox';

export { InputBar } from './input/InputBar';
export type { InputBarProps } from './input/InputBar';
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
export { ToolApprovalFooter } from './tools/ToolApprovalFooter';
export type { ToolApproval, ToolApprovalFooterProps } from './tools/ToolApprovalFooter';
export { toolRegistry, parseMcpToolType } from './tools/tool-registry';
export type { ToolMeta, ToolVariant, McpToolInfo } from './tools/tool-registry';
export { routeToolCall } from './tools/tool-router';
