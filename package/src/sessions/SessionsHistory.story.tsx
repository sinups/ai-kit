import React, { useState } from 'react';
import { Box } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { MasterDetail } from '../primitives/MasterDetail/MasterDetail';
import { ExportDialog } from './ExportDialog';
import { createSessionFixtures, sessionConversation } from './fixtures';
import { SessionList } from './SessionList';
import { SessionPreview } from './SessionPreview';
import type { SessionSummary } from './types';

export default { title: 'sessions/HistoryPage' };

function History({ initialId }: { initialId: string | null }) {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => createSessionFixtures());
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [exporting, setExporting] = useState<SessionSummary | null>(null);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<SessionSummary>) =>
    setSessions((current) =>
      current.map((session) => (session.id === id ? { ...session, ...patch } : session))
    );

  return (
    <>
      <MasterDetail
        listWidth={360}
        list={
          <Box p="xs">
            <SessionList
              sessions={sessions}
              selectedId={selectedId}
              onSelect={(session) => setSelectedId(session.id)}
              onRename={(session, title) => update(session.id, { title })}
              onPin={(session, pinned) => update(session.id, { pinned })}
              onArchive={(session, archived) => update(session.id, { archived })}
              onDelete={(session) =>
                setSessions((current) => current.filter((item) => item.id !== session.id))
              }
              onExport={setExporting}
            />
          </Box>
        }
        detail={
          selected ? (
            <SessionPreview
              session={selected}
              messages={sessionConversation}
              onResume={() => {}}
              onExport={setExporting}
            />
          ) : null
        }
        onBack={() => setSelectedId(null)}
      />
      <ExportDialog
        opened={exporting !== null}
        onClose={() => setExporting(null)}
        title={exporting?.title}
        messages={sessionConversation}
        onDownload={() => setExporting(null)}
      />
    </>
  );
}

export function HistoryPage() {
  return (
    <WidthFrame width={WIDE_WIDTH + 200}>
      <Box h={640}>
        <History initialId="auth-retry" />
      </Box>
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={640}>
        <History initialId={null} />
      </Box>
    </WidthFrame>
  );
}
