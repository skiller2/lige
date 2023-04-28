import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { ResponseJSON } from '../shared/schemas/ResponseJSON';
import { map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: _HttpClient) { }

  getAdelantos(year: number, month: number, personalID: string) {
    if (!personalID || !month || !year) {return of([])}
    return this.http.get<ResponseJSON<any[]>>(`api/adelantos/${personalID}/${year}/${month}`)
      .pipe(
        map((res) => res.data)
      )
  }
}
