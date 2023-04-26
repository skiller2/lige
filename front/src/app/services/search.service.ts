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
        return this.http.post<ResponseJSON<any>>('api/objetivos/search', {sucursalId: sucursalId, fieldName: fieldName, value: value})
            .pipe(
                map((res) => res.data.objetivos)
            )
    }

    getObjetivo(objetivoId: number, anio: number, mes: number) {
        if (!objetivoId) {return of([])}
        return this.http.get<ResponseJSON<any>>(`api/objetivos/${anio}/${mes}/${objetivoId}`)
            .pipe(
                map((res) => res.data)
            )
    }



    getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
        if (!values || values=="") {return of([])}
        return this.http.post<ResponseJSON<ResponseBySearch>>('api/personal/search', { fieldName: fieldName, value: values })
            .pipe(
                map(
                    (res) => {
                        if (res.data.recordsArray)
                            return res.data.recordsArray
                        else 
                            return []
                    }
                )
            )
    }

    getSucursales(): Observable<any> {
        return this.http.get<ResponseJSON<any>>(`api/sucursales`)
            .pipe(
                map((res) => {
                    if (res)  return res.data
                    throw 'Error'
                })
            )
    }
    
    getCategorias(): Observable<any> {
        return this.http.get<ResponseJSON<any>>(`api/asistencia/categorias`)
            .pipe(
                map((res) => {
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

    getExcepxObjetivo(objetivoId: number, anio: number, mes: number): Observable<any> {
        if (!objetivoId) return of([])
        
         return this.http.get(`api/asistencia/exceporobj/${anio}/${mes}/${objetivoId}`)
            .pipe(
                map((res: ResponseJSON<PersonaObj>) => 
                res && res.data ? 
                res.data :
                [])
            )
    }

    getAsistenciaObjetivo(objetivoId: number, anio: number, mes: number): Observable<any> {
        if (!objetivoId) return of([])
        
         return this.http.get(`api/asistencia/listaporobj/${anio}/${mes}/${objetivoId}`)
            .pipe(
                map((res: ResponseJSON<PersonaObj>) => 
                res && res.data ? 
                res.data :
                [])
            )
    }

    getMetodologia() {
        return this.http.get<ResponseJSON<any>>(`api/asistencia/metodologia`)
            .pipe(
                map((res) => res.data)
            )
    }

    setAsistenciaExcepcion(params: any) { 
        return this.http.post<ResponseJSON<any>>(`api/asistencia/excepcion`,params)
            .pipe(
                map((res) => res.data)
            )

    }

    deleteAsistenciaExcepcion(params: any) { 
        return this.http.delete<ResponseJSON<any>>(`api/asistencia/excepcion/${params.anio}/${params.mes}/${params.ObjetivoId}/${params.PersonaId}/${params.metodologia}`)
            .pipe(
                map((res) => res.data)
            )

    }
}

