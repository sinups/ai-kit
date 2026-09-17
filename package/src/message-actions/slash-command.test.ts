import { matchSlashCommand, parseSlashCommand } from './slash-command';

describe('slash-command', () => {
  it('parses the command name and arguments', () => {
    expect(parseSlashCommand('/review src/auth')).toEqual({ name: 'review', args: 'src/auth' });
    expect(parseSlashCommand('  /compact  ')).toEqual({ name: 'compact', args: '' });
    expect(parseSlashCommand('/mcp:git list\nopen')).toEqual({
      name: 'mcp:git',
      args: 'list\nopen',
    });
  });

  it('ignores text that is not a command', () => {
    expect(parseSlashCommand('review /src')).toBeNull();
    expect(parseSlashCommand('/')).toBeNull();
    expect(parseSlashCommand('/usr/bin/node crashed')).toBeNull();
  });

  it('matches only known commands', () => {
    const commands = [{ name: 'review' }, { name: '/init' }];
    expect(matchSlashCommand('/review a.ts', commands)?.command.name).toBe('review');
    expect(matchSlashCommand('/init', commands)?.args).toBe('');
    expect(matchSlashCommand('/unknown', commands)).toBeNull();
  });
});
