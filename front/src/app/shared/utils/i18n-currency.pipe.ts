import { DEFAULT_CURRENCY_CODE, LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

@Pipe({
  name: 'I18NCurrency',
  standalone: true,
  pure: false // Needed if language can change dynamically
})
export class I18NCurrencyPipe implements PipeTransform {
//  private currencyPipe = inject(CurrencyPipe);
  private locale = inject(LOCALE_ID);
  private symbol = inject(DEFAULT_CURRENCY_CODE)
  transform(
    value: number | null | undefined,
  ): string | null {
    return `${this.symbol}${Number(value).toLocaleString(this.locale,{minimumFractionDigits: 2})}`
  }
}
