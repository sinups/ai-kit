import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { InvalidSettingsNotice } from './InvalidSettingsNotice';
import type { SettingsValidationError } from './validation-errors';
import { ValidationErrorsList } from './ValidationErrorsList';

const ERRORS: SettingsValidationError[] = [
  {
    file: '.agent/settings.json',
    path: 'permissions.allow[0]',
    message: 'Unknown tool "Bsh"',
    suggestion: 'Did you mean "Bash"?',
    docsUrl: 'https://docs.example.com/permissions',
  },
  { file: '.agent/settings.json', path: 'hooks', message: 'Expected an object' },
  { file: '.agent/settings.json', path: 'permissions.allow[0]', message: 'Unknown tool "Bsh"' },
  { file: '.agent/settings.json', path: 'env.PATH', message: 'Must be a string' },
  { file: '~/.agent/settings.json', path: 'model', message: 'Unknown model', severity: 'warning' },
];

describe('ValidationErrorsList', () => {
  it('groups deduplicated errors by file with paths, suggestions and docs links', async () => {
    const onOpenFile = jest.fn();
    render(<ValidationErrorsList errors={ERRORS} onOpenFile={onOpenFile} />);

    const project = screen.getByRole('region', { name: '.agent/settings.json' });
    expect(project).toHaveTextContent('3');
    expect(screen.getAllByText('Unknown tool "Bsh"')).toHaveLength(1);
    expect(screen.getByText('permissions.allow[0]')).toBeInTheDocument();
    expect(screen.getByText('Did you mean "Bash"?')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Docs/ });
    expect(link).toHaveAttribute('href', 'https://docs.example.com/permissions');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('region', { name: '~/.agent/settings.json' })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Open file' })[1]);
    expect(onOpenFile).toHaveBeenCalledWith('~/.agent/settings.json');
  });

  it('drops docs links that are not http or https', () => {
    render(
      <ValidationErrorsList
        errors={[
          { file: 'a.json', message: 'Script link', docsUrl: 'vbscript:msgbox(1)' },
          { file: 'a.json', message: 'Data link', docsUrl: 'data:text/html,<b>x</b>' },
        ]}
      />
    );
    expect(screen.getByText('Script link')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('collapses long groups behind "Show more"', async () => {
    render(
      <ValidationErrorsList errors={ERRORS} maxItems={2} labels={{ showMore: 'More ({count})' }} />
    );

    expect(screen.queryByText('Must be a string')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More (1)' }));
    expect(screen.getByText('Must be a string')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('Must be a string')).not.toBeInTheDocument();
  });

  it('renders nothing or the empty label without errors', () => {
    const { container, rerender } = render(<ValidationErrorsList errors={[]} />);
    expect(container.querySelector('section')).toBeNull();
    rerender(<ValidationErrorsList errors={[]} emptyLabel="All settings are valid" />);
    expect(screen.getByText('All settings are valid')).toBeInTheDocument();
  });
});

describe('InvalidSettingsNotice', () => {
  it('summarizes the problems and expands the details', async () => {
    const onOpenFile = jest.fn();
    render(
      <InvalidSettingsNotice
        file=".agent/settings.json"
        errors={ERRORS.slice(0, 4)}
        onOpenFile={onOpenFile}
      />
    );

    expect(screen.getByText('Settings file is invalid')).toBeInTheDocument();
    expect(
      screen.getByText('.agent/settings.json has 3 problems and is ignored until they are fixed.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Expected an object')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open file' }));
    expect(onOpenFile).toHaveBeenCalledWith('.agent/settings.json');
  });

  it('shows a pending continue action and its rejection', async () => {
    let reject: (error: Error) => void = () => {};
    const onContinueWithout = jest.fn(() => new Promise<void>((_, fail) => (reject = fail)));
    render(
      <InvalidSettingsNotice file="settings.json" count={1} onContinueWithout={onContinueWithout} />
    );

    expect(
      screen.getByText('settings.json has a problem and is ignored until it is fixed.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue without this file' }));
    expect(screen.getByRole('button', { name: 'Continue without this file' })).toHaveAttribute(
      'data-loading',
      'true'
    );
    reject(new Error('Cannot reload the session'));
    expect(await screen.findByText('Cannot reload the session')).toHaveAttribute('role', 'alert');
  });

  it('uses the warning tone and overrides', () => {
    const { container } = render(
      <InvalidSettingsNotice
        file="~/.agent/settings.json"
        errors={[ERRORS[4]]}
        title="Check your settings"
        description="Custom text"
      />
    );
    expect(screen.getByText('Check your settings')).toBeInTheDocument();
    expect(screen.getByText('Custom text')).toBeInTheDocument();
    expect(container.querySelector('[class*="Alert-root"]')).toHaveStyle({
      '--alert-color': 'var(--mantine-color-yellow-light-color)',
    });
  });
});
