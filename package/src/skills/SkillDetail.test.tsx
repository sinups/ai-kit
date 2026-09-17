import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { skills } from './fixtures';
import { SkillDetail } from './SkillDetail';

describe('skills/SkillDetail', () => {
  it('renders metadata, allowed tools and markdown instructions', () => {
    render(<SkillDetail skill={skills[0]} locale="en-US" />);
    expect(screen.getByRole('heading', { name: 'pdf' })).toBeInTheDocument();
    expect(screen.getByText('1.4.0')).toBeInTheDocument();
    expect(screen.getByText('Built-in')).toBeInTheDocument();
    expect(screen.getByText('Aug 30, 2026')).toBeInTheDocument();
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PDF processing' })).toBeInTheDocument();
  });

  it('shows placeholders when tools and instructions are missing', () => {
    render(<SkillDetail skill={skills[4]} />);
    expect(screen.queryByText('Allowed tools')).toBeInTheDocument();
    expect(screen.getByText('This skill has no instructions yet.')).toBeInTheDocument();
  });

  it('edits and toggles with a pending state and error', async () => {
    const onEdit = jest.fn();
    const onToggle = jest.fn().mockRejectedValue(new Error('Managed by admin'));
    render(<SkillDetail skill={skills[0]} onEdit={onEdit} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(skills[0]);

    await userEvent.click(screen.getByRole('button', { name: 'Disable' }));
    expect(onToggle).toHaveBeenCalledWith(skills[0], false);
    expect(await screen.findByText('Managed by admin')).toBeInTheDocument();
  });
});
