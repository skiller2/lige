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
    constructor(private http: _HttpClient) { }


    getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
        if (!values || values=="") {return new BehaviorSubject<Search[]>(
            []
        ).asObservable()}
        else return this.http.post('api/personal/search', { fieldName: fieldName, value: values })
            .pipe(
                map(
                    (res: ResponseJSON<ResponseBySearch>) => {
                        if (res.data.recordsArray)
                            return res.data.recordsArray
                        else 
                            return []
                    }
                )
            )
    }

    getInfoFromPersonalId(id: string): Observable<ResponseByID> {
        const dummy: ResponseByID = {
            PersonalId: 0,
            PersonalApellido:'',
            PersonalNombre:'',
            PersonalCUITCUILCUIT: '',
            DocumentoImagenFotoBlobNombreArchivo: "",
            image: '',
            NRO_EMPRESA: '',
            DNI: '',
            Categoria: '',
            FechaDesde: new Date(),
            FechaHasta: new Date()
        }
        if (!id || id=="") return new BehaviorSubject<ResponseByID>(dummy).asObservable()
        else return this.http.get(`api/personal/${id}`)
            .pipe(
                map((res: ResponseJSON<ResponseByID>) => 
                res && res.data ? 
                res.data :
                dummy)
            )
    }
}

