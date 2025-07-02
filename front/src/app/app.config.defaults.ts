import { inject, InjectionToken, LOCALE_ID } from '@angular/core';

export const DEFAULT_THOUSAND_SEPARATOR = new InjectionToken<String>(' ')
export const DEFAULT_DECIMAL_MARKER = new InjectionToken<String>('')

export function thousandSeparatorFactory(): string {
  const locale = inject(LOCALE_ID)

  console.log('locale',locale,(1234).toLocaleString(locale),(1.12).toLocaleString(locale))
  const formattedNumber = (1234).toLocaleString(locale)
  return formattedNumber.replace(/\d/g, '')
}

export function   decimalMarkerFactory(): string {
  const locale = inject(LOCALE_ID)
  const formattedNumber = (1.12).toLocaleString(locale)
  return formattedNumber.replace(/\d/g, '')
}

