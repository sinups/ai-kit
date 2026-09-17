import React from 'react';
import { TextInput } from '@mantine/core';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import type { WizardStep } from './wizard-state';
import { Wizard } from './Wizard';
import { WizardModal } from './WizardModal';

type Values = { name: string; remote: boolean; url: string };

const INITIAL: Values = { name: '', remote: false, url: '' };

const STEPS: WizardStep<Values>[] = [
  {
    id: 'name',
    label: 'Name',
    validate: (values) => (values.name ? null : { name: 'Name is required' }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="Server name"
        value={values.name}
        error={errors.name}
        onChange={(event) => setValue('name', event.currentTarget.value)}
      />
    ),
  },
  { id: 'url', label: 'URL', when: (values) => values.remote, render: () => <div>URL step</div> },
  { id: 'confirm', label: 'Confirm', render: ({ values }) => <div>Confirm {values.name}</div> },
];

describe('Wizard', () => {
  it('blocks moving forward until the step is valid', async () => {
    render(<Wizard steps={STEPS} initialValues={INITIAL} onComplete={jest.fn()} />);

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Server name'), 'files');
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Confirm files')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
  });

  it('shows conditional steps, goes back and completes with the values', async () => {
    const onComplete = jest.fn();
    render(
      <Wizard
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs', remote: true }}
        onComplete={onComplete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('URL step')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Server name')).toHaveValue('fs');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledWith({ name: 'fs', remote: true, url: '' });
  });

  it('waits for async validation', async () => {
    let resolve: (value: null) => void = () => {};
    const steps: WizardStep<Values>[] = [
      { ...STEPS[0], validate: () => new Promise((done) => (resolve = done)) },
      STEPS[2],
    ];
    render(<Wizard steps={steps} initialValues={INITIAL} onComplete={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('data-loading', 'true');
    resolve(null);
    expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('renders a review step and shows a rejected completion in an alert', async () => {
    const onComplete = jest.fn().mockRejectedValue(new Error('Server is unreachable'));
    render(
      <Wizard
        steps={[STEPS[2]]}
        initialValues={{ ...INITIAL, name: 'db' }}
        review={(values) => <div>Review {values.name}</div>}
        labels={{ finish: 'Create' }}
        onComplete={onComplete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Review db')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Server is unreachable')).toBeInTheDocument();
  });

  it('marks passed steps as completed in linear mode', async () => {
    render(
      <Wizard
        orientation="horizontal"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    const nameStep = screen.getByRole('button', { name: /Name/ });
    expect(nameStep).toHaveAttribute('data-completed', 'true');
    expect(nameStep).not.toHaveAttribute('data-unverified');
  });

  it('uses the stepper to return to visited steps only', async () => {
    render(
      <Wizard
        orientation="horizontal"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
      />
    );

    const confirmStep = screen.getByRole('button', { name: /Confirm/ });
    await userEvent.click(confirmStep);
    expect(screen.getByLabelText('Server name')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(screen.getByLabelText('Server name')).toBeInTheDocument();
  });

  it('moves focus into the step content only after a step change', async () => {
    render(
      <Wizard steps={STEPS} initialValues={{ ...INITIAL, name: 'fs' }} onComplete={jest.fn()} />
    );
    expect(document.body).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Confirm', { selector: 'p' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Server name')).toHaveFocus();
  });

  it('skips an optional step without validating it', async () => {
    const validate = jest.fn(() => ({ token: 'Invalid token' }));
    const onComplete = jest.fn();
    const steps: WizardStep<Values>[] = [
      {
        id: 'token',
        label: 'Token',
        optional: true,
        validate,
        render: () => <div>Token step</div>,
      },
      STEPS[2],
    ];
    render(
      <Wizard
        orientation="horizontal"
        steps={steps}
        initialValues={{ ...INITIAL, name: 'fs' }}
        labels={{ skip: 'Not now' }}
        onComplete={onComplete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(validate).not.toHaveBeenCalled();
    expect(screen.getByText('Confirm fs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid token')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Token/ }));
    expect(screen.getByText('Token step')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Confirm/ }));
    expect(screen.getByText('Confirm fs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('jumps to any step and validates every step on finish when non-linear', async () => {
    const onComplete = jest.fn();
    render(
      <Wizard
        nonLinear
        orientation="horizontal"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={onComplete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Confirm/ }));
    expect(screen.queryByLabelText('Server name')).not.toBeInTheDocument();
    const nameStep = screen.getByRole('button', { name: /Name/ });
    expect(nameStep).toHaveAttribute('data-unverified', 'true');
    expect(nameStep).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Server name'), 'fs');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: /Name/ })).not.toHaveAttribute('data-unverified');
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledWith({ ...INITIAL, name: 'fs' });
  });

  it('offers a step menu in the compact header when non-linear', async () => {
    render(
      <Wizard
        nonLinear
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go to step' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '2. Confirm' }));
    expect(screen.getByText('Confirm fs')).toBeInTheDocument();
  });

  it('keeps the linear stepper and hides the step menu by default', () => {
    render(<Wizard steps={STEPS} initialValues={INITIAL} onComplete={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Go to step' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument();
  });

  it('calls onCancel and onClose when the modal wizard is cancelled', async () => {
    const onCancel = jest.fn();
    const onClose = jest.fn();
    render(
      <WizardModal
        opened
        title="Add server"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={jest.fn()}
        onCancel={onCancel}
        onClose={onClose}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while the modal wizard is completing', async () => {
    let finish: () => void = () => {};
    const onComplete = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const onCancel = jest.fn();
    const onClose = jest.fn();
    render(
      <WizardModal
        opened
        title="Add server"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'files' }}
        onComplete={onComplete}
        onCancel={onCancel}
        onClose={onClose}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled());
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('labels the step content by the step heading', () => {
    render(
      <Wizard
        orientation="horizontal"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={jest.fn()}
      />
    );
    expect(screen.getByRole('group', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Name' })).not.toHaveAttribute('aria-label');
    expect(screen.getByLabelText('Server name')).toHaveAttribute('id');
  });
  it('blocks navigation, cancel and fields while busy', async () => {
    const onCancel = jest.fn();
    const { rerender } = render(
      <Wizard
        busy
        orientation="horizontal"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Server name' })).toBeDisabled();

    rerender(
      <Wizard
        orientation="horizontal"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Confirm fs')).toBeInTheDocument();

    rerender(
      <Wizard
        busy
        orientation="horizontal"
        steps={STEPS}
        initialValues={{ ...INITIAL, name: 'fs' }}
        onComplete={jest.fn()}
        onCancel={onCancel}
      />
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(screen.getByText('Confirm fs')).toBeInTheDocument();
  });

  it('keeps the modal close button working while busy', async () => {
    const onClose = jest.fn();
    render(
      <WizardModal
        busy
        opened
        title="Add server"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={jest.fn()}
        onClose={onClose}
      />
    );

    const dialog = await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await userEvent.click(dialog.querySelector('.mantine-Modal-close') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('scrolls only the step content inside the modal and keeps inline wizards unchanged', async () => {
    const { unmount } = render(
      <Wizard
        orientation="horizontal"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={jest.fn()}
      />
    );
    expect(document.querySelector('[data-scroll-content]')).toBeNull();
    unmount();

    render(
      <WizardModal
        opened
        orientation="horizontal"
        title="Add server"
        steps={STEPS}
        initialValues={INITIAL}
        onComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );
    const dialog = await screen.findByRole('dialog');
    const root = dialog.querySelector('[data-scroll-content]') as HTMLElement;
    const scroller = root.querySelector('[data-step-scroll]') as HTMLElement;
    expect(scroller).toContainElement(screen.getByLabelText('Server name'));
    expect(scroller).not.toContainElement(screen.getByRole('button', { name: 'Next' }));
    expect(scroller).not.toContainElement(screen.getByRole('button', { name: 'Cancel' }));
    expect(scroller).not.toContainElement(
      root.querySelector('.mantine-Stepper-steps') as HTMLElement
    );
  });
  it('keeps the step and its buttons mounted when the layout changes', async () => {
    function Switcher() {
      const [vertical, setVertical] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setVertical(true)}>
            Switch layout
          </button>
          <Wizard
            orientation={vertical ? 'vertical' : 'horizontal'}
            steps={STEPS}
            initialValues={INITIAL}
            onComplete={jest.fn()}
          />
        </>
      );
    }
    const { container } = render(<Switcher />);
    const next = screen.getByRole('button', { name: 'Next' });
    const field = screen.getByLabelText('Server name');

    await userEvent.click(screen.getByRole('button', { name: 'Switch layout' }));
    expect(container.querySelector('[data-layout="vertical"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBe(next);
    expect(screen.getByLabelText('Server name')).toBe(field);
  });
});
