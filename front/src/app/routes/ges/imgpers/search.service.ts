import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize, map, Observable } from 'rxjs'
import { ResponseByID, ResponseBySearch, Search } from 'src/app/shared/schemas/personal.schemas';
import { ResponseJSON } from 'src/app/shared/schemas/ResponseJSON';

@Injectable({
    providedIn: 'root'
})



export class SearchService {
    constructor(private http: _HttpClient) {}

    
    getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
        return this.http.post('api/personal/search', { fieldName: fieldName, value: values }).pipe(
            map(
                (res: ResponseJSON<ResponseBySearch>) => 
                {
                    if (res.msg == "ok") {
                        return res.data.recordsArray
                    }
                    else {
                        throw res.msg
                    }
                }
            )
        )
    }

    getInfoFromPersonalId(id: string): Observable<ResponseByID>{
        return this.http.get(`api/personal/${id}`)
            .pipe(
                map((res) => res ? res.data : {data: {}})
            )
    }
    

}

