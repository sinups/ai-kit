import type { ModelOption } from '../types';

export function getAgentModelLabel(
  model: string | undefined,
  models: readonly ModelOption[],
  inheritLabel: string
): string {
  if (!model || model === 'inherit') {
    return inheritLabel;
  }
  const option = models.find((item) => item.id === model);
  if (!option) {
    return model;
  }
  return option.version ? `${option.name} ${option.version}` : option.name;
}

export function formatAgentDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
