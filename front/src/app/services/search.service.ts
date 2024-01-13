import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  delay,
  finalize,
  map,
  Observable,
  of,
} from 'rxjs';
import {
  PersonaObj,
  ResponseBySearch,
  Search,
} from 'src/app/shared/schemas/personal.schemas';
import {SearchGrup,ResponseBySearchGrup } from 'src/app/shared/schemas/grupoActividad.shemas';
import { ResponseBySearchCliente,SearchClient } from 'src/app/shared/schemas/cliente.schemas';
import {
  Objetivo,
  ObjetivoInfo,
  ResponseJSON,
  ResponseNameFromId,
} from 'src/app/shared/schemas/ResponseJSON';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  getListaAsistenciaPersonalAsignado(ObjetivoId: number, anio: number, mes: number) {
    if (!ObjetivoId)
      return of([])
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/listaperasig/${anio}/${mes}/${ObjetivoId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getAsistenciaPeriodo(ObjetivoId: number, anio: number, mes: number) {
    if (!ObjetivoId)
      return of([])
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/periodo/${anio}/${mes}/${ObjetivoId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }
  constructor(private http: _HttpClient) {}

  getCUITfromPersonalId(personalId: string): Observable<null | number> {
    return this.http
      .get<ResponseJSON<ResponseNameFromId>>(`api/personal/${personalId}`)
      .pipe(
        map(res => res.data.cuit),
        catchError(() => of(null))
      );
  }

  ObjetivoInfoFromId(objetivoId: string): Observable<ObjetivoInfo> {
    return this.http
      .get<ResponseJSON<ObjetivoInfo>>(`api/objetivos/name/${objetivoId}`)
      .pipe(
        map(res => { res.data.fullName = `${res.data.clienteId}/${Number(res.data.elementoDependienteId)} ${res.data.descripcion}`;  return res.data }),
        catchError(() =>
          of({
            objetivoId: 0,
            clienteId: 0,
            elementoDependienteId: 0,
            descripcion: '',
            fullName:''
          })
        )
      );
  }

  getObjetivos(fieldName: string, value: string, sucursalId: string) {
    if (!value || value == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<{ objetivos: Objetivo[] }>>('api/objetivos/search', {
        sucursalId: sucursalId,
        fieldName: fieldName,
        value: value,
      })
      .pipe(
        map(res => res.data.objetivos),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getObjetivoContratos(objetivoId: number, anio: number, mes: number) { 
  if (!objetivoId) {
      return of([]);
    }
    return this.http
      .get<ResponseJSON<any>>(`api/objetivos/contratos/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map(res => res.data ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getObjetivo(objetivoId: number, anio: number, mes: number) {
    if (!objetivoId) {
      return of([]);
    }
    return this.http
      .get<ResponseJSON<any>>(`api/objetivos/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getObjetivoResponsables(objetivoId: number, anio: number, mes: number) {
    if (!objetivoId) {
      return of([]);
    }
    return this.http
      .get<ResponseJSON<any>>(`api/objetivos/responsables/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearch>>('api/personal/search', {
        fieldName: fieldName,
        value: values,
      })
      .pipe(
        map(res => {
          if (res.data.recordsArray) return res.data.recordsArray;
          else return [];
        }),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getGrupoActividad(fieldName: string, values: string): Observable<SearchGrup[]> {

    
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchGrup>>('api/pendiente/search', {
        fieldName: fieldName,
        value: values,
      })
      
      .pipe(
        map(res => {
          if (res.data.recordsArray)
           return res.data.recordsArray;
          else return [];
        }),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getClientFromName(fieldName: string, values: string): Observable<SearchClient[]> {
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchCliente>>('api/cliente/search', {
        fieldName: fieldName,
        value: values,
      })
      .pipe(
        map(res => {
          if (res.data.recordsArray) return res.data.recordsArray;
          else return [];
        }),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getSucursales(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/sucursales`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCategorias(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/asistencia/categorias`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getInfoFromPersonalId(id: string): Observable<PersonaObj> {
    const dummy: PersonaObj = {
      PersonalId: 0,
      PersonalApellido: '',
      PersonalNombre: '',
      PersonalCUITCUILCUIT: '',
      DocumentoImagenFotoBlobNombreArchivo: '',
      image: '',
      NRO_EMPRESA: '',
      DNI: '',
      CategoriaPersonalDescripcion: '',
      FechaDesde: new Date(),
      FechaHasta: new Date(),
      Faltantes:true
    };
    if (!id || id == '')
      return new BehaviorSubject<PersonaObj>(dummy).asObservable();
    else
      return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/${id}`).pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of(dummy);
        })
      );
  }

  getExcepxObjetivo(
    objetivoId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!objetivoId) return of([]);

    return this.http
      .get<ResponseJSON<PersonaObj>>(
        `api/asistencia/exceporobj/${anio}/${mes}/${objetivoId}`
      )
      .pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getExcepxPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get<ResponseJSON<PersonaObj>>(
        `api/asistencia/exceporper/${anio}/${mes}/${personalId}`
      )
      .pipe(
        map(res => res.data),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getDescuentosPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/descuentosxper/${anio}/${mes}/${personalId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }
  getCategoriasPersona(
    personalId: number,
    anio: number,
    mes: number,
    SucursalId: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/categoriasxper/${anio}/${mes}/${personalId}/${SucursalId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getPersonalxResponsable(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/personalxresp/${anio}/${mes}/${personalId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getIngresosPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/ingresosxper/${anio}/${mes}/${personalId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getIngresosExtraPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/ingresosextraxper/${anio}/${mes}/${personalId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }



  getAsistenciaPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/listaporper/${anio}/${mes}/${personalId}`)
      .pipe(
        map((res: ResponseJSON<PersonaObj>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getDescuentosObjetivo(
    objetivoId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!objetivoId) return of([]);

    return this.http
      .get(`api/asistencia/descuentosxobj/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }


  getAsistenciaObjetivo(
    objetivoId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!objetivoId) return of([]);

    return this.http
      .get(`api/asistencia/listaporobj/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map((res: ResponseJSON<PersonaObj>) =>
          res && res.data ? res.data : []
        ),
        catchError((err, caught) => {
          console.log('Something went wrong!');
          return of([]);
        })
      );
  }

  getMetodologia() {
    return this.http.get<ResponseJSON<any>>(`api/asistencia/metodologia`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  setAsistenciaExcepcion(params: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/asistencia/excepcion`, params)
      .pipe(map(res => res.data));
  }

  deleteAsistenciaExcepcion(params: any) {
    return this.http
      .delete<ResponseJSON<any>>(
        `api/asistencia/excepcion/${params.anio}/${params.mes}/${params.ObjetivoId}/${params.PersonalId}/${params.metodo}/${params.metodologiaId}`
      )
      .pipe(map(res => res.data));
  }
}
