import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize, map, Observable } from 'rxjs'
import { PersonaObj, ResponseBySearch, Search } from 'src/app/shared/schemas/personal.schemas';
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

    getInfoFromPersonalId(id: string): Observable<PersonaObj> {
        const dummy: PersonaObj = {
            PersonalId: 0,
            PersonalApellido:'',
            PersonalNombre:'',
            PersonalCUITCUILCUIT: '',
            DocumentoImagenFotoBlobNombreArchivo: "",
            image: '',
            NRO_EMPRESA: '',
            DNI: '',
            CategoriaPersonalDescripcion: '',
            FechaDesde: new Date(),
            FechaHasta: new Date()
        }
        if (!id || id=="") return new BehaviorSubject<PersonaObj>(dummy).asObservable()
        else return this.http.get(`api/personal/${id}`)
            .pipe(
                map((res: ResponseJSON<PersonaObj>) => 
                res && res.data ? 
                res.data :
                dummy)
            )
    }
}

