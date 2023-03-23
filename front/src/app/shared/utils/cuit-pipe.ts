import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'CUIT' })

export class CUITPipe implements PipeTransform {
  transform(value: string, sep = "-"): string {
    return (value) ? value.substring(0, 2) + sep + value.substring(2, 10) + sep + value.substring(10) : "";
  }
}