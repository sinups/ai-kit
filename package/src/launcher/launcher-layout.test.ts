import {
  findLauncherFeed,
  getLauncherFocusTarget,
  getLauncherLayout,
  getLauncherVars,
  resolveLauncherOffset,
  type LauncherLayoutInput,
} from './launcher-layout';

const input = (overrides: Partial<LauncherLayoutInput>): LauncherLayoutInput => ({
  availableWidth: 1440,
  availableHeight: 900,
  panelWidth: 380,
  panelHeight: 640,
  offset: 24,
  mobileFullScreen: true,
  fullScreenBreakpoint: 520,
  ...overrides,
});

describe('launcher/launcher-layout', () => {
  it('resolves offsets', () => {
    expect(resolveLauncherOffset(24)).toEqual({ x: 24, y: 24 });
    expect(resolveLauncherOffset({ x: 12, y: 32 })).toEqual({ x: 12, y: 32 });
  });

  it('keeps the requested size when the panel fits above the button', () => {
    expect(getLauncherLayout(input({}))).toEqual({
      mode: 'compact',
      offset: { x: 24, y: 24 },
      panelWidth: 380,
      panelHeight: 640,
    });
  });

  it('leaves room for both offsets in the height', () => {
    expect(getLauncherLayout(input({ availableWidth: 768, availableHeight: 600 }))).toMatchObject({
      mode: 'compact',
      panelHeight: 600 - 48,
    });
  });

  it('moves to a 12px offset when only that fits', () => {
    expect(getLauncherLayout(input({ availableWidth: 520, panelWidth: 480 }))).toEqual({
      mode: 'tight',
      offset: { x: 12, y: 12 },
      panelWidth: 480,
      panelHeight: 640,
    });
  });

  it('goes full screen on narrow or short boxes and when the panel does not fit', () => {
    expect(getLauncherLayout(input({ availableWidth: 430, availableHeight: 932 }))).toEqual({
      mode: 'fullscreen',
      offset: { x: 24, y: 24 },
      panelWidth: 430,
      panelHeight: 932,
    });
    expect(getLauncherLayout(input({ availableWidth: 844, availableHeight: 390 })).mode).toBe(
      'fullscreen'
    );
    expect(getLauncherLayout(input({ availableWidth: 610, panelWidth: 600 })).mode).toBe(
      'fullscreen'
    );
  });

  it('never grows past the box when full screen is off', () => {
    expect(
      getLauncherLayout(
        input({ availableWidth: 320, availableHeight: 500, mobileFullScreen: false })
      )
    ).toEqual({
      mode: 'tight',
      offset: { x: 12, y: 12 },
      panelWidth: 296,
      panelHeight: 500 - 24,
    });
  });

  it('builds placement variables per corner', () => {
    const layout = getLauncherLayout(input({}));
    expect(getLauncherVars('bottom-right', layout)).toMatchObject({
      '--launcher-offset-x': '24px',
      '--launcher-panel-width': '380px',
      '--launcher-panel-height': '640px',
      '--launcher-origin': 'bottom right',
    });
    expect(getLauncherVars('bottom-left', layout)).toMatchObject({
      '--launcher-origin': 'bottom left',
    });
  });

  it('prefers an autofocus target, then the composer, then the first focusable element', () => {
    const panel = document.createElement('div');
    const body = document.createElement('div');
    panel.append(body);
    expect(getLauncherFocusTarget(panel, body)).toBe(panel);

    const button = document.createElement('button');
    body.append(button);
    expect(getLauncherFocusTarget(panel, body)).toBe(button);

    const textarea = document.createElement('textarea');
    body.append(textarea);
    expect(getLauncherFocusTarget(panel, body)).toBe(textarea);

    const input = document.createElement('input');
    input.setAttribute('data-autofocus', '');
    body.append(input);
    expect(getLauncherFocusTarget(panel, body)).toBe(input);
    expect(getLauncherFocusTarget(null, null)).toBeNull();
  });
});

describe('launcher/findLauncherFeed', () => {
  it('returns the outermost scroll container and skips nested ones', () => {
    const body = document.createElement('div');
    body.innerHTML =
      '<div><div data-feed style="overflow-y:auto"><pre style="overflow-y:auto"></pre></div></div>';
    document.body.append(body);
    expect(findLauncherFeed(body)).toBe(body.querySelector('[data-feed]'));
    expect(findLauncherFeed(null)).toBeNull();
    body.remove();
  });
});
