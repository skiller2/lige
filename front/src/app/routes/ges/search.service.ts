import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize, map, Observable, of } from 'rxjs'
import { PersonaObj, ResponseBySearch, Search } from 'src/app/shared/schemas/personal.schemas';
import { ResponseJSON } from 'src/app/shared/schemas/ResponseJSON';

@Injectable({
    providedIn: 'root'
})



export class SearchService {
    constructor(private http: _HttpClient) { }

    getObjetivos(fieldName: string, value: string, sucursalId: string) {
        if (!value || value=="") {return of([])}
        return this.http.post('api/objetivos/search', {sucursalId: sucursalId, fieldName: fieldName, value: value})
            .pipe(
                map((res: ResponseJSON<any>) => res.data.objetivos)
            )
    }

    getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
        if (!values || values=="") {return of([])}
        return this.http.post('api/personal/search', { fieldName: fieldName, value: values })
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

    getSucursales(): Observable<any> {
        return this.http.get(`api/sucursales`)
            .pipe(
                map((res: ResponseJSON<any>) => {
                    if (res)  return res.data
                    throw 'Error'
                })
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

    getMetodologia() {
        return this.http.get(`api/asistencia/metodologia`)
            .pipe(
                map((res: ResponseJSON<any>) => res.data)
            )
    }

}

