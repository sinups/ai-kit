import React from 'react';
import { NewChatEmptyState } from './NewChatEmptyState';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'Layouts/NewChatEmptyState', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <NewChatEmptyState />
    </DesktopViewport>
  );
}

export function DesktopCenter() {
  return (
    <DesktopViewport>
      <NewChatEmptyState layout="center" />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <NewChatEmptyState />
    </MobileViewport>
  );
}
