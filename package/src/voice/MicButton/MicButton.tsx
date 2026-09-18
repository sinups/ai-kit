import React, { memo, useId } from 'react';
import { ActionIcon, Tooltip, VisuallyHidden } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconPlayerStopFilled } from '@tabler/icons-react';
import { SpiralLoader } from '../../SpiralLoader/SpiralLoader';
import { cx } from '../../utils/cx';
import classes from './MicButton.module.css';

export type MicState = 'idle' | 'requesting' | 'listening' | 'processing' | 'error' | 'unsupported';

export interface MicButtonLabels {
  /** Accessible name of the button in every state, `Dictation` by default */
  dictation: string;
  /** Tooltip of the idle button, `Start dictation` by default */
  start: string;
  /** Tooltip while listening, `Stop` by default */
  stop: string;
  /** While the browser asks for the microphone, `Requesting microphone` by default */
  requesting: string;
  /** While the recording is turned into text, `Transcribing` by default */
  processing: string;
  /** After a failure when `error` is not set, `Microphone error` by default */
  error: string;
  /** When the browser cannot record, `Voice input isn't supported in this browser` by default */
  unsupported: string;
}

export const DEFAULT_MIC_BUTTON_LABELS: MicButtonLabels = {
  dictation: 'Dictation',
  start: 'Start dictation',
  stop: 'Stop',
  requesting: 'Requesting microphone',
  processing: 'Transcribing',
  error: 'Microphone error',
  unsupported: "Voice input isn't supported in this browser",
};

export interface MicButtonProps {
  /** Controlled state; the button never touches the microphone itself */
  state: MicState;
  /** Input level from 0 to 1 that drives the ring while `listening` */
  level?: number;
  /** Called on click in `idle`, `requesting`, `listening` and `error`; the host moves `state` */
  onToggle?: () => void;
  /** Failure shown in the tooltip for `error` */
  error?: string;
  /** Turns the button off regardless of `state` */
  disabled?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<MicButtonLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const LABEL_KEYS: Record<MicState, keyof MicButtonLabels> = {
  idle: 'start',
  requesting: 'requesting',
  listening: 'stop',
  processing: 'processing',
  error: 'error',
  unsupported: 'unsupported',
};

function clampLevel(level: number | undefined): number {
  return Math.min(1, Math.max(0, Number.isFinite(level) ? (level as number) : 0));
}

/** Round microphone button for the composer toolbar, driven entirely by `state` and `level` */
export const MicButton = memo(function MicButton({
  state,
  level,
  onToggle,
  error,
  disabled = false,
  labels: labelsProp,
  className,
  style,
}: MicButtonProps) {
  const labels = { ...DEFAULT_MIC_BUTTON_LABELS, ...labelsProp };
  const descriptionId = useId();
  const tooltip = state === 'error' && error ? error : labels[LABEL_KEYS[state]];
  const description = state === 'idle' || state === 'listening' ? undefined : tooltip;
  const inactive = state === 'processing' || state === 'unsupported';
  const busy = state === 'requesting' || state === 'processing';

  let icon: React.ReactNode;
  if (state === 'processing') {
    icon = <SpiralLoader size={16} />;
  } else if (state === 'listening') {
    icon = <IconPlayerStopFilled size={14} />;
  } else if (state === 'unsupported' || state === 'error') {
    icon = <IconMicrophoneOff size={16} stroke={2} />;
  } else {
    icon = <IconMicrophone size={16} stroke={2} />;
  }

  return (
    <Tooltip label={tooltip} disabled={disabled} withArrow openDelay={300}>
      <ActionIcon
        variant={state === 'listening' ? 'filled' : 'subtle'}
        color={state === 'error' ? 'red' : state === 'listening' ? undefined : 'gray'}
        size="md"
        radius="xl"
        className={cx(classes.root, className)}
        style={
          state === 'listening'
            ? ({ ...style, '--mic-level': clampLevel(level) } as React.CSSProperties)
            : style
        }
        data-state={state}
        aria-label={labels.dictation}
        aria-describedby={description ? descriptionId : undefined}
        aria-pressed={state === 'listening'}
        aria-busy={busy || undefined}
        aria-disabled={inactive || undefined}
        disabled={disabled}
        onClick={inactive ? undefined : onToggle}
      >
        {state === 'listening' && <span className={classes.ring} aria-hidden />}
        {icon}
        {description && <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>}
      </ActionIcon>
    </Tooltip>
  );
});

MicButton.displayName = 'MicButton';
