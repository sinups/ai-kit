import React from 'react';
import { waitFor } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AVAILABLE_TOOLS, skills } from './fixtures';
import { SkillEditor } from './SkillEditor';

describe('SkillEditor', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('validates the slug and taken names before saving', async () => {
    const onSave = jest.fn();
    render(<SkillEditor takenNames={['pdf']} onSave={onSave} />);

    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'My Skill');
    await userEvent.click(screen.getByRole('button', { name: 'Create skill' }));
    expect(
      screen.getByText('Use lowercase letters, digits and single hyphens')
    ).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByRole('textbox', { name: /Name/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'pdf');
    expect(screen.getByText('A skill with this name already exists')).toBeInTheDocument();
  });

  it('saves a normalized draft with tags, tools and content', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<SkillEditor availableTools={AVAILABLE_TOOLS} onSave={onSave} />);

    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'lint-fix');
    await userEvent.type(
      screen.getByRole('textbox', { name: /Description/ }),
      '  Fix lint errors '
    );
    await userEvent.type(
      screen.getByPlaceholderText('Add a tag and press Enter'),
      'quality{Enter}'
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Instructions' }), '# Lint');
    await userEvent.click(screen.getByRole('button', { name: 'Create skill' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'lint-fix',
        description: 'Fix lint errors',
        tags: ['quality'],
        allowedTools: [],
        content: '# Lint',
      })
    );
  });

  it('previews markdown in the preview tab', async () => {
    render(<SkillEditor skill={skills[0]} onSave={() => {}} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByRole('heading', { name: 'PDF processing' })).toBeInTheDocument();
  });

  it('keeps the form open and shows the rejection message', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Read-only workspace'));
    render(<SkillEditor skill={skills[1]} onSave={onSave} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), ' Now faster.');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Read-only workspace')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('asks before discarding unsaved changes', async () => {
    const onCancel = jest.fn();
    render(<SkillEditor skill={skills[1]} onSave={() => {}} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
