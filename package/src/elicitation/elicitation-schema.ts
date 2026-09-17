export type ElicitationEnumOption = { const: string; title?: string };

export type ElicitationStringSchema = {
  type: 'string';
  title?: string;
  description?: string;
  default?: string;
  minLength?: number;
  maxLength?: number;
  format?: 'email' | 'uri' | 'date' | 'date-time';
  enum?: string[];
  enumNames?: string[];
  oneOf?: ElicitationEnumOption[];
};

export type ElicitationNumberSchema = {
  type: 'number' | 'integer';
  title?: string;
  description?: string;
  default?: number;
  minimum?: number;
  maximum?: number;
};

export type ElicitationBooleanSchema = {
  type: 'boolean';
  title?: string;
  description?: string;
  default?: boolean;
};

export type ElicitationMultiSelectSchema = {
  type: 'array';
  title?: string;
  description?: string;
  default?: string[];
  minItems?: number;
  maxItems?: number;
  items: {
    type?: 'string';
    enum?: string[];
    enumNames?: string[];
    anyOf?: ElicitationEnumOption[];
  };
};

export type ElicitationPrimitiveSchema =
  | ElicitationStringSchema
  | ElicitationNumberSchema
  | ElicitationBooleanSchema
  | ElicitationMultiSelectSchema;

/** `requestedSchema` of an MCP `elicitation/create` request */
export type ElicitationRequestedSchema = {
  type: 'object';
  properties: Record<string, ElicitationPrimitiveSchema>;
  required?: string[];
};

export type ElicitationValue = string | number | boolean | string[];

/** `content` sent back with the `accept` action */
export type ElicitationContent = Record<string, ElicitationValue>;

export type ElicitationOption = { value: string; label: string };

type FieldBase = {
  name: string;
  label: string;
  description?: string;
  required: boolean;
};

export type ElicitationField =
  | (FieldBase & {
      kind: 'text';
      inputType: 'text' | 'email' | 'url' | 'date' | 'datetime-local';
      schema: ElicitationStringSchema;
    })
  | (FieldBase & { kind: 'number'; schema: ElicitationNumberSchema })
  | (FieldBase & { kind: 'boolean'; schema: ElicitationBooleanSchema })
  | (FieldBase & { kind: 'select'; options: ElicitationOption[]; schema: ElicitationStringSchema })
  | (FieldBase & {
      kind: 'multiselect';
      options: ElicitationOption[];
      schema: ElicitationMultiSelectSchema;
    });

export type ElicitationDraftValue = string | number | boolean | string[];

export type ElicitationDraft = Record<string, ElicitationDraftValue>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toOptions(
  values: string[] | undefined,
  names: string[] | undefined,
  consts: ElicitationEnumOption[] | undefined
): ElicitationOption[] | null {
  if (consts && consts.length > 0) {
    return consts.map((item) => ({ value: item.const, label: item.title ?? item.const }));
  }
  if (values && values.length > 0) {
    return values.map((value, index) => ({ value, label: names?.[index] ?? value }));
  }
  return null;
}

const INPUT_TYPES = {
  email: 'email',
  uri: 'url',
  date: 'date',
  'date-time': 'datetime-local',
} as const;

/** Turns an elicitation schema into an ordered list of renderable fields */
export function getElicitationFields(schema: ElicitationRequestedSchema): ElicitationField[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).flatMap(([name, prop]): ElicitationField[] => {
    const base: FieldBase = {
      name,
      label: prop.title ?? name,
      description: prop.description,
      required: required.has(name),
    };
    switch (prop.type) {
      case 'string': {
        const options = toOptions(prop.enum, prop.enumNames, prop.oneOf);
        if (options) {
          return [{ ...base, kind: 'select', options, schema: prop }];
        }
        const inputType = prop.format ? INPUT_TYPES[prop.format] : 'text';
        return [{ ...base, kind: 'text', inputType: inputType ?? 'text', schema: prop }];
      }
      case 'number':
      case 'integer':
        return [{ ...base, kind: 'number', schema: prop }];
      case 'boolean':
        return [{ ...base, kind: 'boolean', schema: prop }];
      case 'array': {
        const options = toOptions(prop.items?.enum, prop.items?.enumNames, prop.items?.anyOf);
        return options ? [{ ...base, kind: 'multiselect', options, schema: prop }] : [];
      }
      default:
        return [];
    }
  });
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Initial form values taken from schema defaults */
export function getElicitationDraft(fields: ElicitationField[]): ElicitationDraft {
  const draft: ElicitationDraft = {};
  for (const field of fields) {
    switch (field.kind) {
      case 'text':
        draft[field.name] =
          field.inputType === 'datetime-local' && field.schema.default
            ? toDateTimeLocal(field.schema.default)
            : (field.schema.default ?? '');
        break;
      case 'number':
        draft[field.name] = field.schema.default ?? '';
        break;
      case 'boolean':
        draft[field.name] = field.schema.default ?? false;
        break;
      case 'select':
        draft[field.name] = field.schema.default ?? '';
        break;
      case 'multiselect':
        draft[field.name] = field.schema.default ?? [];
        break;
    }
  }
  return draft;
}

function isEmpty(value: ElicitationDraftValue | undefined): boolean {
  if (value === undefined || value === '') {
    return true;
  }
  return Array.isArray(value) && value.length === 0;
}

/** Returns an error message for the value, or `null` when it is valid */
export function validateElicitationField(
  field: ElicitationField,
  value: ElicitationDraftValue | undefined
): string | null {
  if (field.kind === 'boolean') {
    return null;
  }
  if (isEmpty(value)) {
    return field.required ? 'Required' : null;
  }

  switch (field.kind) {
    case 'text': {
      const text = String(value);
      const { minLength, maxLength } = field.schema;
      if (minLength !== undefined && text.length < minLength) {
        return `Must be at least ${minLength} characters`;
      }
      if (maxLength !== undefined && text.length > maxLength) {
        return `Must be at most ${maxLength} characters`;
      }
      if (field.inputType === 'email' && !EMAIL_RE.test(text)) {
        return 'Enter a valid email';
      }
      if (field.inputType === 'url' && !isParsableUrl(text)) {
        return 'Enter a valid URL';
      }
      if (field.inputType === 'date' && (!DATE_RE.test(text) || Number.isNaN(Date.parse(text)))) {
        return 'Enter a valid date';
      }
      if (field.inputType === 'datetime-local' && Number.isNaN(Date.parse(text))) {
        return 'Enter a valid date and time';
      }
      return null;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(num)) {
        return 'Enter a number';
      }
      if (field.schema.type === 'integer' && !Number.isInteger(num)) {
        return 'Must be a whole number';
      }
      if (field.schema.minimum !== undefined && num < field.schema.minimum) {
        return `Must be at least ${field.schema.minimum}`;
      }
      if (field.schema.maximum !== undefined && num > field.schema.maximum) {
        return `Must be at most ${field.schema.maximum}`;
      }
      return null;
    }
    case 'select':
      return field.options.some((option) => option.value === value) ? null : 'Select an option';
    case 'multiselect': {
      const count = Array.isArray(value) ? value.length : 0;
      if (field.schema.minItems !== undefined && count < field.schema.minItems) {
        return `Select at least ${field.schema.minItems}`;
      }
      if (field.schema.maxItems !== undefined && count > field.schema.maxItems) {
        return `Select at most ${field.schema.maxItems}`;
      }
      return null;
    }
  }
}

function isParsableUrl(text: string): boolean {
  try {
    return Boolean(new URL(text));
  } catch {
    return false;
  }
}

/** Validates every field and builds the `accept` content, skipping empty optional fields */
export function buildElicitationContent(
  fields: ElicitationField[],
  draft: ElicitationDraft
): { content: ElicitationContent; errors: Record<string, string> } {
  const content: ElicitationContent = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = draft[field.name];
    const error = validateElicitationField(field, value);
    if (error) {
      errors[field.name] = error;
      continue;
    }
    if (field.kind === 'boolean') {
      content[field.name] = Boolean(value);
      continue;
    }
    if (isEmpty(value)) {
      continue;
    }
    if (field.kind === 'number') {
      content[field.name] = Number(value);
    } else if (field.kind === 'text' && field.inputType === 'datetime-local') {
      content[field.name] = new Date(String(value)).toISOString();
    } else {
      content[field.name] = value as ElicitationValue;
    }
  }

  return { content, errors };
}

/** Host of an http(s) link, `null` for anything else so that other schemes are never opened */
export function getElicitationHost(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.host : null;
  } catch {
    return null;
  }
}
