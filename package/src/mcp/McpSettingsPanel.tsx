import React, { memo, useState } from 'react';
import { Box, EmptyState } from '@mantine/core';
import { IconServer } from '@tabler/icons-react';
import { MasterDetail } from '../primitives/MasterDetail/MasterDetail';
import { McpServerDetail, type McpServerDetailLabels } from './McpServerDetail';
import { McpServerList, type McpServerListLabels } from './McpServerList';
import { McpServerWizardModal, type McpServerWizardLabels } from './McpServerWizard';
import { McpToolDetail, type McpToolDetailLabels } from './McpToolDetail';
import type { McpServer, McpServerDraft, McpToolDefinition } from './types';

type ServerAction = (server: McpServer) => void | Promise<void>;

export type McpSettingsPanelLabels = {
  list: Partial<McpServerListLabels>;
  detail: Partial<McpServerDetailLabels>;
  tool: Partial<McpToolDetailLabels>;
  wizard: Partial<McpServerWizardLabels>;
  /** Back button above the server detail when narrow, `Servers` by default */
  back: string;
  /** Detail placeholder title when wide and nothing is selected, `Select a server` by default */
  emptyTitle: string;
  /** Detail placeholder description, `Its tools, resources and configuration appear here` by default */
  emptyDescription: string;
};

export interface McpSettingsPanelProps {
  /** Configured servers */
  servers: McpServer[];
  /** Shows skeleton rows in the list */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the list error */
  onRetry?: () => void;
  /** Controlled id of the selected server */
  selectedServerId?: string | null;
  /** Called when the selected server changes */
  onSelectedServerChange?: (id: string | null) => void;
  /** Enables the add wizard; resolve to close it, reject to show the message */
  onAddServer?: (draft: McpServerDraft) => void | Promise<void>;
  /** Enables editing through the wizard; `draft.id` is the edited server id */
  onUpdateServer?: (draft: McpServerDraft) => void | Promise<void>;
  onReconnect?: ServerAction;
  onAuthenticate?: ServerAction;
  onEnable?: ServerAction;
  onDisable?: ServerAction;
  onRemove?: ServerAction;
  /** Renders a "Try tool" button in the tool detail */
  onTryTool?: (server: McpServer, tool: McpToolDefinition) => void;
  /** Label overrides for the list, detail, tool detail and wizard */
  labels?: Partial<McpSettingsPanelLabels>;
  /** Width of the server list when wide, `380` by default */
  listWidth?: number;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

type WizardState = { opened: boolean; server?: McpServer };

/** MCP settings screen: server list, server and tool details, add and edit wizard; fills the parent height */
export const McpSettingsPanel = memo(function McpSettingsPanel({
  servers,
  loading,
  error,
  onRetry,
  selectedServerId,
  onSelectedServerChange,
  onAddServer,
  onUpdateServer,
  onReconnect,
  onAuthenticate,
  onEnable,
  onDisable,
  onRemove,
  onTryTool,
  labels,
  listWidth = 380,
  className,
  style,
}: McpSettingsPanelProps) {
  const [uncontrolledId, setUncontrolledId] = useState<string | null>(null);
  const [toolName, setToolName] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>({ opened: false });

  const selectedId = selectedServerId !== undefined ? selectedServerId : uncontrolledId;
  const server = servers.find((item) => item.id === selectedId) ?? null;
  const tool = server?.tools?.find((item) => item.name === toolName) ?? null;

  const select = (id: string | null) => {
    setUncontrolledId(id);
    setToolName(null);
    onSelectedServerChange?.(id);
  };

  const handleRemove: ServerAction | undefined = onRemove
    ? async (target) => {
        await onRemove(target);
        if (target.id === selectedId) {
          select(null);
        }
      }
    : undefined;

  let detail: React.ReactNode = null;
  if (server && tool) {
    detail = (
      <Box p="lg">
        <McpToolDetail
          tool={tool}
          serverName={server.name}
          onBack={() => setToolName(null)}
          onTry={onTryTool ? (target) => onTryTool(server, target) : undefined}
          labels={labels?.tool}
        />
      </Box>
    );
  } else if (server) {
    detail = (
      <Box p="lg">
        <McpServerDetail
          key={server.id}
          server={server}
          onSelectTool={(target) => setToolName(target.name)}
          onReconnect={onReconnect}
          onAuthenticate={onAuthenticate}
          onEnable={onEnable}
          onDisable={onDisable}
          onRemove={handleRemove}
          onEdit={
            onUpdateServer ? (target) => setWizard({ opened: true, server: target }) : undefined
          }
          labels={labels?.detail}
        />
      </Box>
    );
  }

  const wizardSubmit = wizard.server ? onUpdateServer : onAddServer;

  return (
    <>
      <MasterDetail
        className={className}
        style={style}
        listWidth={listWidth}
        list={
          <Box p="md">
            <McpServerList
              servers={servers}
              selectedId={selectedId}
              onSelect={(item) => select(item.id)}
              loading={loading}
              error={error}
              onRetry={onRetry}
              onAdd={onAddServer ? () => setWizard({ opened: true }) : undefined}
              onReconnect={onReconnect}
              onAuthenticate={onAuthenticate}
              onEnable={onEnable}
              onDisable={onDisable}
              onRemove={handleRemove}
              labels={labels?.list}
            />
          </Box>
        }
        detail={detail}
        onBack={tool ? undefined : () => select(null)}
        backLabel={labels?.back ?? 'Servers'}
        emptyDetail={
          <EmptyState
            h="100%"
            p="xl"
            icon={<IconServer />}
            title={labels?.emptyTitle ?? 'Select a server'}
            description={
              labels?.emptyDescription ?? 'Its tools, resources and configuration appear here'
            }
          />
        }
      />
      {wizardSubmit && (
        <McpServerWizardModal
          opened={wizard.opened}
          onClose={() => setWizard((current) => ({ ...current, opened: false }))}
          onSubmit={wizardSubmit}
          initialServer={wizard.server}
          existingNames={servers.map((item) => item.name)}
          labels={labels?.wizard}
        />
      )}
    </>
  );
});
