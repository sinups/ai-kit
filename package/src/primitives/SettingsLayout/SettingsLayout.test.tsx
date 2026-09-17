import React from 'react';
import { Switch } from '@mantine/core';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../_testing/element-width';
import type { SettingsNavItem } from './settings-nav';
import { SettingRow } from './SettingRow';
import { SettingsLayout } from './SettingsLayout';
import { SettingsModal } from './SettingsModal';
import { SettingsSection } from './SettingsSection';

const SECTIONS: SettingsNavItem[] = [
  { id: 'general', label: 'General' },
  { id: 'models', label: 'Models', description: 'Default model', group: 'Agent' },
  { id: 'mcp', label: 'MCP servers', description: 'Connected tools', group: 'Integrations' },
  { id: 'billing', label: 'Billing', disabled: true },
];

describe('primitives/SettingsLayout fill mode', () => {
  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(1000);
    });
    afterEach(() => restore());

    it('renders grouped navigation and reports the picked section', async () => {
      const onActiveIdChange = jest.fn();
      render(
        <SettingsLayout sections={SECTIONS} activeId="general" onActiveIdChange={onActiveIdChange}>
          <div>General content</div>
        </SettingsLayout>
      );

      const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
      expect(nav).toHaveTextContent('Agent');
      expect(nav).toHaveTextContent('Integrations');
      expect(screen.getByRole('button', { name: 'General' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(screen.getByText('General content')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /MCP servers/ }));
      expect(onActiveIdChange).toHaveBeenCalledWith('mcp');
      const billing = screen.getByRole('button', { name: 'Billing' });
      expect(billing).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(billing);
      expect(onActiveIdChange).not.toHaveBeenCalledWith('billing');
    });

    it('filters the navigation by label and description', async () => {
      render(
        <SettingsLayout
          sections={SECTIONS}
          activeId="general"
          onActiveIdChange={() => {}}
          withSearch
        >
          content
        </SettingsLayout>
      );

      await userEvent.type(
        await screen.findByRole('textbox', { name: 'Search settings' }),
        'tools'
      );
      expect(screen.getByRole('button', { name: /MCP servers/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'General' })).not.toBeInTheDocument();

      await userEvent.type(screen.getByRole('textbox', { name: 'Search settings' }), ' nothing');
      expect(screen.getByText('No matching settings')).toBeInTheDocument();
    });
  });

  it('keeps the section content mounted when the first measure switches to wide', async () => {
    const restore = setElementWidth(1000);
    const onMount = jest.fn();
    function Section() {
      React.useEffect(onMount, []);
      return <div>General content</div>;
    }
    try {
      render(
        <SettingsLayout sections={SECTIONS} activeId="general" onActiveIdChange={() => {}}>
          <Section />
        </SettingsLayout>
      );
      await screen.findByRole('navigation', { name: 'Settings sections' });
      expect(screen.getByText('General content')).toBeInTheDocument();
      expect(onMount).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it('shows a section picker above the content when narrow', async () => {
    Element.prototype.scrollIntoView = jest.fn();
    const onActiveIdChange = jest.fn();
    render(
      <SettingsLayout sections={SECTIONS} activeId="general" onActiveIdChange={onActiveIdChange}>
        <div>General content</div>
      </SettingsLayout>
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    const picker = screen.getByRole('combobox', { name: 'Settings sections' });
    expect(picker).toHaveValue('General');
    expect(screen.getByText('General content')).toBeInTheDocument();

    await userEvent.click(picker);
    await userEvent.click(await screen.findByRole('option', { name: /Models/ }));
    expect(onActiveIdChange).toHaveBeenCalledWith('models');
  });
});

describe('primitives/SettingsSection', () => {
  it('renders the heading, actions and rows with dividers between them', () => {
    const { container } = render(
      <SettingsSection
        title="Privacy"
        description="Who sees what"
        actions={<button type="button">Reset</button>}
      >
        <SettingRow label="Share usage" control={<Switch aria-label="Share usage" />} />
        <SettingRow label="Telemetry" control={<Switch aria-label="Telemetry" />} />
      </SettingsSection>
    );

    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByText('Who sees what')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(container.querySelectorAll('.mantine-Divider-root')).toHaveLength(1);
  });

  it('marks a danger section', () => {
    render(<SettingsSection title="Danger zone" danger />);
    expect(screen.getByRole('heading', { name: 'Danger zone' }).closest('section')).toHaveAttribute(
      'data-danger'
    );
  });
});

describe('primitives/SettingRow', () => {
  it('links the label to the control and shows the error', () => {
    render(
      <SettingRow
        label="API key"
        description="Used for requests"
        htmlFor="api-key"
        error="Key is invalid"
        control={<input id="api-key" />}
      />
    );

    expect(screen.getByLabelText('API key')).toHaveAttribute('id', 'api-key');
    expect(screen.getByRole('alert')).toHaveTextContent('Key is invalid');
  });

  it('exposes the requested layout', () => {
    render(<SettingRow label="Theme" layout="stacked" control={<span>control</span>} />);
    expect(screen.getByText('control').closest('[data-layout]')).toHaveAttribute(
      'data-layout',
      'stacked'
    );
  });
});

describe('primitives/SettingsLayout', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = setElementWidth(1000);
  });
  afterEach(() => restore());

  it('renders the content without a scroll area when fillContent is set', async () => {
    const { container } = render(
      <SettingsLayout sections={SECTIONS} activeId="mcp" onActiveIdChange={() => {}} fillContent>
        <div>Servers</div>
      </SettingsLayout>
    );

    await screen.findByRole('navigation', { name: 'Settings sections' });
    expect(screen.getByText('Servers').parentElement).toHaveAttribute('data-fill');
    expect(screen.getByText('Servers').closest('.mantine-ScrollArea-root')).toBeNull();
    expect(container.querySelectorAll('[data-fill]')).toHaveLength(1);
  });

  it('lets a section override the layout setting', async () => {
    const sections: SettingsNavItem[] = [
      { id: 'general', label: 'General', fill: false },
      { id: 'mcp', label: 'MCP servers', fill: true },
    ];
    const { rerender } = render(
      <SettingsLayout sections={sections} activeId="mcp" onActiveIdChange={() => {}}>
        <div>Servers</div>
      </SettingsLayout>
    );
    await screen.findByRole('navigation', { name: 'Settings sections' });
    expect(screen.getByText('Servers').parentElement).toHaveAttribute('data-fill');

    rerender(
      <SettingsLayout
        sections={sections}
        activeId="general"
        onActiveIdChange={() => {}}
        fillContent
      >
        <div>General content</div>
      </SettingsLayout>
    );
    expect(screen.getByText('General content').closest('.mantine-ScrollArea-root')).not.toBeNull();
  });
});

describe('primitives/SettingsModal', () => {
  it('renders the layout inside a titled modal and closes', async () => {
    const onClose = jest.fn();
    render(
      <SettingsModal
        opened
        onClose={onClose}
        title="Workspace settings"
        sections={SECTIONS}
        activeId="general"
        onActiveIdChange={() => {}}
      >
        <div>General content</div>
      </SettingsModal>
    );

    const dialog = await screen.findByRole('dialog', { name: 'Workspace settings' });
    expect(dialog).toHaveTextContent('General content');
    await userEvent.click(dialog.querySelector('.mantine-Modal-close') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
