import '@mantine/core/styles.css';
import '../package/src/styles/vars.module.css';
import { createTheme, MantineProvider } from '@mantine/core';
import type { Preview } from '@storybook/react';
import React, { useEffect } from 'react';
import { useGlobals } from '@storybook/preview-api';
import {
  AI_KIT_ACCENTS,
  AI_KIT_DENSITIES,
  AI_KIT_RADII,
  type AiKitAccent,
  type AiKitDensity,
  type AiKitRadius,
} from '../package/src/theme/ai-kit-settings';
import { AiKitProvider } from '../package/src/theme/AiKitProvider';

// Components that exist on main are captured by the visual baselines without the kit theme; `aiKit: 'auto'` keeps them that way.
const HOST_THEMED_TITLES = [
  'Chat/AgentChat',
  'Chat/MessageList',
  'Input/InputBar',
  'Messages/ErrorMessage',
  'Messages/ImageLightbox',
  'Messages/Markdown',
  'Messages/UserMessage',
  'Status/SpiralLoader',
  'Status/TextShimmer',
  'Tools/ActionRow',
  'Tools/BashTool',
  'Tools/EditTool',
  'Tools/McpTool',
  'Tools/PlanTool',
  'Tools/QuestionTool',
  'Tools/SearchTool',
  'Tools/ShellOutput',
  'Tools/SubagentTool',
  'Tools/ThinkingTool',
  'Tools/TodoTool',
  'Tools/ToolApprovalFooter',
  'Tools/ToolGroup',
  'Tools/ToolRenderer',
  'Tools/ToolRowBase',
];

function usesKitTheme(context: any): boolean {
  const mode = context.globals.aiKit;
  if (mode === 'on' || mode === 'off') {
    return mode === 'on';
  }
  if (typeof context.parameters.aiKit === 'boolean') {
    return context.parameters.aiKit;
  }
  const title: string = context.title ?? '';
  return !HOST_THEMED_TITLES.includes(title);
}

const fromToolbar = (value: string | undefined) =>
  value === undefined || value === 'unset' ? undefined : value;

const mantineTheme = createTheme({
  fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    options: {
      storySort: {
        order: [
          'Chat',
          [
            'AgentChat',
            'ChatHeader',
            'MessageList',
            'TranscriptSearch',
            'StarterCategories',
            'Notices',
          ],
          'Messages',
          [
            'UserMessage',
            'Markdown',
            'CodeBlock',
            'ImageLightbox',
            'MediaPart',
            'ArtifactPanel',
            'ArtifactCard',
            'ErrorMessage',
            'MessageActions',
            'MessageActionButton',
            'EditMessageComposer',
            'FeedbackForm',
            'RewindDialog',
            'PlanApproval',
            'CommandChip',
            'ToolResultNotice',
            'MemoryNotice',
          ],
          'Status',
          [
            'AgentStatus',
            'SpiralLoader',
            'TextShimmer',
            'TurnSummary',
            'ContextUsage',
            'ContextBreakdown',
            'CompactBoundary',
            'ContextEventRow',
            'HookActivity',
          ],
          'Tools',
          [
            'ToolRenderer',
            'BashTool',
            'EditTool',
            'SearchTool',
            'TodoTool',
            'PlanTool',
            'ToolGroup',
            'SubagentTool',
            'QuestionTool',
            'McpTool',
            'ThinkingTool',
            'ToolApprovalFooter',
            'ElicitationForm',
            'ShellOutput',
            'ActionRow',
            'ToolRowBase',
          ],
          'Input',
          ['InputBar', 'ModeSelector', 'FileAttachment', 'ChatDropZone', 'CommandToggles'],
          'Voice',
          ['MicButton', 'VoiceLevel', 'SpeakingIndicator'],
          'Primitives',
          'Agents & skills',
          'MCP',
          'Permissions & hooks',
          'Sessions & tasks',
          'Diff',
          'Settings',
          'Layouts',
          'Demos',
          'Theme',
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Mantine color scheme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    aiKit: {
      name: 'Kit theme',
      description: 'Wraps stories in AiKitProvider',
      defaultValue: 'auto',
      toolbar: {
        icon: 'lightning',
        items: [
          { value: 'auto', title: 'Kit theme per story' },
          { value: 'on', title: 'Kit theme on' },
          { value: 'off', title: 'Kit theme off' },
        ],
      },
    },
    accent: {
      name: 'Accent',
      description: 'AiKitProvider accent',
      defaultValue: 'unset',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'unset', title: 'Default accent' },
          ...AI_KIT_ACCENTS.map((accent) => ({ value: accent, title: accent })),
        ],
      },
    },
    radius: {
      name: 'Radius',
      description: 'AiKitProvider radius',
      defaultValue: 'unset',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'unset', title: 'Provider radius' },
          ...AI_KIT_RADII.map((value) => ({ value, title: `Radius ${value}` })),
        ],
      },
    },
    density: {
      name: 'Density',
      description: 'AiKitProvider density',
      defaultValue: 'unset',
      toolbar: {
        icon: 'component',
        items: [
          { value: 'unset', title: 'Provider density' },
          ...AI_KIT_DENSITIES.map((value) => ({ value, title: `Density ${value}` })),
        ],
      },
    },
  },
  decorators: [
    (renderStory: any, context: any) => {
      const [{ theme }, updateGlobals] = useGlobals();

      useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
          const isMod = event.metaKey || event.ctrlKey;
          const isJ = event.code === 'KeyJ';

          if (!isMod || !isJ) {
            return;
          }

          event.preventDefault();
          updateGlobals({ theme: theme === 'dark' ? 'light' : 'dark' });
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [theme, updateGlobals]);

      const scheme = (context.globals.theme || 'light') as 'light' | 'dark';

      return (
        <MantineProvider theme={mantineTheme} forceColorScheme={scheme}>
          {usesKitTheme(context) ? (
            <AiKitProvider
              accent={fromToolbar(context.globals.accent) as AiKitAccent | undefined}
              radius={fromToolbar(context.globals.radius) as AiKitRadius | undefined}
              density={fromToolbar(context.globals.density) as AiKitDensity | undefined}
            >
              <style>{'body{background-color:var(--ae-bg)}'}</style>
              {renderStory()}
            </AiKitProvider>
          ) : (
            renderStory()
          )}
        </MantineProvider>
      );
    },
  ],
};

export default preview;
