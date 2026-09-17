import React, { memo, useId, useState } from 'react';
import { Select, Stack } from '@mantine/core';
import { IconActivity, IconBrain, IconChartBar, IconMessageChatbot } from '@tabler/icons-react';
import type { SettingsNavItem } from '../../primitives/SettingsLayout/settings-nav';
import { SettingRow } from '../../primitives/SettingsLayout/SettingRow';
import { SettingsLayout } from '../../primitives/SettingsLayout/SettingsLayout';
import { SettingsSection } from '../../primitives/SettingsLayout/SettingsSection';
import type { ModelOption } from '../../types';
import { EffortSelector, type EffortSelectorProps } from '../EffortSelector/EffortSelector';
import {
  OutputStylePicker,
  type OutputStylePickerProps,
} from '../OutputStylePicker/OutputStylePicker';
import { StatusPanel, type StatusPanelProps } from '../StatusPanel/StatusPanel';
import { UsagePanel, type UsagePanelProps } from '../UsagePanel/UsagePanel';

export type ModelSettingsSection = 'model' | 'output-style' | 'usage' | 'status';

export interface ModelSettingsPanelLabels {
  title: string;
  model: string;
  modelDescription: string;
  modelLabel: string;
  modelRowDescription: string;
  effort: string;
  outputStyle: string;
  outputStyleDescription: string;
  usage: string;
  status: string;
}

const DEFAULT_LABELS: ModelSettingsPanelLabels = {
  title: 'Model settings',
  model: 'Model',
  modelDescription: 'Model and reasoning',
  modelLabel: 'Default model',
  modelRowDescription: 'Used for new conversations',
  effort: 'Reasoning',
  outputStyle: 'Output style',
  outputStyleDescription: 'How answers are written',
  usage: 'Usage',
  status: 'Status',
};

export interface ModelSettingsPanelProps {
  /** Models offered in the model select */
  models?: ModelOption[];
  /** Id of the selected model */
  model?: string | null;
  /** Called with the id of the picked model */
  onModelChange?: (modelId: string) => void;
  /** Reasoning effort control, rendered in the model section */
  effort?: Omit<EffortSelectorProps, 'variant'>;
  /** Output style section */
  outputStyle?: Omit<OutputStylePickerProps, 'label' | 'description' | 'labelledBy'>;
  /** Usage section */
  usage?: UsagePanelProps;
  /** Status section */
  status?: StatusPanelProps;
  /** Controlled active section */
  activeSection?: ModelSettingsSection;
  /** Called with the picked section */
  onActiveSectionChange?: (section: ModelSettingsSection) => void;
  /** Section shown first in uncontrolled mode, the first available one by default */
  defaultSection?: ModelSettingsSection;
  /** Overrides of the default English labels */
  labels?: Partial<ModelSettingsPanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Settings screen for model, reasoning effort, output style, usage and status; sections appear for the props given */
export const ModelSettingsPanel = memo(function ModelSettingsPanel({
  models,
  model,
  onModelChange,
  effort,
  outputStyle,
  usage,
  status,
  activeSection,
  onActiveSectionChange,
  defaultSection,
  labels: labelsProp,
  className,
  style,
}: ModelSettingsPanelProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const modelSelectId = useId();
  const outputStyleTitleId = useId();
  const hasModel = Boolean((models && models.length > 0) || effort);

  const sections: SettingsNavItem[] = [];
  if (hasModel) {
    sections.push({
      id: 'model',
      label: labels.model,
      description: labels.modelDescription,
      icon: <IconBrain size={16} />,
    });
  }
  if (outputStyle) {
    sections.push({
      id: 'output-style',
      label: labels.outputStyle,
      description: labels.outputStyleDescription,
      icon: <IconMessageChatbot size={16} />,
    });
  }
  if (usage) {
    sections.push({ id: 'usage', label: labels.usage, icon: <IconChartBar size={16} /> });
  }
  if (status) {
    sections.push({ id: 'status', label: labels.status, icon: <IconActivity size={16} /> });
  }

  const [internalSection, setInternalSection] = useState<string | undefined>(defaultSection);
  const requested = activeSection ?? internalSection;
  const active = sections.some((section) => section.id === requested)
    ? requested!
    : (sections[0]?.id ?? 'model');

  const handleChange = (id: string) => {
    setInternalSection(id);
    onActiveSectionChange?.(id as ModelSettingsSection);
  };

  let content: React.ReactNode = null;
  if (active === 'model' && hasModel) {
    content = (
      <SettingsSection title={labels.model} description={labels.modelDescription}>
        {models && models.length > 0 && (
          <SettingRow
            label={labels.modelLabel}
            description={labels.modelRowDescription}
            htmlFor={modelSelectId}
            control={
              <Select
                id={modelSelectId}
                data={models.map((item) => ({
                  value: item.id,
                  label: item.version ? `${item.name} ${item.version}` : item.name,
                }))}
                value={model ?? null}
                allowDeselect={false}
                onChange={(value) => value !== null && onModelChange?.(value)}
              />
            }
          />
        )}
        {effort && <EffortSelector {...effort} />}
      </SettingsSection>
    );
  } else if (active === 'output-style' && outputStyle) {
    content = (
      <SettingsSection
        title={<span id={outputStyleTitleId}>{labels.outputStyle}</span>}
        description={labels.outputStyleDescription}
      >
        <OutputStylePicker {...outputStyle} labelledBy={outputStyleTitleId} />
      </SettingsSection>
    );
  } else if (active === 'usage' && usage) {
    content = <UsagePanel {...usage} />;
  } else if (active === 'status' && status) {
    content = <StatusPanel {...status} />;
  }

  return (
    <SettingsLayout
      title={labels.title}
      sections={sections}
      activeId={active}
      onActiveChange={handleChange}
      className={className}
      style={style}
    >
      <Stack gap="lg">{content}</Stack>
    </SettingsLayout>
  );
});

ModelSettingsPanel.displayName = 'ModelSettingsPanel';
