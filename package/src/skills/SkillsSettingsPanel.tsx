import React, { memo, useCallback, useMemo, useState } from 'react';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { MasterDetail } from '../primitives/MasterDetail/MasterDetail';
import { SkillCatalog, type SkillCatalogLabels } from './SkillCatalog';
import { SkillDetail, type SkillDetailLabels } from './SkillDetail';
import { DEFAULT_SKILL_EDITOR_LABELS, SkillEditor, type SkillEditorLabels } from './SkillEditor';
import { getDuplicateSkillName, skillToDraft } from './skill-utils';
import type { Skill, SkillDraft } from './types';
import classes from './Skills.module.css';

export interface SkillsSettingsPanelProps {
  /** Skills to manage */
  skills: Skill[];
  /** Shows skeletons in the catalog */
  loading?: boolean;
  /** Error message shown instead of the catalog */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Tool names offered in the editor */
  availableTools?: string[];
  /** Enables or disables a skill */
  onToggle?: (skill: Skill, enabled: boolean) => Promise<void> | void;
  /** Creates a skill from a draft, New skill and Duplicate are available only when set; return the created skill to select it */
  onCreate?: (draft: SkillDraft) => Promise<Skill | void> | Skill | void;
  /** Saves edits of a skill, Edit is available only when set */
  onUpdate?: (skill: Skill, draft: SkillDraft) => Promise<void> | void;
  /** Removes a skill after confirmation, the dialog stays open with the error when the returned promise rejects */
  onRemove?: (skill: Skill) => void | Promise<void>;
  /** Returns whether a skill can be edited, user and project skills by default */
  isEditable?: (skill: Skill) => boolean;
  /** Selected skill id, uncontrolled when omitted */
  selectedId?: string | null;
  /** Called when the selected skill changes */
  onSelectedIdChange?: (id: string | null) => void;
  /** Catalog layout, `list` by default */
  catalogVariant?: 'list' | 'grid';
  /** Component width in px from which catalog and detail sit side by side, `720` by default */
  breakpoint?: number;
  /** Catalog pane width in px when wide, `340` by default */
  listWidth?: number;
  /** Label overrides of the catalog */
  catalogLabels?: Partial<SkillCatalogLabels>;
  /** Label overrides of the detail view */
  detailLabels?: Partial<SkillDetailLabels>;
  /** Label overrides of the editor */
  editorLabels?: Partial<SkillEditorLabels>;
  /** Label overrides of the remove confirmation */
  removeLabels?: Partial<SkillRemoveLabels>;
  /** Back button label on narrow widths, `Skills` by default */
  backLabel?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element, give the panel a height */
  style?: React.CSSProperties;
}

export interface SkillRemoveLabels {
  title: string;
  message: (skill: Skill) => React.ReactNode;
  confirm: string;
  cancel: string;
  error: string;
}

const DEFAULT_REMOVE_LABELS: SkillRemoveLabels = {
  title: 'Remove skill?',
  message: (skill) => `${skill.name} will be removed. This cannot be undone.`,
  confirm: 'Remove',
  cancel: 'Cancel',
  error: 'Could not remove the skill',
};

type PanelMode =
  | { kind: 'view' }
  | { kind: 'edit'; id: string }
  | { kind: 'create'; draft?: Partial<SkillDraft>; key: number };

const defaultIsEditable = (skill: Skill) => skill.source === 'user' || skill.source === 'project';

export const SkillsSettingsPanel = memo(function SkillsSettingsPanel({
  skills,
  loading,
  error,
  onRetry,
  availableTools,
  onToggle,
  onCreate,
  onUpdate,
  onRemove,
  isEditable = defaultIsEditable,
  selectedId: selectedIdProp,
  onSelectedIdChange,
  catalogVariant = 'list',
  breakpoint,
  listWidth = 340,
  catalogLabels,
  detailLabels,
  editorLabels,
  removeLabels,
  backLabel = 'Skills',
  className,
  style,
}: SkillsSettingsPanelProps) {
  const [selectedIdState, setSelectedIdState] = useState<string | null>(null);
  const [mode, setMode] = useState<PanelMode>({ kind: 'view' });
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Skill | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const discardText = { ...DEFAULT_SKILL_EDITOR_LABELS, ...editorLabels };
  const removeText = { ...DEFAULT_REMOVE_LABELS, ...removeLabels };

  const selectedId = selectedIdProp !== undefined ? selectedIdProp : selectedIdState;
  const selected = skills.find((skill) => skill.id === selectedId) ?? null;
  const takenNames = useMemo(() => skills.map((skill) => skill.name), [skills]);

  const select = (id: string | null) => {
    setSelectedIdState(id);
    onSelectedIdChange?.(id);
  };

  const leaveEditor = (action: () => void) => {
    if (mode.kind !== 'view' && editorDirty) {
      setPendingLeave(() => action);
      return;
    }
    action();
  };

  const closeEditor = () => {
    setEditorDirty(false);
    setMode({ kind: 'view' });
  };

  const handleDirtyChange = useCallback((dirty: boolean) => setEditorDirty(dirty), []);

  const startCreate = (draft?: Partial<SkillDraft>) =>
    leaveEditor(() => {
      setEditorDirty(false);
      setMode({ kind: 'create', draft, key: Date.now() });
    });

  const edit = onUpdate
    ? (skill: Skill) =>
        leaveEditor(() => {
          setEditorDirty(false);
          select(skill.id);
          setMode({ kind: 'edit', id: skill.id });
        })
    : undefined;

  const editingSkill =
    mode.kind === 'edit' ? skills.find((skill) => skill.id === mode.id) : undefined;

  let detail: React.ReactNode = null;
  if (mode.kind === 'create' && onCreate) {
    detail = (
      <SkillEditor
        key={`create-${mode.key}`}
        initialDraft={mode.draft}
        availableTools={availableTools}
        takenNames={takenNames}
        labels={editorLabels}
        onCancel={closeEditor}
        onDirtyChange={handleDirtyChange}
        onSave={async (draft) => {
          const created = await onCreate(draft);
          closeEditor();
          if (created) {
            select(created.id);
          }
        }}
      />
    );
  } else if (editingSkill && onUpdate) {
    detail = (
      <SkillEditor
        key={`edit-${editingSkill.id}`}
        skill={editingSkill}
        availableTools={availableTools}
        takenNames={takenNames}
        labels={editorLabels}
        onCancel={closeEditor}
        onDirtyChange={handleDirtyChange}
        onSave={async (draft) => {
          await onUpdate(editingSkill, draft);
          closeEditor();
        }}
      />
    );
  } else if (selected) {
    detail = (
      <SkillDetail
        key={selected.id}
        skill={selected}
        onToggle={onToggle}
        onEdit={edit && isEditable(selected) ? edit : undefined}
        labels={detailLabels}
      />
    );
  }

  return (
    <>
      <MasterDetail
        className={className}
        style={style}
        breakpoint={breakpoint}
        listWidth={listWidth}
        detail={detail}
        backLabel={backLabel}
        onBack={() =>
          leaveEditor(() => {
            closeEditor();
            select(null);
          })
        }
        list={
          <SkillCatalog
            skills={skills}
            loading={loading}
            error={error}
            onRetry={onRetry}
            variant={catalogVariant}
            selectedId={selectedId}
            labels={catalogLabels}
            className={classes.panelCatalog}
            isEditable={isEditable}
            onSelect={(skill) => {
              if (mode.kind === 'edit' && mode.id === skill.id) {
                return;
              }
              leaveEditor(() => {
                closeEditor();
                select(skill.id);
              });
            }}
            onToggle={onToggle}
            onEdit={edit}
            onDuplicate={
              onCreate
                ? (skill) =>
                    startCreate({
                      ...skillToDraft(skill),
                      name: getDuplicateSkillName(skill.name, takenNames),
                    })
                : undefined
            }
            onRemove={
              onRemove
                ? (skill) => {
                    setRemoveTarget(skill);
                    setRemoveOpen(true);
                  }
                : undefined
            }
            onCreate={onCreate ? () => startCreate() : undefined}
          />
        }
      />
      <ConfirmDialog
        opened={pendingLeave !== null}
        title={discardText.discardTitle}
        message={discardText.discardMessage}
        confirmLabel={discardText.discard}
        cancelLabel={discardText.keepEditing}
        danger
        onConfirm={() => pendingLeave?.()}
        onClose={() => setPendingLeave(null)}
      />
      {onRemove && (
        <ConfirmDialog
          opened={removeOpen}
          title={removeText.title}
          message={removeTarget ? removeText.message(removeTarget) : null}
          confirmLabel={removeText.confirm}
          cancelLabel={removeText.cancel}
          errorLabel={removeText.error}
          danger
          onConfirm={async () => {
            if (!removeTarget) {
              return;
            }
            await onRemove(removeTarget);
            if (removeTarget.id === selectedId) {
              closeEditor();
              select(null);
            }
          }}
          onClose={() => setRemoveOpen(false)}
        />
      )}
    </>
  );
});
