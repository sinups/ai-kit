import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { AgentDraft } from '../types';
import { AgentIdentityFields } from './AgentFields';

const draft: AgentDraft = {
  name: 'code-reviewer',
  displayName: 'Code reviewer',
  description: '',
  systemPrompt: '',
  model: 'inherit',
  tools: 'all',
  disallowedTools: [],
  skills: [],
};

const props = {
  draft,
  errors: {},
  onChange: () => {},
  autoName: false,
  onNameEdited: () => {},
};

describe('agents/AgentFields', () => {
  it('falls back to the English labels when none are given', () => {
    render(<AgentIdentityFields {...props} />);
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
  });

  it('takes the field labels from labels', () => {
    render(<AgentIdentityFields {...props} labels={{ displayName: 'Anzeigename' }} />);
    expect(screen.getByLabelText('Anzeigename')).toBeInTheDocument();
  });
});
