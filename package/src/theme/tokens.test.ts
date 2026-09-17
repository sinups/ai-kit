import { AE_TOKENS } from './tokens';

describe('theme/AE_TOKENS', () => {
  it('lists the tokens declared in vars.module.css', () => {
    expect(AE_TOKENS).toEqual(expect.arrayContaining(['bg', 'fg-muted', 'tool-bg', 'warning-bg']));
  });
});
