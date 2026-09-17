import React, { memo, useState } from 'react';
import { useUncontrolled } from '@mantine/hooks';
import { Stack, type MantineColor } from '@mantine/core';
import { ConfirmDialog } from '../../primitives/ConfirmDialog/ConfirmDialog';
import { MasterDetail } from '../../primitives/MasterDetail/MasterDetail';
import type { ModelOption } from '../../types';
import {
  AgentCreateWizard,
  type AgentCreateWizardLabels,
} from '../AgentCreateWizard/AgentCreateWizard';
import { AgentDetail, type AgentDetailLabels } from '../AgentDetail/AgentDetail';
import {
  AgentEditor,
  DEFAULT_AGENT_EDITOR_LABELS,
  type AgentEditorLabels,
} from '../AgentEditor/AgentEditor';
import { AgentList, type AgentListLabels } from '../AgentList/AgentList';
import type { AgentDefinition, AgentDraft, ToolCatalogItem } from '../types';
import { createAgentDraft, getCopyName } from '../validate-agent';
import { fillTemplate } from '../../utils/fill-template';

export interface AgentsSettingsPanelLabels {
  back: string;
  /** Display name of a duplicate, `{name}` is replaced */
  copyName: string;
  deleteTitle: string;
  /** `{name}` is replaced */
  deleteMessage: string;
  deleteConfirm: string;
  cancel: string;
  deleteError: string;
  /** Labels of the agent list */
  list: Partial<AgentListLabels>;
  /** Labels of the agent detail */
  detail: Partial<AgentDetailLabels>;
  /** Labels of the editor, including `toolSelector` */
  editor: Partial<AgentEditorLabels>;
  /** Labels of the creation wizard, including `toolSelector` */
  wizard: Partial<AgentCreateWizardLabels>;
}

export const DEFAULT_AGENTS_SETTINGS_PANEL_LABELS: AgentsSettingsPanelLabels = {
  back: 'Agents',
  copyName: '{name} copy',
  deleteTitle: 'Delete agent?',
  deleteMessage: '{name} will be removed. Chats that use it keep their history.',
  deleteConfirm: 'Delete',
  cancel: 'Cancel',
  deleteError: 'Could not delete the agent',
  list: {},
  detail: {},
  editor: {},
  wizard: {},
};

export interface AgentsSettingsPanelProps {
  /** Agents to manage */
  agents: AgentDefinition[];
  /** Tools that can be picked */
  catalog: ToolCatalogItem[];
  /** Models offered in addition to `inherit` */
  models?: ModelOption[];
  /** Skills offered in the skills picker */
  skills?: string[];
  /** Colors offered in the color picker */
  colors?: MantineColor[];
  /** Shows skeleton rows in the list */
  loading?: boolean;
  /** Error shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Creates an agent from the wizard or a duplicate; resolve with the agent to select it */
  onCreate: (draft: AgentDraft) => Promise<AgentDefinition | void> | AgentDefinition | void;
  /** Saves changes of an existing agent */
  onUpdate: (agent: AgentDefinition, draft: AgentDraft) => Promise<void> | void;
  /** Deletes an agent after confirmation */
  onDelete: (agent: AgentDefinition) => Promise<void> | void;
  /** Generates a draft from a task description in the wizard */
  onGenerate?: (task: string) => Promise<Partial<AgentDraft>>;
  /** Called by the Use in chat button of the detail */
  onUseInChat?: (agent: AgentDefinition) => void;
  /** BCP 47 locale for dates, `en` by default */
  locale?: string;
  /** Id of the agent shown in the detail, uncontrolled when omitted */
  selectedId?: string | null;
  /** Initially selected agent id when uncontrolled */
  defaultSelectedId?: string | null;
  /** Called when the selected agent changes */
  onSelectedIdChange?: (id: string | null) => void;
  /** Component width in px from which list and detail sit side by side, `720` by default */
  breakpoint?: number;
  /** Overrides of the default English labels of the panel and its parts */
  labels?: Partial<AgentsSettingsPanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

type Mode = { kind: 'view' } | { kind: 'edit' } | { kind: 'duplicate'; draft: Partial<AgentDraft> };

/** Agents settings screen: list, detail and editor in a master-detail layout, with a creation wizard */
export const AgentsSettingsPanel = memo(function AgentsSettingsPanel({
  agents,
  catalog,
  models = [],
  skills,
  colors,
  loading,
  error,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  onGenerate,
  onUseInChat,
  locale = 'en',
  selectedId: selectedIdProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  breakpoint,
  labels: labelsProp,
  className,
  style,
}: AgentsSettingsPanelProps) {
  const labels = { ...DEFAULT_AGENTS_SETTINGS_PANEL_LABELS, ...labelsProp };
  const [selectedId, setSelectedId] = useUncontrolled<string | null>({
    value: selectedIdProp,
    defaultValue: defaultSelectedId,
    finalValue: null,
    onChange: onSelectedIdChange,
  });
  const [mode, setMode] = useState<Mode>({ kind: 'view' });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AgentDefinition | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selected = agents.find((agent) => agent.id === selectedId) ?? null;
  const names = agents.map((agent) => agent.name);

  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const editorLabels = { ...DEFAULT_AGENT_EDITOR_LABELS, ...labels.editor };

  const leaveEditor = (nextSelectedId: string | null, nextMode: Mode) => {
    setSelectedId(nextSelectedId);
    setMode(nextMode);
    setEditorDirty(false);
  };

  const select = (agent: AgentDefinition | null, nextMode: Mode = { kind: 'view' }) =>
    leaveEditor(agent?.id ?? null, nextMode);

  const navigate = (action: () => void) => {
    if (mode.kind !== 'view' && editorDirty) {
      setPendingNavigation(() => action);
    } else {
      action();
    }
  };

  const duplicate = (agent: AgentDefinition) =>
    navigate(() =>
      select(agent, {
        kind: 'duplicate',
        draft: {
          ...createAgentDraft(agent),
          name: getCopyName(agent.name, names),
          displayName: agent.displayName
            ? fillTemplate(labels.copyName, { name: agent.displayName })
            : '',
        },
      })
    );

  const requestDelete = (agent: AgentDefinition) => {
    setPendingDelete(agent);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    await onDelete(pendingDelete);
    if (pendingDelete.id === selectedId) {
      select(null);
    }
  };

  const create = async (draft: AgentDraft) => {
    const created = await onCreate(draft);
    if (created) {
      select(created);
    }
  };

  let detail: React.ReactNode = null;
  if (selected && mode.kind === 'edit') {
    detail = (
      <AgentEditor
        key={`edit-${selected.id}`}
        agent={selected}
        catalog={catalog}
        models={models}
        skills={skills}
        colors={colors}
        existingNames={names}
        labels={labels.editor}
        onCancel={() => leaveEditor(selected.id, { kind: 'view' })}
        onDirtyChange={setEditorDirty}
        onSave={async (draft) => {
          await onUpdate(selected, draft);
          leaveEditor(selected.id, { kind: 'view' });
        }}
      />
    );
  } else if (selected && mode.kind === 'duplicate') {
    detail = (
      <AgentEditor
        key={`duplicate-${selected.id}`}
        initialDraft={mode.draft}
        catalog={catalog}
        models={models}
        skills={skills}
        colors={colors}
        existingNames={names}
        labels={labels.editor}
        onCancel={() => leaveEditor(selected.id, { kind: 'view' })}
        onDirtyChange={setEditorDirty}
        onSave={async (draft) => {
          const created = await onCreate(draft);
          select(created || selected);
        }}
      />
    );
  } else if (selected) {
    detail = (
      <AgentDetail
        agent={selected}
        catalog={catalog}
        models={models}
        locale={locale}
        labels={labels.detail}
        onUseInChat={onUseInChat}
        onEdit={() => setMode({ kind: 'edit' })}
        onDuplicate={duplicate}
        onDelete={requestDelete}
      />
    );
  }

  return (
    <>
      <MasterDetail
        className={className}
        style={style}
        breakpoint={breakpoint}
        labels={{ back: labels.back }}
        onBack={() =>
          navigate(() =>
            mode.kind === 'view' ? select(null) : leaveEditor(selectedId, { kind: 'view' })
          )
        }
        list={
          <Stack p="sm">
            <AgentList
              agents={agents}
              selectedId={selectedId}
              models={models}
              loading={loading}
              error={error}
              onRetry={onRetry}
              labels={labels.list}
              onSelect={(agent) => {
                if (agent.id !== selectedId || mode.kind === 'view') {
                  navigate(() => select(agent));
                }
              }}
              onCreate={() => setWizardOpen(true)}
              onEdit={(agent) => navigate(() => select(agent, { kind: 'edit' }))}
              onDuplicate={duplicate}
              onDelete={requestDelete}
            />
          </Stack>
        }
        detail={detail}
      />

      <AgentCreateWizard
        opened={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={create}
        onGenerate={onGenerate}
        catalog={catalog}
        models={models}
        skills={skills}
        colors={colors}
        existingNames={names}
        labels={labels.wizard}
      />

      <ConfirmDialog
        opened={!!pendingNavigation}
        title={editorLabels.discardTitle}
        message={editorLabels.discardMessage}
        labels={{ confirm: editorLabels.discard, cancel: editorLabels.keepEditing }}
        danger
        onConfirm={() => pendingNavigation?.()}
        onClose={() => setPendingNavigation(null)}
      />

      <ConfirmDialog
        opened={deleteOpen}
        title={labels.deleteTitle}
        message={fillTemplate(labels.deleteMessage, {
          name: pendingDelete?.displayName || pendingDelete?.name || '',
        })}
        labels={{ confirm: labels.deleteConfirm, cancel: labels.cancel, error: labels.deleteError }}
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
});

AgentsSettingsPanel.displayName = 'AgentsSettingsPanel';
