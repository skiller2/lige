import { inject, InjectionToken, LOCALE_ID } from '@angular/core';

export const DEFAULT_THOUSAND_SEPARATOR = new InjectionToken<String>(' ')

export function thousandSeparatorFactory(): string {
  const locale = inject(LOCALE_ID)
  const formattedNumber = (1234).toLocaleString(locale)
  return formattedNumber.replace(/\d/g, '')
}


