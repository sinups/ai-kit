import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../../primitives/_testing/element-width';
import { ModelSettingsPanel } from './ModelSettingsPanel';

describe('model-settings/ModelSettingsPanel', () => {
  it('shows sections for the given props and switches between them', async () => {
    const restore = setElementWidth(900);
    const onActiveSectionChange = jest.fn();
    render(
      <ModelSettingsPanel
        models={[{ id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B' }]}
        model="qwen-2.5-coder-32b"
        effort={{ value: 'high', onChange: () => {} }}
        status={{ version: '2.1.0' }}
        onActiveSectionChange={onActiveSectionChange}
      />
    );

    const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
    expect(nav).toHaveTextContent('Model');
    expect(nav).toHaveTextContent('Status');
    expect(nav).not.toHaveTextContent('Usage');
    expect(screen.getByText('Default model')).toBeInTheDocument();
    expect(screen.getByText('Thinks longer on harder problems')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Status' }));
    expect(onActiveSectionChange).toHaveBeenCalledWith('status');
    expect(screen.getByText('2.1.0')).toBeInTheDocument();
    restore();
  });

  it('names the output style group after its section heading', async () => {
    const restore = setElementWidth(900);
    render(
      <ModelSettingsPanel
        defaultActiveSection="output-style"
        outputStyle={{
          styles: [{ id: 'concise', name: 'Concise', description: 'Short answers' }],
          value: 'concise',
          onChange: () => {},
        }}
      />
    );

    expect(await screen.findByRole('radiogroup', { name: 'Output style' })).toBeInTheDocument();
    restore();
  });
});
