import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize, map, Observable } from 'rxjs'

export interface SearchResponse {
    msg: string,
    data: Array<any>
}

@Injectable({
    providedIn: 'root'
})



export class SearchService {
    httpOptions = {
        headers: new HttpHeaders({ 
          'Access-Control-Allow-Origin':'*',
          'Authorization':'authkey',
          'userid':'1'
        })
      };

    constructor(private http: _HttpClient) {

          
    }

    
    getPersonFromName(fieldName: string, values: string): Observable<SearchResponse> {
        return this.http.post('api/personal/search', { fieldName: fieldName, value: values }).pipe(map((res: SearchResponse) => res ? res : {msg: "", data:[]}))
    }

    getInfoFromPersonalId(id: string): Observable<any>{
        return this.http.get(`api/personal/${id}`)
            .pipe(
                map((res) => res ? res.data : {data: {}})
            )
    }
    

}

