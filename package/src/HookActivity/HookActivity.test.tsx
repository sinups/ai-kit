import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { HookActivity } from './HookActivity';

describe('HookActivity/HookActivity', () => {
  it('shows running hooks without details', () => {
    render(<HookActivity event="PreToolUse" status="running" hooks={[{ name: 'lint' }]} />);
    expect(screen.getByText('Running PreToolUse hooks…')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens a blocked hook with its reason and hooks', () => {
    render(
      <HookActivity
        event="PreToolUse"
        status="blocked"
        reason="rm -rf is not allowed"
        hooks={[{ name: 'guard.sh', durationMs: 1200, error: 'denied' }]}
      />
    );
    expect(screen.getByText('Blocked by PreToolUse hook')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('guard.sh')).toBeInTheDocument();
    expect(screen.getByText('1s')).toBeInTheDocument();
    expect(screen.getByText('denied')).toBeInTheDocument();
  });

  it('counts finished hooks', () => {
    render(<HookActivity event="Stop" status="done" hooks={[{ name: 'a' }, { name: 'b' }]} />);
    expect(screen.getByText('Ran 2 Stop hooks')).toBeInTheDocument();
  });
});
