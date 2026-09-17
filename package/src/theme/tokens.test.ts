import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AE_TOKENS } from './tokens';

function declaredTokens(): string[] {
  const css = readFileSync(join(__dirname, '..', 'styles', 'vars.module.css'), 'utf8');
  const names = [...css.matchAll(/^\s*--ae-([a-z0-9-]+)\s*:/gm)].map((match) => match[1]);
  return [...new Set(names)].sort();
}

describe('theme/AE_TOKENS', () => {
  it('lists exactly the tokens declared in vars.module.css', () => {
    expect([...AE_TOKENS].sort()).toEqual(declaredTokens());
  });
});
