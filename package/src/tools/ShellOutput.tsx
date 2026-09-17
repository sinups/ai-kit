import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconArrowDown, IconCheck, IconCopy } from '@tabler/icons-react';
import { hasAnsi, parseAnsiLines, stripAnsi, type AnsiSegment } from '../utils/ansi';
import { cx } from '../utils/cx';
import { formatDuration } from '../utils/format-elapsed';
import {
  byteLength,
  formatBytes,
  formatJsonOutput,
  splitLinks,
  tailLines,
} from '../utils/shell-output';
import classes from './ShellOutput.module.css';

export interface ShellOutputLabels {
  noOutput: string;
  running: string;
  showLess: string;
  scrollToLatest: string;
  copy: string;
  copied: string;
  moreLines: (count: number) => string;
  showAll: (lines: number) => string;
  exitCode: (code: number) => string;
  timeout: (duration: string) => string;
}

export const DEFAULT_SHELL_OUTPUT_LABELS: ShellOutputLabels = {
  noOutput: 'No output',
  running: 'Running',
  showLess: 'Show less',
  scrollToLatest: 'Scroll to latest',
  copy: 'Copy output',
  copied: 'Copied',
  moreLines: (count) => `+${count} more ${count === 1 ? 'line' : 'lines'}`,
  showAll: (lines) => `Show all ${lines} lines`,
  exitCode: (code) => `exit ${code}`,
  timeout: (duration) => `timeout ${duration}`,
};

export interface ShellOutputProps {
  /** Raw command output, ANSI escapes included */
  output: string;
  /** Lines shown from the end while collapsed, `12` by default; `0` shows everything */
  maxLines?: number;
  /** The command is still running: shows a loader instead of the exit code */
  live?: boolean;
  /** Exit code, green for `0` and red otherwise */
  exitCode?: number | null;
  /** How long the command ran, in ms */
  durationMs?: number;
  /** Moment the command started, shows a ticking duration while `live` and `durationMs` is not set */
  startedAt?: number | Date;
  /** Timeout of the command, in ms */
  timeoutMs?: number;
  /** Output size in bytes, measured from `output` by default */
  sizeBytes?: number;
  /** Pretty-prints output that is a JSON object or array, `true` by default */
  formatJson?: boolean;
  /** Shows the copy button, `true` by default */
  withCopy?: boolean;
  /** Shows exit code, duration, timeout and size above the log, `true` by default */
  withMeta?: boolean;
  /** Starts expanded, showing every line in a scrollable log */
  defaultExpanded?: boolean;
  /** Maximum height of the expanded log before it scrolls, `400` by default; while `live` it follows new lines until scrolled up */
  maxHeight?: number | string;
  /** `default` draws the log on a tinted panel, `compact` blends into a parent card */
  variant?: 'default' | 'compact';
  /** Overrides of the default English labels */
  labels?: Partial<ShellOutputLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const FOLLOW_THRESHOLD = 8;

function colorVar(color: string) {
  return `var(--mantine-color-${color}-text)`;
}

function Segment({ segment }: { segment: AnsiSegment }) {
  const links = splitLinks(segment.text);
  const styled =
    segment.fg || segment.bg || segment.bold || segment.dim || segment.italic || segment.underline;
  const content = links.map((part, index) =>
    part.href ? (
      <Anchor
        key={index}
        href={part.href}
        target="_blank"
        rel="noreferrer"
        inherit
        underline="always"
      >
        {part.text}
      </Anchor>
    ) : (
      <React.Fragment key={index}>{part.text}</React.Fragment>
    )
  );
  if (!styled) {
    return <>{content}</>;
  }
  return (
    <Text
      span
      inherit
      c={segment.fg ? colorVar(segment.fg) : segment.dim ? 'dimmed' : undefined}
      bg={segment.bg ? `var(--mantine-color-${segment.bg}-light)` : undefined}
      fw={segment.bold ? 700 : undefined}
      fs={segment.italic ? 'italic' : undefined}
      td={segment.underline ? 'underline' : undefined}
      data-ansi-fg={segment.fg}
    >
      {content}
    </Text>
  );
}

function Lines({ lines }: { lines: AnsiSegment[][] }) {
  return (
    <>
      {lines.map((line, index) => (
        <div key={index} className={classes.line}>
          {line.map((segment, segmentIndex) => (
            <Segment key={segmentIndex} segment={segment} />
          ))}
        </div>
      ))}
    </>
  );
}

/** Terminal output with ANSI colors, clickable links, pretty JSON, a collapsible tail and run metadata */
export const ShellOutput = memo(function ShellOutput({
  output,
  maxLines = 12,
  live = false,
  exitCode,
  durationMs: durationProp,
  startedAt,
  timeoutMs,
  sizeBytes,
  formatJson = true,
  withCopy = true,
  withMeta = true,
  defaultExpanded = false,
  maxHeight = 400,
  variant = 'default',
  labels: labelsProp,
  className,
  style,
}: ShellOutputProps) {
  const labels = { ...DEFAULT_SHELL_OUTPUT_LABELS, ...labelsProp };
  const [expanded, setExpanded] = useState(defaultExpanded);
  const viewportRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const [following, setFollowing] = useState(true);
  const startMs = startedAt instanceof Date ? startedAt.getTime() : startedAt;
  const ticking = live && durationProp === undefined && startMs !== undefined;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ticking) {
      return;
    }
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  const durationMs = durationProp ?? (ticking ? Math.max(0, now - startMs!) : undefined);

  const lines = useMemo(() => {
    const pretty = formatJson && !hasAnsi(output) ? formatJsonOutput(output) : null;
    const parsed = parseAnsiLines(pretty ?? output.replace(/\n+$/, ''));
    return parsed.length === 1 && parsed[0].length === 0 ? [] : parsed;
  }, [output, formatJson]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && followingRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [lines, expanded]);

  const handleScroll = ({ y }: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const atBottom = viewport.scrollHeight - viewport.clientHeight - y <= FOLLOW_THRESHOLD;
    followingRef.current = atBottom;
    setFollowing(atBottom);
  };

  const scrollToLatest = () => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
    followingRef.current = true;
    setFollowing(true);
  };

  const { visible, hidden } = tailLines(lines, expanded ? 0 : maxLines);
  const size = sizeBytes ?? byteLength(output);
  const hasExit = exitCode !== undefined && exitCode !== null;

  const meta =
    withMeta &&
    (live || hasExit || durationMs !== undefined || timeoutMs !== undefined || size > 0);
  const copy = withCopy && output.length > 0 && (
    <CopyButton value={stripAnsi(output)}>
      {({ copied, copy: copyOutput }) => (
        <Tooltip label={copied ? labels.copied : labels.copy} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={variant === 'compact' ? 'xs' : 'sm'}
            aria-label={copied ? labels.copied : labels.copy}
            onClick={copyOutput}
          >
            {copied ? (
              <IconCheck size={variant === 'compact' ? 12 : 14} />
            ) : (
              <IconCopy size={variant === 'compact' ? 12 : 14} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );

  return (
    <Stack gap={4} className={cx(classes.root, className)} style={style} data-variant={variant}>
      {(meta || copy) && (
        <Group gap={10} wrap="nowrap" justify="space-between" className={classes.meta}>
          <Group gap={6} wrap="wrap" miw={0}>
            {withMeta && live && !hasExit && (
              <Group gap={4} wrap="nowrap">
                <Loader size={10} aria-hidden />
                <Text span size="xs" c="dimmed">
                  {labels.running}
                </Text>
              </Group>
            )}
            {withMeta && hasExit && (
              <Badge size="xs" variant="light" color={exitCode === 0 ? 'green' : 'red'} tt="none">
                {labels.exitCode(exitCode)}
              </Badge>
            )}
            {withMeta && durationMs !== undefined && (
              <Text span size="xs" c="dimmed" className={classes.numeric}>
                {formatDuration(durationMs)}
              </Text>
            )}
            {withMeta && timeoutMs !== undefined && (
              <Text span size="xs" c="dimmed" className={classes.numeric}>
                {labels.timeout(formatDuration(timeoutMs))}
              </Text>
            )}
            {withMeta && size > 0 && (
              <Text span size="xs" c="dimmed" className={classes.numeric}>
                {formatBytes(size)}
              </Text>
            )}
          </Group>
          {copy}
        </Group>
      )}
      {lines.length === 0 ? (
        <Text size="xs" c="dimmed" className={classes.empty}>
          {labels.noOutput}
        </Text>
      ) : (
        <Box className={classes.panel}>
          {hidden > 0 && (
            <Text size="xs" c="dimmed" className={classes.more}>
              {labels.moreLines(hidden)}
            </Text>
          )}
          {expanded ? (
            <ScrollArea.Autosize
              mah={maxHeight}
              type="auto"
              viewportRef={viewportRef}
              onScrollPositionChange={handleScroll}
              data-testid="shell-output-scroll"
            >
              <Code block className={classes.log}>
                <Lines lines={visible} />
              </Code>
            </ScrollArea.Autosize>
          ) : (
            <Code block className={classes.log}>
              <Lines lines={visible} />
            </Code>
          )}
        </Box>
      )}
      {expanded && live && !following && (
        <Button
          variant="default"
          size="compact-xs"
          leftSection={<IconArrowDown size={12} />}
          className={classes.toggle}
          onClick={scrollToLatest}
        >
          {labels.scrollToLatest}
        </Button>
      )}
      {maxLines > 0 && lines.length > maxLines && (
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          className={classes.toggle}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? labels.showLess : labels.showAll(lines.length)}
        </Button>
      )}
    </Stack>
  );
});

ShellOutput.displayName = 'ShellOutput';
