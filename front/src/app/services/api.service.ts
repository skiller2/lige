import { Inject, Injectable, Injector, LOCALE_ID } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { DescuentoJSON, ResponseDescuentos, ResponseJSON } from '../shared/schemas/ResponseJSON';
import { Observable, catchError, debounceTime, defer, filter, map, of, tap, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { error } from 'pdf-lib';
import { DownloadService } from './download.service';
import { formatNumber } from '@angular/common';
import { Formatters } from '@slickgrid-universal/common';


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: _HttpClient, private injector: Injector, @Inject(LOCALE_ID) public locale: string) { }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  getPersonaMonotributo(year: number, month: number, personalId: number) {
    if (personalId == 0) return of([])

    return this.http.get<ResponseJSON<any[]>>(`api/personal/monotributo/${personalId}/${year}/${month}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  get(url: string) {
    return this.http.get<any>(url).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCols(url: string) {
    return this.http.get<any>(url).pipe(
      map((res) => {
        const mapped = res.data.map((col: any) => {
          if (col.type == 'date')
            col.formatter = Formatters.dateEuro
          return col
        });
        console.log('columnas', res.data)
        return res.data
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
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

  getDescuentosMonotributo(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/impuestos_afip/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  getPersonalCategoriaPendiente(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/categorias/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }
  getObjetivosPendAsis(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/objetivos-pendasis/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  setCambiarCategorias(filters: any) {
    const parameter = filters
    this.notification.success('Respuesta', `Inicio cambio de categoría`);

    return this.http.post<ResponseJSON<any>>('/api/categorias/cambiarCategorias', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  getDescuentoByPeriodo(year: number, month: number, personaIdRel: number): Observable<ResponseDescuentos> {
    const emptyResponse: ResponseDescuentos = { RegistrosConComprobantes: 0, RegistrosSinComprobantes: 0, Registros: [] };
    if (!month || !year) {
      return of(emptyResponse);
    }
    const path = `/api/impuestos_afip/${year}/${month}` + (personaIdRel > 0 ? `/${personaIdRel}` : ``);
    return this.http.get<ResponseJSON<ResponseDescuentos>>(path).pipe(
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

  response(res: ResponseJSON<any>) {
    let tiempoConsido = ''
    if (res.ms)
      tiempoConsido = `<BR> Tiempo consumidio ${formatNumber(Number(res.ms) / 1000, this.locale, '1.2-2')} segundos`
    this.notification.success('Respuesta', `${res.msg} ${tiempoConsido}`);
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
