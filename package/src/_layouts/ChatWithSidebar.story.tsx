import React from 'react';
import { ChatWithSidebar } from './ChatWithSidebar';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'Layouts/ChatWithSidebar', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <ChatWithSidebar />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <ChatWithSidebar compact />
    </MobileViewport>
  );
}
