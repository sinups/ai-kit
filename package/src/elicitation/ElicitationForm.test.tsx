import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ElicitationRequestedSchema } from './elicitation-schema';
import { ElicitationForm } from './ElicitationForm';

const SCHEMA: ElicitationRequestedSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    email: { type: 'string', title: 'Email', format: 'email' },
    notify: { type: 'boolean', title: 'Notify me' },
  },
  required: ['name'],
};

describe('ElicitationForm', () => {
  it('shows validation errors and does not accept an invalid form', async () => {
    const onAccept = jest.fn();
    render(<ElicitationForm message="Who are you?" requestedSchema={SCHEMA} onAccept={onAccept} />);

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('validates a field on blur', async () => {
    render(<ElicitationForm message="Contact" requestedSchema={SCHEMA} />);

    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.tab();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('validates a picked radio or checkbox against the new value', async () => {
    render(
      <ElicitationForm
        message="Pick"
        requestedSchema={{
          type: 'object',
          properties: {
            size: { type: 'string', title: 'Size', enum: ['small', 'large'] },
            tags: {
              type: 'array',
              title: 'Tags',
              items: { type: 'string', enum: ['a', 'b'] },
              minItems: 1,
            },
          },
          required: ['size', 'tags'],
        }}
      />
    );

    await userEvent.click(screen.getByRole('radio', { name: 'small' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'a' }));
    expect(screen.queryByText('Required')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'a' }));
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('accepts collected values, skipping empty optional fields, and locks the form', async () => {
    const onAccept = jest.fn();
    render(
      <ElicitationForm
        message="Who are you?"
        serverName="files"
        requestedSchema={SCHEMA}
        onAccept={onAccept}
      />
    );

    expect(screen.getByText('files')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Name/), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onAccept).toHaveBeenCalledWith({ name: 'Ada', notify: false });
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(screen.getByLabelText(/Name/)).toBeDisabled();
  });

  it('declines and cancels once', async () => {
    const onDecline = jest.fn();
    const onCancel = jest.fn();
    render(
      <ElicitationForm
        message="Continue?"
        requestedSchema={SCHEMA}
        onDecline={onDecline}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('renders url mode with the link host and accepts on open', async () => {
    const onAccept = jest.fn();
    render(
      <ElicitationForm
        mode="url"
        message="Sign in to continue"
        url="https://auth.example.com/login"
        onAccept={onAccept}
      />
    );

    expect(screen.getByText('auth.example.com')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open link' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await userEvent.click(link);
    expect(onAccept).toHaveBeenCalledWith({});
  });

  it('hides the open button for non-http links', () => {
    render(<ElicitationForm mode="url" message="Open" url="ftp://files.example.com/x" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
