import type { InputBarLabels } from '../input/InputBar';
import type { ChatWelcomeLabels } from './ChatWelcome';
import type { ChatComponentLabels } from '../labels/chat-labels';
import type { MessageListLabels } from '../MessageList/MessageList';
import type { ToolApprovalLabels } from '../tools/ToolApprovalFooter';

/** Every label of the chat surface, grouped by the component that shows it */
export interface AgentChatLabels extends ChatComponentLabels {
  /** Title of the card rendered for the `error` prop, `Request failed` by default */
  errorTitle: string;
  /** Composer placeholder when `inputBarProps.placeholder` is not set, `Send a message...` by default */
  placeholder: string;
  /** Transcript: new messages, sticky prompt, working row, `search` and `toolRuns` */
  messageList: Partial<MessageListLabels>;
  /** Composer: send and stop, attachments, question bar, queue, history search */
  inputBar: Partial<InputBarLabels>;
  /** Approve/reject footer and settled line of every call in `approvals` */
  toolApproval: Partial<ToolApprovalLabels>;
  /** Greeting of the `welcome` empty state */
  welcome: Partial<ChatWelcomeLabels>;
}

export const DEFAULT_AGENT_CHAT_LABELS: Pick<AgentChatLabels, 'errorTitle' | 'placeholder'> = {
  errorTitle: 'Request failed',
  placeholder: 'Send a message...',
};
