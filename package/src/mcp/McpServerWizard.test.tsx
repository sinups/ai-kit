import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { GIT_SERVER } from './fixtures';
import { McpServerWizard } from './McpServerWizard';

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('McpServerWizard', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('adds a stdio server, splitting a pasted command line', async () => {
    const onSubmit = jest.fn();
    render(<McpServerWizard onSubmit={onSubmit} existingNames={['git']} />);

    await next();
    expect(screen.getByText('Enter a server name')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'Git');
    await next();
    expect(screen.getByText('A server with this name already exists')).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('textbox', { name: /Name/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'filesystem');
    await next();

    await next();
    expect(screen.getByText('Enter the command that starts the server')).toBeInTheDocument();
    const command = screen.getByRole('textbox', { name: /Command/ });
    await userEvent.type(command, 'npx');
    await userEvent.paste(' --yes');
    expect(command).toHaveValue('npx --yes');
    await userEvent.clear(command);
    await userEvent.paste('npx -y @modelcontextprotocol/server-filesystem "/tmp/My Docs"');
    expect(screen.getByRole('textbox', { name: /Command/ })).toHaveValue('npx');
    await next();

    expect(screen.getByText('Environment', { selector: 'label' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByText('npx -y @modelcontextprotocol/server-filesystem /tmp/My Docs')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add server' }));
    expect(onSubmit).toHaveBeenCalledWith({
      id: undefined,
      name: 'filesystem',
      scope: 'user',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/My Docs'],
      url: '',
      env: [],
      headers: [],
    });
  });

  it('validates the url of a remote server and shows a submit error', async () => {
    render(
      <McpServerWizard
        onSubmit={() => Promise.reject(new Error('Server rejected the handshake'))}
      />
    );

    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'issues');
    await userEvent.click(screen.getByRole('radio', { name: 'HTTP' }));
    await next();

    await userEvent.type(screen.getByRole('textbox', { name: /URL/ }), 'issues.example.com');
    await next();
    expect(screen.getByText('Enter an http:// or https:// URL')).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('textbox', { name: /URL/ }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /URL/ }),
      'https://issues.example.com/mcp'
    );
    await next();

    expect(screen.getByText('Headers', { selector: 'label' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add header' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Header 1' }), 'Bad Header');
    await next();
    expect(screen.getByRole('textbox', { name: 'Header 1' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await userEvent.clear(screen.getByRole('textbox', { name: 'Header 1' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Header 1' }), 'X-Team');
    await next();

    await userEvent.click(screen.getByRole('button', { name: 'Add server' }));
    expect(await screen.findByText('Server rejected the handshake')).toBeInTheDocument();
  });

  it('edits an existing server keeping its own name', async () => {
    const onSubmit = jest.fn();
    render(
      <McpServerWizard
        initialServer={GIT_SERVER}
        existingNames={['git', 'issues']}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('git');
    await next();
    expect(screen.getByRole('textbox', { name: /URL/ })).toHaveValue(GIT_SERVER.url);
    await userEvent.clear(screen.getByRole('textbox', { name: /URL/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to step' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '4. Review' }));
    expect(screen.getByText('••••••••')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter the server URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox', { name: /URL/ }), GIT_SERVER.url!);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'git', transport: 'http', headers: GIT_SERVER.headers })
    );
  });
});
