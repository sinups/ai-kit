export type SettingsValidationSeverity = 'error' | 'warning';

export interface SettingsValidationError {
  /** Stable id, derived from file, path and message when omitted */
  id?: string;
  /** Settings file the error belongs to, for example `.agent/settings.json` */
  file: string;
  /** Dotted path of the invalid field, for example `permissions.allow[2]` */
  path?: string;
  /** What is wrong */
  message: string;
  /** How to fix it, for example `Did you mean "allow"?` */
  suggestion?: string;
  /** Documentation page about the field */
  docsUrl?: string;
  /** `error` makes the file invalid, `warning` is informational, `error` by default */
  severity?: SettingsValidationSeverity;
}

export interface ValidationErrorGroup {
  file: string;
  errors: SettingsValidationError[];
  errorCount: number;
  warningCount: number;
}

function contentKey(error: SettingsValidationError): string {
  return JSON.stringify([error.file, error.path ?? '', error.message]);
}

export function getValidationErrorKey(error: SettingsValidationError): string {
  return error.id ?? contentKey(error);
}

export function dedupeValidationErrors(
  errors: SettingsValidationError[]
): SettingsValidationError[] {
  const seen = new Set<string>();
  return errors.filter((error) => {
    const key = contentKey(error);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function groupValidationErrors(errors: SettingsValidationError[]): ValidationErrorGroup[] {
  const groups = new Map<string, ValidationErrorGroup>();
  for (const error of dedupeValidationErrors(errors)) {
    let group = groups.get(error.file);
    if (!group) {
      group = { file: error.file, errors: [], errorCount: 0, warningCount: 0 };
      groups.set(error.file, group);
    }
    group.errors.push(error);
    if (error.severity === 'warning') {
      group.warningCount += 1;
    } else {
      group.errorCount += 1;
    }
  }
  return [...groups.values()];
}

export function getValidationSeverity(
  errors: SettingsValidationError[]
): SettingsValidationSeverity {
  return errors.some((error) => error.severity !== 'warning') ? 'error' : 'warning';
}

export function fillValidationTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
