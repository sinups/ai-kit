import React from 'react';
import { SettingsPage } from './SettingsPage';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'layouts/SettingsPage', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <SettingsPage />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <SettingsPage />
    </MobileViewport>
  );
}
