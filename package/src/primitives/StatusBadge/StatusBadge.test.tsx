import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { AGENT_UI_STATUSES, getStatusMeta } from './status-meta';
import { StatusBadge } from './StatusBadge';

describe('primitives/status-meta', () => {
  it('describes every status with a color, label and icon', () => {
    for (const status of AGENT_UI_STATUSES) {
      const meta = getStatusMeta(status);
      expect(meta.color).toBeTruthy();
      expect(meta.label).toBeTruthy();
      expect(meta.icon).toBeTruthy();
    }
    expect(getStatusMeta('needs-auth')).toMatchObject({ color: 'orange', label: 'Needs auth' });
    expect(getStatusMeta('error').color).toBe('red');
  });

  it('marks only pending and running as loading', () => {
    expect(AGENT_UI_STATUSES.filter((status) => getStatusMeta(status).loading)).toEqual([
      'pending',
      'running',
    ]);
  });
});

describe('primitives/StatusBadge', () => {
  it('renders the default label with an icon', () => {
    const { container } = render(<StatusBadge status="success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.mantine-Loader-root')).not.toBeInTheDocument();
  });

  it('renders a loader for running and respects a custom label', () => {
    const { container } = render(<StatusBadge status="running" label="Connecting" />);
    expect(screen.getByText('Connecting')).toBeInTheDocument();
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('renders the dot variant without an icon', () => {
    const { container } = render(<StatusBadge status="error" variant="dot" withIcon={false} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(container.querySelector('.mantine-ColorSwatch-root')).toBeInTheDocument();
    expect(container.querySelector('[data-status="error"]')).toBeInTheDocument();
  });
});
