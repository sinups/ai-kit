import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBan,
  IconCircleCheck,
  IconCircleDashed,
  IconClock,
  IconLock,
  IconPlayerPlay,
  type Icon,
} from '@tabler/icons-react';

export type AgentUiStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'success'
  | 'warning'
  | 'error'
  | 'disabled'
  | 'needs-auth';

export interface StatusMeta {
  /** Mantine color key */
  color: string;
  /** Default English label */
  label: string;
  /** Icon shown when the status is not in progress */
  icon: Icon;
  /** Whether the status is in progress and is shown with a loader */
  loading: boolean;
}

const STATUS_META: Record<AgentUiStatus, StatusMeta> = {
  idle: { color: 'gray', label: 'Idle', icon: IconCircleDashed, loading: false },
  pending: { color: 'gray', label: 'Pending', icon: IconClock, loading: true },
  running: { color: 'blue', label: 'Running', icon: IconPlayerPlay, loading: true },
  success: { color: 'green', label: 'Success', icon: IconCircleCheck, loading: false },
  warning: { color: 'yellow', label: 'Warning', icon: IconAlertTriangle, loading: false },
  error: { color: 'red', label: 'Error', icon: IconAlertCircle, loading: false },
  disabled: { color: 'gray', label: 'Disabled', icon: IconBan, loading: false },
  'needs-auth': { color: 'orange', label: 'Needs auth', icon: IconLock, loading: false },
};

export const AGENT_UI_STATUSES = Object.keys(STATUS_META) as AgentUiStatus[];

export function getStatusMeta(status: AgentUiStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.idle;
}
