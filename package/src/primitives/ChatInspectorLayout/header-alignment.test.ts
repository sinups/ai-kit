import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..', '..');

function rule(file: string, selector: string): string {
  const css = readFileSync(join(SRC, file), 'utf8');
  const start = css.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`${selector} is missing in ${file}`);
  }
  return css.slice(start, css.indexOf('\n}', start));
}

describe('primitives/ChatInspectorLayout header alignment', () => {
  const LAYOUT = 'primitives/ChatInspectorLayout/ChatInspectorLayout.module.css';

  it('sizes the chat header and the inspector tabs with one height token', () => {
    expect(rule('ChatHeader/ChatHeader.module.css', '.root')).toMatch(
      /min-height: var\(--ae-panel-header-height\);/
    );
    expect(rule(LAYOUT, '.tabsList')).toMatch(/\bheight: var\(--ae-panel-header-height\);/);
  });

  it('falls back to 48px only when the host or the kit theme leaves the token unset', () => {
    expect(rule('styles/vars.module.css', ':global(:root)')).toMatch(
      /--ae-panel-header-height: initial;/
    );
    expect(rule(LAYOUT, '.drawerContent')).toMatch(
      /--inspector-header-height: var\(--ae-panel-header-height, rem\(48px\)\);/
    );
    expect(rule(LAYOUT, '.inspector')).toMatch(
      /--ae-panel-header-height: var\(--inspector-header-height\);/
    );
    expect(rule('_layouts/layouts.module.css', '.viewport')).toMatch(
      /--layout-header-height: var\(--ae-panel-header-height, rem\(48px\)\);/
    );
    for (const file of [LAYOUT, '_layouts/layouts.module.css']) {
      expect(readFileSync(join(SRC, file), 'utf8')).not.toMatch(/--ae-panel-header-height: rem\(/);
    }
  });

  it('draws the tabs line like the chat header border', () => {
    expect(rule('ChatHeader/ChatHeader.module.css', '.root')).toMatch(
      /border-bottom: rem\(1px\) solid var\(--ae-border\);/
    );
    expect(rule(LAYOUT, '.inspector .tabs .tabsList')).toMatch(
      /--tab-border-color: var\(--ae-border\);/
    );
    expect(rule(LAYOUT, '.inspector .tabsList::before')).toMatch(/border-width: 0 0 rem\(1px\);/);
  });

  it('sizes the layout headers with the same token', () => {
    expect(rule('_layouts/layouts.module.css', '.header')).toMatch(
      /\bheight: var\(--ae-panel-header-height\);/
    );
  });
});
