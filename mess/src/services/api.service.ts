// import { Inject, Injectable, Injector, LOCALE_ID } from '@angular/core';
// import { _HttpClient } from '@delon/theme';
// import { DescuentoJSON, ResponseDescuentos, ResponseJSON } from '../shared/schemas/ResponseJSON';
// import { Observable, catchError, combineLatest, debounceTime, defer, filter, map, of, tap, throwError } from 'rxjs';



// @Injectable({
//   providedIn: 'root',
// })

// export class ApiService {

//   constructor(private http: _HttpClient) {}

//   getUltDeposito(anio: number, mes: number, ObjetivoId: number) {
//     return this.http.get<ResponseJSON<any>>('api/personal/periodo/inicio', { anio, mes, ObjetivoId }).pipe(
//       tap((res: ResponseJSON<any>) => this.response(res)),
//     )
//   }

//   getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
//     if (!values || values == '') {
//       return of([]);
//     }
//     return this.http
//       .post<ResponseJSON<ResponseBySearch>>('api/personal/search', {
//         fieldName: fieldName,
//         value: values,
//       })
//       .pipe(
//         map(res => {
//           if (res.data.recordsArray) return res.data.recordsArray;
//           else return [];
//         }),
//         catchError((err, caught) => {
//           console.log('Something went wrong!');
//           return of([]);
//         })
//       );
//   }

// }
