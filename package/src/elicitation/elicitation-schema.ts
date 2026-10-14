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

export type ElicitationFieldBase = {
  name: string;
  label: string;
  description?: string;
  required: boolean;
};

export type ElicitationField =
  | (ElicitationFieldBase & {
      kind: 'text';
      inputType: 'text' | 'email' | 'url' | 'date' | 'datetime-local';
      schema: ElicitationStringSchema;
    })
  | (ElicitationFieldBase & { kind: 'number'; schema: ElicitationNumberSchema })
  | (ElicitationFieldBase & { kind: 'boolean'; schema: ElicitationBooleanSchema })
  | (ElicitationFieldBase & {
      kind: 'select';
      options: ElicitationOption[];
      schema: ElicitationStringSchema;
    })
  | (ElicitationFieldBase & {
      kind: 'multiselect';
      options: ElicitationOption[];
      schema: ElicitationMultiSelectSchema;
    });

export type ElicitationDraftValue = string | number | boolean | string[];

export type ElicitationDraft = Record<string, ElicitationDraftValue>;

export interface ElicitationValidationLabels {
  required: string;
  minLength: (count: number) => string;
  maxLength: (count: number) => string;
  email: string;
  url: string;
  date: string;
  dateTime: string;
  number: string;
  integer: string;
  minimum: (value: number) => string;
  maximum: (value: number) => string;
  selectOption: string;
  minItems: (count: number) => string;
  maxItems: (count: number) => string;
}

export const DEFAULT_ELICITATION_VALIDATION_LABELS: ElicitationValidationLabels = {
  required: 'Required',
  minLength: (count) => `Must be at least ${count} characters`,
  maxLength: (count) => `Must be at most ${count} characters`,
  email: 'Enter a valid email',
  url: 'Enter a valid URL',
  date: 'Enter a valid date',
  dateTime: 'Enter a valid date and time',
  number: 'Enter a number',
  integer: 'Must be a whole number',
  minimum: (value) => `Must be at least ${value}`,
  maximum: (value) => `Must be at most ${value}`,
  selectOption: 'Select an option',
  minItems: (count) => `Select at least ${count}`,
  maxItems: (count) => `Select at most ${count}`,
};

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
    const base: ElicitationFieldBase = {
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
  if (value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return Array.isArray(value) && value.length === 0;
}

/** Returns an error message for the value, or `null` when it is valid */
export function validateElicitationField(
  field: ElicitationField,
  value: ElicitationDraftValue | undefined,
  labels: Partial<ElicitationValidationLabels> = {}
): string | null {
  const text = { ...DEFAULT_ELICITATION_VALIDATION_LABELS, ...labels };
  if (field.kind === 'boolean') {
    return null;
  }
  if (isEmpty(value)) {
    return field.required ? text.required : null;
  }

  switch (field.kind) {
    case 'text': {
      const input = String(value);
      const { minLength, maxLength } = field.schema;
      if (minLength !== undefined && input.length < minLength) {
        return text.minLength(minLength);
      }
      if (maxLength !== undefined && input.length > maxLength) {
        return text.maxLength(maxLength);
      }
      if (field.inputType === 'email' && !EMAIL_RE.test(input)) {
        return text.email;
      }
      if (field.inputType === 'url' && !isParsableUrl(input)) {
        return text.url;
      }
      if (field.inputType === 'date' && (!DATE_RE.test(input) || Number.isNaN(Date.parse(input)))) {
        return text.date;
      }
      if (field.inputType === 'datetime-local' && Number.isNaN(Date.parse(input))) {
        return text.dateTime;
      }
      return null;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(num)) {
        return text.number;
      }
      if (field.schema.type === 'integer' && !Number.isInteger(num)) {
        return text.integer;
      }
      if (field.schema.minimum !== undefined && num < field.schema.minimum) {
        return text.minimum(field.schema.minimum);
      }
      if (field.schema.maximum !== undefined && num > field.schema.maximum) {
        return text.maximum(field.schema.maximum);
      }
      return null;
    }
    case 'select':
      return field.options.some((option) => option.value === value) ? null : text.selectOption;
    case 'multiselect': {
      const count = Array.isArray(value) ? value.length : 0;
      if (field.schema.minItems !== undefined && count < field.schema.minItems) {
        return text.minItems(field.schema.minItems);
      }
      if (field.schema.maxItems !== undefined && count > field.schema.maxItems) {
        return text.maxItems(field.schema.maxItems);
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
  draft: ElicitationDraft,
  labels: Partial<ElicitationValidationLabels> = {}
): { content: ElicitationContent; errors: Record<string, string> } {
  const content: ElicitationContent = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = draft[field.name];
    const error = validateElicitationField(field, value, labels);
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
