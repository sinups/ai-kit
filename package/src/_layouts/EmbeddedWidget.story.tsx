import React from 'react';
import { EmbeddedWidget } from './EmbeddedWidget';
import { DesktopViewport, MobileViewport } from './shared';

export default { title: 'layouts/EmbeddedWidget', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return (
    <DesktopViewport>
      <EmbeddedWidget />
    </DesktopViewport>
  );
}

export function Closed() {
  return (
    <DesktopViewport>
      <EmbeddedWidget defaultOpened={false} />
    </DesktopViewport>
  );
}

export function Welcome() {
  return (
    <DesktopViewport>
      <EmbeddedWidget empty />
    </DesktopViewport>
  );
}

export function Mobile() {
  return (
    <MobileViewport>
      <EmbeddedWidget />
    </MobileViewport>
  );
}

export function MobileWelcome() {
  return (
    <MobileViewport>
      <EmbeddedWidget empty />
    </MobileViewport>
  );
}
