import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'AGE',standalone:true })

export class AGEPipe implements PipeTransform {
  transform(value: string): number {
    const currYear = new Date().getFullYear()
    const dob = new Date(value)
    const dobYear = dob.getFullYear()
    return currYear - dobYear
  }
}