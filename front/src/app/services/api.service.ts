import { Injectable, Injector } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { ResponseJSON } from '../shared/schemas/ResponseJSON';
import { catchError, map, of, tap, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { error } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: _HttpClient, private injector: Injector) {}

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }
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
    return this.http
      .post<ResponseJSON<any>>(`api/adelantos`, adelanto)
      .pipe(tap(res => this.response(res)));
  }

  delAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http
      .delete<ResponseJSON<any>>(
        `api/adelantos/${adelanto.PersonalId}`,
        adelanto
      )
      .pipe(tap(res => this.response(res)));
  }

  response(res: ResponseJSON<any>) {
    this.notification.success('Respuesta', res.msg);
  }
}
