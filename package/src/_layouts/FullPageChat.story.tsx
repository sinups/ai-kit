import React from 'react';
import { FullPageChat } from './FullPageChat';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'Layouts/FullPageChat', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <FullPageChat />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <FullPageChat compact />
    </MobileViewport>
  );
}
