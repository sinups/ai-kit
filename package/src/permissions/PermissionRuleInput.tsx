import React, { memo, useMemo, useState } from 'react';
import { Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import {
  DEFAULT_PERMISSION_TOOLS,
  describeRule,
  getToolSuggestions,
  validateRule,
} from './permission-rule';
import type { PermissionBehavior } from './types';
import classes from './PermissionRuleInput.module.css';
import { FIELD_ORDER_DESCRIPTION_BELOW } from '../utils/field-order';

export interface PermissionRuleInputProps {
  /** Rule text, for example `Bash(npm run test:*)` */
  value: string;
  /** Called with the new rule text */
  onChange: (value: string) => void;
  /** Tool names suggested while typing the tool part and used to warn about unknown tools */
  knownTools?: string[];
  /** Behavior used in the plain-words description under the field, `allow` by default */
  behavior?: PermissionBehavior;
  /** Field label, `Rule` by default */
  label?: React.ReactNode;
  /** Placeholder, `Bash(npm run test:*)` by default */
  placeholder?: string;
  /** Error from the host, shown instead of the validation error */
  error?: React.ReactNode;
  /** Shows the validation error before the field is blurred */
  forceValidation?: boolean;
  /** Disables the field */
  disabled?: boolean;
  /** Called when the field loses focus */
  onBlur?: () => void;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Permission rule field with tool name completion, live validation and a plain-words description of the rule */
export const PermissionRuleInput = memo(function PermissionRuleInput({
  value,
  onChange,
  knownTools = DEFAULT_PERMISSION_TOOLS,
  behavior = 'allow',
  label = 'Rule',
  placeholder = 'Bash(npm run test:*)',
  error,
  forceValidation = false,
  disabled = false,
  onBlur,
  className,
  style,
}: PermissionRuleInputProps) {
  const [touched, setTouched] = useState(false);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const validation = useMemo(() => validateRule(value, knownTools), [value, knownTools]);
  const suggestions = useMemo(() => getToolSuggestions(value, knownTools), [value, knownTools]);
  const showValidation = forceValidation || touched;

  const description = validation.rule ? (
    <>
      <Text component="span" size="xs" c="dimmed" display="block">
        {describeRule({ behavior, ...validation.rule })}
      </Text>
      {validation.warning && (
        <Group component="span" gap={4} wrap="nowrap" className={classes.warning}>
          <IconAlertTriangle size={12} className={classes.warningIcon} />
          <Text component="span" size="xs" inherit>
            {validation.warning}
          </Text>
        </Group>
      )}
    </>
  ) : null;

  return (
    <Combobox
      store={combobox}
      disabled={disabled}
      onOptionSubmit={(toolName) => {
        onChange(toolName);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          className={className}
          style={style}
          classNames={{ input: classes.input }}
          autoComplete="off"
          spellCheck={false}
          inputWrapperOrder={FIELD_ORDER_DESCRIPTION_BELOW}
          description={description}
          error={error ?? (showValidation ? validation.error : null)}
          onChange={(event) => {
            onChange(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setTouched(true);
            onBlur?.();
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown hidden={suggestions.length === 0}>
        <Combobox.Options mah={220} className={classes.options}>
          {suggestions.map((toolName) => (
            <Combobox.Option value={toolName} key={toolName}>
              <Text size="sm" ff="monospace">
                {toolName}
              </Text>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
});

PermissionRuleInput.displayName = 'PermissionRuleInput';
