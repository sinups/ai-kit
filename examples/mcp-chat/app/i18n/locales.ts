import { en, type Messages } from './en';
import { ru } from './ru';

export type Locale = 'en' | 'ru';

const DEFAULT_LOCALE: Locale = 'en';

export const MESSAGES: Record<Locale, Messages> = { en, ru };

/** Cookie that carries the chosen language to the server, so the first paint is already right */
export const LOCALE_COOKIE = 'mcp-chat-locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ru';
}

/** `ru`, `ru-RU` and the like map to Russian, everything else to English */
export function localeFromLanguage(language: string | null | undefined): Locale {
  return language?.trim().toLowerCase().startsWith('ru') ? 'ru' : DEFAULT_LOCALE;
}
