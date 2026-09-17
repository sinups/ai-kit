import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { skills } from './fixtures';
import { SkillPicker } from './SkillPicker';

function Controlled({ onChange }: { onChange: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>(['pdf']);
  return (
    <SkillPicker
      label="Skills"
      skills={skills}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('SkillPicker', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('adds skills found by fuzzy search and removes them with pills and Backspace', async () => {
    const onChange = jest.fn();
    const { container } = render(<Controlled onChange={onChange} />);

    expect(container.querySelectorAll('.mantine-Pill-root')).toHaveLength(1);
    const input = screen.getByRole('textbox', { name: 'Skills' });
    await userEvent.type(input, 'relnotes');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['pdf', 'release-notes']);

    await userEvent.click(container.querySelector('.mantine-Pill-remove')!);
    expect(onChange).toHaveBeenLastCalledWith(['release-notes']);

    await userEvent.clear(input);
    await userEvent.type(input, '{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('shows the empty message when nothing matches', async () => {
    render(<Controlled onChange={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Skills' }), 'qqqq');
    expect(await screen.findByText('No skills found')).toBeInTheDocument();
  });
});
