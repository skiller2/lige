import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'AGE',standalone:true })

export class AGEPipe implements PipeTransform {
  transform(value: Date): number {
    /*
    const currYear = new Date().getFullYear()
    const dob = new Date(value)
    const dobYear = dob.getFullYear()
    return currYear - dobYear
    */
    const convertAge = new Date(value);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    return Math.floor((timeDiff / (1000 * 3600 * 24))/365);
  }
}