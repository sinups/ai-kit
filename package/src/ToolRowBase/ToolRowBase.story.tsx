import React from 'react';
import { IconEye } from '@tabler/icons-react';
import { ToolRowBase } from './ToolRowBase';

export default { title: 'ToolRowBase' };

export function Usage() {
  return (
    <div style={{ padding: 40, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ToolRowBase
        completeLabel="Read"
        shimmerLabel="Reading"
        isAnimating
        detail="package.json"
        icon={<IconEye />}
      />
      <ToolRowBase
        completeLabel="Read"
        isAnimating={false}
        detail="package.json"
        icon={<IconEye />}
      />
      <ToolRowBase
        completeLabel="Thought"
        shimmerLabel="Thinking"
        isAnimating={false}
        expandable
        defaultOpen
      >
        <div style={{ fontSize: 14, color: 'var(--ae-fg-muted)' }}>Collapsible body content</div>
      </ToolRowBase>
    </div>
  );
}
