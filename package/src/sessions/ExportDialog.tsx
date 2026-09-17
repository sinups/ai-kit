import React, { memo, useMemo, useState } from 'react';
import {
  Button,
  Code,
  CopyButton,
  FocusTrap,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconCopy, IconDownload } from '@tabler/icons-react';
import type { ChatMessage } from '../types';
import { downloadFile } from './download';
import { exportConversation, getExportFilename } from './export';
import type { ExportFormat, ExportOptions } from './types';
import classes from './ExportDialog.module.css';
import { OVERLAY_INNER_CLASS } from '../styles/overlay';

export interface ExportDialogLabels {
  title: string;
  format: string;
  markdown: string;
  json: string;
  text: string;
  includeToolCalls: string;
  includeThinking: string;
  includeTimestamps: string;
  preview: string;
  copy: string;
  copied: string;
  download: string;
}

export type ExportToggles = Pick<
  ExportOptions,
  'includeToolCalls' | 'includeThinking' | 'includeTimestamps'
>;

export interface ExportDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Called when the dialog closes */
  onClose: () => void;
  /** Conversation to export */
  messages: ChatMessage[];
  /** Conversation title, written at the top of the export and used for the file name */
  title?: string;
  /** Format selected when the dialog opens, `markdown` by default */
  defaultFormat?: ExportFormat;
  /** Options selected when the dialog opens, tool calls and timestamps on, thinking off by default */
  defaultOptions?: Partial<ExportToggles>;
  /** Saves the file, downloads it through a temporary link by default */
  onDownload?: (filename: string, content: string, mimeType: string) => void;
  /** Maximum height of the preview, `320` by default */
  previewHeight?: number;
  /** Overrides of the default English labels */
  labels?: Partial<ExportDialogLabels>;
}

export const DEFAULT_EXPORT_DIALOG_LABELS: ExportDialogLabels = {
  title: 'Export conversation',
  format: 'Format',
  markdown: 'Markdown',
  json: 'JSON',
  text: 'Plain text',
  includeToolCalls: 'Include tool calls',
  includeThinking: 'Include thinking',
  includeTimestamps: 'Include timestamps',
  preview: 'Preview',
  copy: 'Copy',
  copied: 'Copied',
  download: 'Download',
};

const DEFAULT_TOGGLES: ExportToggles = {
  includeToolCalls: true,
  includeThinking: false,
  includeTimestamps: true,
};

type ExportDialogBodyProps = Required<
  Pick<ExportDialogProps, 'messages' | 'defaultFormat' | 'onDownload' | 'previewHeight'>
> &
  Pick<ExportDialogProps, 'title' | 'defaultOptions'> & { text: ExportDialogLabels };

function ExportDialogBody({
  messages,
  title,
  defaultFormat,
  defaultOptions,
  onDownload,
  previewHeight,
  text,
}: ExportDialogBodyProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [toggles, setToggles] = useState<ExportToggles>({ ...DEFAULT_TOGGLES, ...defaultOptions });

  const result = useMemo(
    () => exportConversation(messages, { format, title, ...toggles }),
    [messages, format, title, toggles]
  );

  const toggle = (key: keyof ExportToggles, label: string) => (
    <Switch
      size="sm"
      label={label}
      checked={toggles[key]}
      onChange={(event) => {
        const checked = event.currentTarget.checked;
        setToggles((current) => ({ ...current, [key]: checked }));
      }}
    />
  );

  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        aria-label={text.format}
        value={format}
        onChange={(value) => setFormat(value as ExportFormat)}
        data={[
          { value: 'markdown', label: text.markdown },
          { value: 'json', label: text.json },
          { value: 'text', label: text.text },
        ]}
      />
      <Stack gap="xs">
        {toggle('includeToolCalls', text.includeToolCalls)}
        {toggle('includeThinking', text.includeThinking)}
        {toggle('includeTimestamps', text.includeTimestamps)}
      </Stack>
      <Stack gap={4}>
        <Text size="xs" fw={500} c="dimmed">
          {text.preview}
        </Text>
        <ScrollArea.Autosize mah={previewHeight} type="auto">
          <Code block aria-label={text.preview} className={classes.preview}>
            {result.content}
          </Code>
        </ScrollArea.Autosize>
      </Stack>
      <Group justify="flex-end" gap="xs">
        <CopyButton value={result.content}>
          {({ copied, copy }) => (
            <Button
              variant="default"
              leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              onClick={copy}
            >
              {copied ? text.copied : text.copy}
            </Button>
          )}
        </CopyButton>
        <Button
          leftSection={<IconDownload size={14} />}
          onClick={() =>
            onDownload(getExportFilename(title, format), result.content, result.mimeType)
          }
        >
          {text.download}
        </Button>
      </Group>
    </Stack>
  );
}

/** Modal that previews a conversation as Markdown, JSON or plain text and copies or downloads it */
export const ExportDialog = memo(function ExportDialog({
  opened,
  onClose,
  messages,
  title,
  defaultFormat = 'markdown',
  defaultOptions,
  onDownload = downloadFile,
  previewHeight = 320,
  labels,
}: ExportDialogProps) {
  const text = { ...DEFAULT_EXPORT_DIALOG_LABELS, ...labels };
  const fullScreen = useMediaQuery('(max-width: 36em)') ?? false;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={text.title}
      size="lg"
      fullScreen={fullScreen}
      classNames={{ inner: OVERLAY_INNER_CLASS }}
    >
      <FocusTrap.InitialFocus />
      <ExportDialogBody
        messages={messages}
        title={title}
        defaultFormat={defaultFormat}
        defaultOptions={defaultOptions}
        onDownload={onDownload}
        previewHeight={previewHeight}
        text={text}
      />
    </Modal>
  );
});

ExportDialog.displayName = 'ExportDialog';
