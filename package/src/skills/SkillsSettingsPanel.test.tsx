import React, { useState } from 'react';
import { waitFor, within } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AVAILABLE_TOOLS, skills as fixtureSkills } from './fixtures';
import { SkillsSettingsPanel } from './SkillsSettingsPanel';
import type { Skill } from './types';

function Harness({
  breakpoint,
  onToggle,
}: {
  breakpoint?: number;
  onToggle?: (skill: Skill, enabled: boolean) => Promise<void>;
}) {
  const [skills, setSkills] = useState<Skill[]>(fixtureSkills);
  return (
    <SkillsSettingsPanel
      skills={skills}
      availableTools={AVAILABLE_TOOLS}
      breakpoint={breakpoint}
      onToggle={onToggle}
      onRemove={(skill) => setSkills((items) => items.filter((item) => item.id !== skill.id))}
      onCreate={(draft) => {
        const created: Skill = { ...draft, id: draft.name, source: 'user', enabled: true };
        setSkills((items) => [...items, created]);
        return created;
      }}
      onUpdate={(skill, draft) =>
        setSkills((items) =>
          items.map((item) => (item.id === skill.id ? { ...item, ...draft } : item))
        )
      }
    />
  );
}

describe('skills/SkillsSettingsPanel', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('opens the detail, edits an editable skill and returns to the detail', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByText('code-review'));
    expect(screen.getByRole('heading', { name: 'code-review' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const description = screen.getByRole('textbox', { name: /Description/ });
    await userEvent.clear(description);
    await userEvent.type(description, 'Review diffs');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'code-review' })).toBeInTheDocument()
    );
    expect(screen.getAllByText('Review diffs').length).toBeGreaterThan(0);
  });

  it('does not carry a toggle error over to another skill', async () => {
    render(<Harness onToggle={() => Promise.reject(new Error('Managed by admin'))} />);

    await userEvent.click(screen.getAllByText('pdf')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Disable' }));
    expect(await screen.findAllByText('Managed by admin')).not.toHaveLength(0);

    await userEvent.click(screen.getByText('code-review'));
    expect(screen.getByRole('heading', { name: 'code-review' })).toBeInTheDocument();
    expect(screen.queryByText('Managed by admin')).not.toBeInTheDocument();
  });

  it('confirms removal and clears the selection of the removed skill', async () => {
    render(<Harness breakpoint={0} />);

    await userEvent.click(screen.getByText('code-review'));
    await userEvent.click(screen.getByRole('button', { name: /Skill actions: code-review/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    expect(screen.getByRole('heading', { name: 'code-review' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'code-review' })).not.toBeInTheDocument()
    );
    expect(screen.queryByText('code-review')).not.toBeInTheDocument();
  });

  it('hides Edit for built-in skills', async () => {
    render(<Harness />);
    await userEvent.click(screen.getAllByText('pdf')[0]);
    expect(screen.getByRole('heading', { name: 'pdf' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('duplicates a skill into a prefilled editor and selects the created skill', async () => {
    render(<Harness />);

    const actions = screen.getAllByRole('button', { name: /Skill actions/ });
    await userEvent.click(actions[0]);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('pdf-copy');

    await userEvent.click(screen.getByRole('button', { name: 'Create skill' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'pdf-copy' })).toBeInTheDocument()
    );
  });

  it('asks before leaving unsaved edits with the back button', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByText('code-review'));
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), '!');

    await userEvent.click(screen.getByRole('button', { name: 'Skills' }));
    const dialog = await screen.findByRole('dialog', { name: 'Discard changes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: /Description/ })).toHaveValue(
      `${fixtureSkills[1].description}!`
    );

    await userEvent.click(screen.getByRole('button', { name: 'Skills' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Search skills' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('textbox', { name: /Description/ })).not.toBeInTheDocument();
  });

  it('asks before switching to another skill while editing and leaves clean edits at once', async () => {
    render(<Harness breakpoint={0} />);

    await userEvent.click(screen.getByText('code-review'));
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByText('release-notes'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'release-notes' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), '!');
    await userEvent.click(screen.getByText('code-review'));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'code-review' })).toBeInTheDocument()
    );
  });
});
