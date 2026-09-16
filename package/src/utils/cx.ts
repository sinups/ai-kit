export type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny class name joiner, replaces clsx/tailwind-merge from the reference implementation */
export function cx(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input && input !== 0) {
      continue;
    }
    if (Array.isArray(input)) {
      const nested = cx(...input);
      if (nested) {
        out.push(nested);
      }
    } else {
      out.push(String(input));
    }
  }
  return out.join(' ');
}
