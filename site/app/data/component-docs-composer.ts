import type { ComponentDoc } from '@/app/data/component-docs';

export const COMPOSER_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: 'ChatDropZone',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AgentChat, ChatDropZone, useFileIntake } from "@sinups/ai-kit";

export function Example({ upload }: { upload: (files: File[]) => void }) {
  const intake = useFileIntake({ accept: ["image/*", ".pdf"], maxFiles: 5, onFiles: upload });
  return (
    <ChatDropZone onFiles={intake.onDrop}>
      <AgentChat
        messages={messages}
        status={status}
        onSend={send}
        onStop={stop}
        attachments={{ onAttach: intake.open, onPaste: intake.onPaste }}
        inputBarProps={{ leftActions: intake.input }}
      />
    </ChatDropZone>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Wrap the whole chat so files dropped anywhere on it are taken, not only on the composer. While files are dragged over it, an overlay says `labels.drop` (and `labels.hint` when set) and screen readers hear it once. Moving between child elements does not flicker the overlay, and dragging text or links is ignored. Pass `onFiles`, usually `onDrop` of `useFileIntake`, so the same `accept`, `maxFiles` and `maxFileSize` apply to picked, pasted and dropped files; or give the zone its own `policy` and `onReject`. The overlay already marks the drop, so do not also pass `attachments.isDragOver` to the composer inside it; the function form of `children` gets `isDragOver` for layouts that draw their own highlight instead of the overlay. Dropping is never the only way in: keep the attach button. The kit does not upload; that stays with the host.',
      },
      {
        type: 'example',
        title: 'Drop, pick or paste through one policy',
        previewId: 'ChatDropZone/basic',
        code: `<ChatDropZone onFiles={intake.onDrop}>
  {({ isDragOver }) => (
    <InputBar
      onAttach={intake.open}
      onPaste={intake.onPaste}
      leftActions={intake.input}
      isDragOver={isDragOver}
      attachedFiles={files}
      {...composer}
    />
  )}
</ChatDropZone>`,
      },
    ],
  },
  {
    name: 'CommandToggles',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { CommandToggles, InputBar } from "@sinups/ai-kit";
import { IconBrush, IconSearch } from "@tabler/icons-react";

const commands = [
  { id: "search", label: "Search", icon: <IconSearch size={14} />, description: "Look things up on the web first" },
  { id: "image", label: "Image", icon: <IconBrush size={14} /> },
];

export function Example({ send }: { send: (text: string) => void }) {
  const [command, setCommand] = useState<string | null>(null);
  return (
    <InputBar
      status="ready"
      onStop={() => {}}
      onSend={({ content }) => send(command ? \`/\${command} \${content}\` : content)}
      leftActions={<CommandToggles commands={commands} value={command} onChange={setCommand} />}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Pinned commands for the `leftActions` slot of the composer. One command is active at a time; clicking it again clears it, and `onChange` receives `null`. Pass `value` and `onChange` to control it, or `defaultValue` to let it keep its own choice. The kit only shows the choice: add the command to the message yourself in `onSend`. Each button reports `aria-pressed`, `description` becomes a tooltip on hover and keyboard focus that is also the accessible description, and `disabled` keeps a command visible but inert. On narrow composers the row scrolls sideways instead of wrapping.',
      },
      {
        type: 'example',
        title: 'In the composer',
        previewId: 'CommandToggles/basic',
        code: `<InputBar
  leftActions={<CommandToggles commands={commands} value={command} onChange={setCommand} />}
  {...composer}
/>`,
      },
    ],
  },
  {
    name: 'StarterCategories',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AgentChat, StarterCategories } from "@sinups/ai-kit";

const categories = [
  { id: "code", label: "Code", starters: [{ id: "tests", label: "Write tests for a file", value: "Write tests for " }] },
  { id: "docs", label: "Docs", starters: [{ id: "readme", label: "Draft a README" }] },
];

export function Example() {
  const [draft, setDraft] = useState("");
  return (
    <AgentChat
      messages={[]}
      status="ready"
      onSend={send}
      onStop={stop}
      draft={draft}
      onDraftChange={setDraft}
      emptyState={{
        title: "What are we working on?",
        content: (
          <StarterCategories categories={categories} onSelect={(item) => setDraft(item.value ?? item.label)} />
        ),
      }}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Starter questions grouped by category for an empty chat. The category row is a group of buttons with `aria-pressed` that control the list under it; the starters are `Suggestions` chips. The first category is picked by default (`defaultValue={null}` starts with none); pass `value` and `onChange` to control it. Put it in `emptyState.content` of `AgentChat`, which renders host content under the greeting in both the `welcome` and `center` layouts, and fill the composer with the picked starter through `draft`.',
      },
      {
        type: 'example',
        title: 'Empty chat with categories',
        previewId: 'StarterCategories/basic',
        code: `<AgentChat
  emptyState={{
    title: "What are we working on?",
    content: <StarterCategories categories={categories} onSelect={(item) => setDraft(item.value ?? item.label)} />,
  }}
  draft={draft}
  onDraftChange={setDraft}
  {...chat}
/>`,
      },
    ],
  },
  {
    name: 'MicButton',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { InputBar, MicButton, type MicState } from "@sinups/ai-kit";

export function Example({ recorder }: { recorder: YourRecorder }) {
  const [state, setState] = useState<MicState>("idle");
  const level = useYourInputLevel(recorder);
  return (
    <InputBar
      status="ready"
      onSend={send}
      onStop={stop}
      rightActions={
        <MicButton
          state={state}
          level={level}
          onToggle={() => (state === "listening" ? recorder.stop() : recorder.start())}
        />
      }
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Round microphone button for the composer toolbar. It never touches the microphone: you record, and you move `state` through `idle`, `requesting`, `listening`, `processing`, `error` and `unsupported`. `onToggle` is called on click in `idle`, `requesting`, `listening` and `error`; `processing` and `unsupported` ignore clicks. While `listening`, `level` from 0 to 1 scales a ring around the button through a CSS variable, so only the button re-renders; under `prefers-reduced-motion` the ring stays still at the size of the button. The button keeps one accessible name, `labels.dictation`, and reports listening through `aria-pressed` and waiting through `aria-busy`; in `requesting`, `processing`, `error` and `unsupported` the state, or the `error` text, is also its accessible description. A tooltip names the state for pointer users.',
      },
      {
        type: 'example',
        title: 'States',
        previewId: 'MicButton/states',
        code: `<MicButton state="idle" />
<MicButton state="requesting" />
<MicButton state="listening" level={0.6} />
<MicButton state="processing" />
<MicButton state="error" error="Permission denied" />
<MicButton state="unsupported" />`,
      },
    ],
  },
  {
    name: 'VoiceLevel',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { VoiceLevel } from "@sinups/ai-kit";

<VoiceLevel levels={[0.2, 0.7, 0.4, 0.9, 0.3]} />
<VoiceLevel levels={0.6} source="assistant" size="xs" />`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Bars that follow a sound level you pass in, for the microphone (`source="user"`) or for speech the app plays (`source="assistant"`, a quieter color). Give one level per bar, three to five read best, or a single number for three bars around it. Levels are clamped to 0..1 and drawn with `transform`, without canvas or animation loops; `active={false}` flattens them. The bars are hidden from screen readers: the component that owns the state announces it.',
      },
      {
        type: 'example',
        title: 'Input and output',
        previewId: 'VoiceLevel/basic',
        code: `<VoiceLevel levels={inputLevels} />
<VoiceLevel levels={outputLevels} source="assistant" />`,
      },
    ],
  },
  {
    name: 'SpeakingIndicator',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { SpeakingIndicator } from "@sinups/ai-kit";

<SpeakingIndicator speaking={player.playing} levels={player.levels} onStop={player.stop} />`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Shows that the assistant is speaking, with its level and a stop button. Playback stays with you: pass `speaking`, `levels` and `onStop`. Screen readers hear `labels.speaking` once when speech starts. Put it where it fits, for example in `ChatHeader` or above the composer.',
      },
      {
        type: 'example',
        title: 'Speaking',
        previewId: 'SpeakingIndicator/basic',
        code: `<SpeakingIndicator speaking levels={levels} onStop={stop} />`,
      },
    ],
  },
];
