import React, { memo, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  FocusTrap,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconAlertCircle, IconDownload, IconServer } from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { OVERLAY_INNER_CLASS } from '../styles/overlay';
import {
  DEFAULT_MCP_IMPORT_NAME_LABELS,
  resolveImportNames,
  validateImportNames,
  type McpImportNameLabels,
} from './mcp-import';
import { getMcpServerTarget } from './mcp-server';
import classes from './Mcp.module.css';
import { MCP_TRANSPORT_LABELS, McpTransportIcon } from './McpTransportIcon';
import type { McpServerCandidate, McpTransport } from './types';
import { formatTemplate } from '../utils/format-template';

export type McpImportDialogLabels = McpImportNameLabels & {
  /** `{source}` is replaced with `sourceLabel` */
  title: string;
  /** `{count}` and `{source}` are replaced */
  description: string;
  selectAll: string;
  name: string;
  renamed: string;
  cancel: string;
  /** `{count}` is replaced with the number of selected servers */
  import: string;
  empty: string;
  error: string;
  transports: Record<McpTransport, string>;
};

export const DEFAULT_MCP_IMPORT_DIALOG_LABELS: McpImportDialogLabels = {
  ...DEFAULT_MCP_IMPORT_NAME_LABELS,
  title: 'Import MCP servers from {source}',
  description: 'Found {count} servers in {source}. Names already in use get a suffix you can edit.',
  selectAll: 'Select all',
  name: 'Server name',
  renamed: 'Renamed',
  cancel: 'Cancel',
  import: 'Import {count}',
  empty: 'No servers to import',
  error: 'Could not import the servers',
  transports: MCP_TRANSPORT_LABELS,
};

export interface McpImportDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Called when the dialog is dismissed, cancelled or after a successful import */
  onClose: () => void;
  /** Name of the client the servers come from, for example `Desktop client` */
  sourceLabel: string;
  /** Servers found in the other client */
  servers: McpServerCandidate[];
  /** Names of configured servers, compared case-insensitively; colliding imports are renamed `name_1`, `name_2` */
  existingNames?: string[];
  /** Called with the selected servers carrying their final names; a rejected promise keeps the dialog open and shows the message */
  onImport: (servers: McpServerCandidate[]) => void | Promise<void>;
  /** Title, button and validation message overrides */
  labels?: Partial<McpImportDialogLabels>;
}

function ImportBody({
  servers,
  existingNames,
  sourceLabel,
  onImport,
  onClose,
  labels,
}: Omit<McpImportDialogProps, 'opened' | 'labels'> & { labels: McpImportDialogLabels }) {
  const action = usePendingActions(labels.error);
  const initialNames = useMemo(
    () => resolveImportNames(servers, existingNames),
    [servers, existingNames]
  );
  const [names, setNames] = useState<Record<string, string>>(initialNames);
  const [selection, setSelection] = useState<ReadonlySet<string>>(
    () => new Set(servers.map((server) => server.id))
  );
  const pending = action.isPending('import');
  const selectedIds = servers
    .filter((server) => selection.has(server.id))
    .map((server) => server.id);
  const errors = validateImportNames(selectedIds, names, existingNames, labels);
  const allSelected = servers.length > 0 && selectedIds.length === servers.length;
  const canImport = selectedIds.length > 0 && Object.keys(errors).length === 0 && !pending;

  const toggle = (id: string) =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleImport = () =>
    action.run('import', async () => {
      await onImport(
        servers
          .filter((server) => selection.has(server.id))
          .map((server) => ({ ...server, name: (names[server.id] ?? server.name).trim() }))
      );
      onClose();
    });

  if (servers.length === 0) {
    return (
      <Stack gap="md">
        <EmptyState size="sm" py="lg" icon={<IconServer />} title={labels.empty} />
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={onClose}>
            {labels.cancel}
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {formatTemplate(labels.description, { count: servers.length, source: sourceLabel })}
      </Text>

      <Checkbox
        size="xs"
        label={labels.selectAll}
        checked={allSelected}
        indeterminate={selectedIds.length > 0 && !allSelected}
        disabled={pending}
        onChange={() =>
          setSelection(allSelected ? new Set() : new Set(servers.map((server) => server.id)))
        }
      />

      <ScrollArea.Autosize mah="50vh" type="auto" offsetScrollbars>
        <Stack gap="sm">
          {servers.map((server) => {
            const checked = selection.has(server.id);
            const name = names[server.id] ?? server.name;
            return (
              <Group key={server.id} gap="sm" wrap="nowrap" align="flex-start">
                <Checkbox
                  size="xs"
                  className={classes.controlRow}
                  aria-label={server.name}
                  checked={checked}
                  disabled={pending}
                  onChange={() => toggle(server.id)}
                />
                <Stack gap={4} flex={1} className={classes.header}>
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <TextInput
                      size="xs"
                      flex={1}
                      aria-label={`${labels.name}: ${server.name}`}
                      value={name}
                      error={checked ? errors[server.id] : undefined}
                      disabled={!checked || pending}
                      leftSection={<McpTransportIcon transport={server.transport} size={14} />}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setNames((prev) => ({ ...prev, [server.id]: value }));
                      }}
                    />
                    <Group gap={4} wrap="nowrap" className={classes.controlRow}>
                      <Badge size="xs" variant="light" color="gray">
                        {labels.transports[server.transport]}
                      </Badge>
                      {name.trim() !== server.name && (
                        <Badge size="xs" variant="light" color="yellow">
                          {labels.renamed}
                        </Badge>
                      )}
                    </Group>
                  </Group>
                  <Text
                    size="xs"
                    c="dimmed"
                    ff="monospace"
                    lineClamp={1}
                    className={classes.breakAll}
                  >
                    {getMcpServerTarget(server)}
                  </Text>
                </Stack>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>

      {action.error && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {action.error}
        </Alert>
      )}

      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" color="gray" size="sm" onClick={onClose} disabled={pending}>
          {labels.cancel}
        </Button>
        <Button
          size="sm"
          leftSection={<IconDownload size={14} />}
          loading={pending}
          disabled={!canImport && !pending}
          onClick={handleImport}
        >
          {formatTemplate(labels.import, { count: selectedIds.length })}
        </Button>
      </Group>
    </Stack>
  );
}

/** Modal that imports MCP servers from another client, renaming servers whose names are already taken */
export const McpImportDialog = memo(function McpImportDialog({
  opened,
  onClose,
  sourceLabel,
  servers,
  existingNames = [],
  onImport,
  labels: labelsOverride,
}: McpImportDialogProps) {
  const labels = { ...DEFAULT_MCP_IMPORT_DIALOG_LABELS, ...labelsOverride };
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={formatTemplate(labels.title, { source: sourceLabel })}
      size="lg"
      classNames={{ inner: OVERLAY_INNER_CLASS }}
    >
      <FocusTrap.InitialFocus />
      <ImportBody
        servers={servers}
        existingNames={existingNames}
        sourceLabel={sourceLabel}
        onImport={onImport}
        onClose={onClose}
        labels={labels}
      />
    </Modal>
  );
});

McpImportDialog.displayName = 'McpImportDialog';
