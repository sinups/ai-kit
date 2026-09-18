import { getSchemaTypeLabel, type JsonSchema } from './schema';

export type SchemaValueKind = 'object' | 'array' | 'leaf';

export type SchemaValueRow = {
  /** Unique row id: property names joined with `.`, array items as `[n]` */
  path: string;
  /** Path of the parent row, `null` for top-level rows */
  parentPath: string | null;
  /** Property name, or `[n]` for array items */
  name: string;
  /** Readable type from the schema, `undefined` when the schema does not describe the field */
  type?: string;
  required: boolean;
  description?: string;
  /** Raw value, `undefined` when the field is missing from the values */
  value: unknown;
  /** Whether the field is present in the values */
  present: boolean;
  /** Whether the schema describes the field; `false` marks an extra key */
  known: boolean;
  /** Shape of the value: `object` and `array` rows summarize their size */
  kind: SchemaValueKind;
  /** Number of entries of an object or array value */
  size: number;
  /** Nesting level, `0` for top-level rows */
  depth: number;
  /** Whether rows with this row as `parentPath` follow it */
  hasChildren: boolean;
};

const SECRET_KEY =
  /(^|[._-])(secret|secrets|token|tokens|password|passwd|pwd|passphrase|api[-_]?key|apikey|access[-_]?key|private[-_]?key|credential|credentials|authorization|auth[-_]?token|bearer|cookie|session[-_]?id|signature)([._-]|$)/i;

/** Whether a field name reads like a credential and its value should be masked */
export function isLikelySecretKey(name: string): boolean {
  return SECRET_KEY.test(name.replace(/([a-z0-9])([A-Z])/g, '$1_$2'));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function variantsOf(schema: JsonSchema): JsonSchema[] | undefined {
  return schema.oneOf ?? schema.anyOf;
}

/** Picks the `oneOf`/`anyOf` variant that describes the value, so a union renders as one shape */
export function resolveValueSchema(
  schema: JsonSchema | undefined,
  value: unknown
): JsonSchema | undefined {
  if (!schema) {
    return undefined;
  }
  const variants = variantsOf(schema);
  if (!variants || variants.length === 0 || schema.properties) {
    return schema;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    const matched = variants.find((variant) => {
      const properties = Object.keys(variant.properties ?? {});
      const required = variant.required ?? [];
      return (
        required.every((name) => keys.includes(name)) &&
        properties.length > 0 &&
        keys.some((key) => properties.includes(key))
      );
    });
    if (matched) {
      return matched;
    }
  }
  if (Array.isArray(value)) {
    const matched = variants.find((variant) => variant.items);
    if (matched) {
      return matched;
    }
  }
  return schema;
}

function typeLabelOf(schema: JsonSchema | undefined): string | undefined {
  return schema ? getSchemaTypeLabel(schema) : undefined;
}

function kindOf(value: unknown): SchemaValueKind {
  if (Array.isArray(value)) {
    return 'array';
  }
  return isPlainObject(value) ? 'object' : 'leaf';
}

function sizeOf(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  return isPlainObject(value) ? Object.keys(value).length : 0;
}

/**
 * Flattens `values` against `schema` into rows: every described field in schema order, then keys
 * the schema does not mention. Missing optional fields keep their row with `present: false`.
 */
export function flattenSchemaValues(schema: JsonSchema, values: unknown): SchemaValueRow[] {
  const rows: SchemaValueRow[] = [];
  const ancestors = new Set<unknown>();

  const pushRow = (
    row: Omit<SchemaValueRow, 'hasChildren'>,
    childSchema: JsonSchema | undefined
  ) => {
    const index = rows.length;
    rows.push({ ...row, hasChildren: false });
    if (row.kind !== 'leaf') {
      pushChildren(childSchema, row.value, row.path, row.path, row.depth + 1);
    }
    rows[index].hasChildren = rows.length > index + 1;
  };

  const pushChildren = (
    parentSchema: JsonSchema | undefined,
    value: unknown,
    parentPath: string | null,
    prefix: string,
    depth: number
  ) => {
    if (ancestors.has(value)) {
      return;
    }
    ancestors.add(value);
    const resolved = resolveValueSchema(parentSchema, value);

    if (Array.isArray(value)) {
      const itemSchema = resolved?.items;
      value.forEach((item, index) => {
        const name = `[${index}]`;
        const schemaOfItem = resolveValueSchema(itemSchema, item);
        pushRow(
          {
            path: `${prefix}${name}`,
            parentPath,
            name,
            type: typeLabelOf(schemaOfItem),
            required: false,
            description: schemaOfItem?.description,
            value: item,
            present: true,
            known: !!itemSchema,
            kind: kindOf(item),
            size: sizeOf(item),
            depth,
          },
          schemaOfItem
        );
      });
      ancestors.delete(value);
      return;
    }

    const properties = resolved?.properties ?? {};
    const required = new Set(resolved?.required ?? []);
    const entries = isPlainObject(value) ? value : undefined;
    const names = Object.keys(properties);
    for (const key of Object.keys(entries ?? {})) {
      if (!(key in properties)) {
        names.push(key);
      }
    }

    for (const name of names) {
      const property = properties[name];
      const present = entries ? name in entries : false;
      const item = entries?.[name];
      const schemaOfItem = resolveValueSchema(property, item);
      pushRow(
        {
          path: prefix ? `${prefix}.${name}` : name,
          parentPath,
          name,
          type: typeLabelOf(schemaOfItem),
          required: required.has(name),
          description: schemaOfItem?.description ?? schemaOfItem?.title,
          value: item,
          present,
          known: !!property,
          kind: present ? kindOf(item) : 'leaf',
          size: sizeOf(item),
          depth,
        },
        schemaOfItem
      );
    }

    ancestors.delete(value);
  };

  pushChildren(schema, values, null, '', 0);
  return rows;
}

/** One-line form of a leaf value: strings as they are, everything else as JSON */
export function formatSchemaValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined) {
    return '';
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
