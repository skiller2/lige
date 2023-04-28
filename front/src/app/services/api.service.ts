import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { ResponseJSON } from '../shared/schemas/ResponseJSON';
import { catchError, map, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: _HttpClient) {}

  getAdelantos(year: number, month: number, personalID: string) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http
      .get<ResponseJSON<any[]>>(`api/adelantos/${personalID}/${year}/${month}`)
      .pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  addAdelanto(adelanto: { PersonalId: string; monto: number }) {
    if (!adelanto.PersonalId) {
      return throwError(() => new Error('Falta especificar la persona!'));
    }
    if (!adelanto.monto) {
      return throwError(() => new Error('Falta especificar el monto!'));
    }
    return this.http
      .post<ResponseJSON<any>>(`api/adelantos`, adelanto)
      .pipe(map(res => res.msg));
  }
}
