import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'CUIT' })

export class CUITPipe implements PipeTransform {
  transform(value: string | number, sep = "-"): string {
    value=value.toString()
    return (value) ? value.substring(0, 2) + sep + value.substring(2, 10) + sep + value.substring(10) : "";
  }
}