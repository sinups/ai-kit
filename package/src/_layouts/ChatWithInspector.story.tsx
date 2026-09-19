import React from 'react';
import { ChatWithInspector } from './ChatWithInspector';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'Layouts/ChatWithInspector', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <ChatWithInspector />
    </DesktopViewport>
  );
}

export function DesktopTasks() {
  return (
    <DesktopViewport>
      <ChatWithInspector inspector="tasks" />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <ChatWithInspector compact />
    </MobileViewport>
  );
}

export function MobileInspectorOpen() {
  return (
    <MobileViewport>
      <ChatWithInspector compact defaultOpened />
    </MobileViewport>
  );
}
