import { Injectable, Injector } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { DescuentoJSON, ResponseDescuentos, ResponseJSON } from '../shared/schemas/ResponseJSON';
import { Observable, catchError, debounceTime, defer, map, of, tap, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { error } from 'pdf-lib';
import { DownloadService } from './download.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: _HttpClient, private injector: Injector, private downloadService: DownloadService) {}

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }
  getAdelantos(year: number, month: number, personalID: string) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http.get<ResponseJSON<any[]>>(`api/adelantos/${personalID}/${year}/${month}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonaResponsables(year: number, month: number, personalID: string) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http.get<ResponseJSON<any[]>>(`api/personal/responsables/${personalID}/${year}/${month}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentoByPeriodo(year: number, month: number): Observable<ResponseDescuentos> {
    const emptyResponse: ResponseDescuentos = { RegistrosConComprobantes: 0, Registros: [] };
    if (!month || !year) {
      return of(emptyResponse);
    }
    return this.http.get<ResponseJSON<ResponseDescuentos>>(`/api/impuestos_afip/${year}/${month}`).pipe(
      map(res => res.data),
      catchError(() => of(emptyResponse))
    );
  }

  addAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http.post<ResponseJSON<any>>(`api/adelantos`, adelanto).pipe(tap(res => this.response(res)));
  }

  delAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http
      .delete<ResponseJSON<any>>(`api/adelantos/${adelanto.PersonalId}`, adelanto)
      .pipe(tap(res => this.response(res)));
  }

  downloadComprobante(cuit: number, personalId: number, year: number, month: number) {
    return this.http
      .get<Blob>(
        `api/impuestos_afip/${year}/${month}/${cuit}/${personalId}`,
        {},
        { observe: 'response', responseType: 'blob' as 'json' }
      )
      .pipe(
        tap({
          next: resp => {
            const filename = resp.headers.get('content-disposition')!.split(';')[1].split('filename')[1].split('=')[1].trim() || '';
            console.log("nombre",filename)
            this.downloadService.downloadBlob(resp.body!, filename, 'application/pdf');
          },
        })
      );
  }

  response(res: ResponseJSON<any>) {
    this.notification.success('Respuesta', res.msg);
  }
}

export function doOnSubscribe<T>(onSubscribe: () => void): (source: Observable<T>) => Observable<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();

      return source;
    });
  };
}
