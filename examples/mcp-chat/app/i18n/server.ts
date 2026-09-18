import { cookies, headers } from 'next/headers';
import { isLocale, LOCALE_COOKIE, localeFromLanguage, type Locale } from './locales';

/** The saved choice from the cookie, otherwise the first language the browser asks for */
export async function requestLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) {
    return saved;
  }
  const accepted = (await headers()).get('accept-language')?.split(',')[0];
  return localeFromLanguage(accepted);
}
