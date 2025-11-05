import { HttpHeaders } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
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
  share,
  shareReplay
} from 'rxjs';
import {
  PersonaObj,
  ResponseBySearch,
  Search,
} from 'src/app/shared/schemas/personal.schemas';
import { SearchGrup, ResponseBySearchGrup } from 'src/app/shared/schemas/grupoActividad.shemas';
import { ResponseBySearchCliente, SearchClient } from 'src/app/shared/schemas/cliente.schemas';
import { ResponseBySearchAdministrador, SearchAdmind } from 'src/app/shared/schemas/administrador.schemas';
import { ResponseBySearchRubro, SearchRubro } from 'src/app/shared/schemas/rubro.schemas';
import { ResponseBySearchSeguro, SearchSeguro } from 'src/app/shared/schemas/seguro.schemas';
import { ResponseBySearchInasistencia, SearchInasistencia } from 'src/app/shared/schemas/inasistencia.schemas';
import { ResponseBySearchSituacionRevista, SearchSituacionRevista } from 'src/app/shared/schemas/situacionrevista.shemas';
import {
  Objetivo,
  ObjetivoInfo,
  ResponseJSON,
  ResponseNameFromId,
} from 'src/app/shared/schemas/ResponseJSON';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private injector = inject(Injector)
  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

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
    if (!ObjetivoId || !anio || !mes)
      return of([])
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/periodo/${anio}/${mes}/${ObjetivoId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }
  constructor(private http: _HttpClient) { }

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
        map(res => { res.data.fullName = `${res.data.clienteId}/${Number(res.data.ClienteElementoDependienteId)} ${res.data.descripcion}`; return res.data }),
        catchError(() =>
          of({
            objetivoId: 0,
            clienteId: 0,
            ClienteElementoDependienteId: 0,
            descripcion: '',
            fullName: ''
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
    if (!objetivoId || !anio || !mes) {
      return of([]);
    }
    return this.http
      .get<ResponseJSON<any>>(`api/objetivos/contratos/${anio}/${mes}/${objetivoId}`)
      .pipe(
        map(res => res.data),
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
    if (!objetivoId || !anio || !mes) {
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

  getInasistenciaSearch(fieldName: string, values: string): Observable<SearchInasistencia[]> {
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchInasistencia>>('api/inasistencia/search', {
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

  getSituacionRevistaSearch(fieldName: string, values: string): Observable<SearchSituacionRevista[]> {
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchSituacionRevista>>('api/situacion-revista/search', {
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

  getInasistenciaFromName(fieldName: string, values: string): Observable<SearchInasistencia[]> {
    return this.getInasistenciaSearch(fieldName, values)
  }

  getSituacionRevistaFromName(fieldName: string, values: string): Observable<SearchSituacionRevista[]> {
    return this.getSituacionRevistaSearch(fieldName, values)
  }


  //rubro

  getRubroFromName(fieldName: string, values: string): Observable<SearchRubro[]> {
    return this.getRubroSearch(fieldName, values)
  }

  getRubroSearch(fieldName: string, values: string): Observable<SearchRubro[]> {
    /*
        if (!values || values == '') {
          return of([]);
        }
    */
    return this.http
      .post<ResponseJSON<ResponseBySearchRubro>>('api/rubro/search', {
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

  // estudios

   //SearchEstudio
   getAplicaAOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/gestion-descuentos/aplicaa/options`).pipe(  
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  //SearchEstudio
  getEstudioSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/estudio/search`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  getEstudioSearchId(id: number): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/estudio/searchId/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  //Curso

  getCursoSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/curso/search`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  getCursoSearchId(id: number): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/curso/searchId/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  ///////

  getCompaniaSeguroSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/seguros/searchCompaniaSeguro`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  getCompaniaSeguroId(id: number): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/seguros/searchCompaniaSeguroId/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  //////


  getTipoSeguroSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/seguros/searchTipoSeguro`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  getTipoSeguroId(id: number): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/seguros/searchTipoSeguroId/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  //////

  getModalidadCursoSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/curso/searchModalidadCurso`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }


  getModalidadCursoSearchId(id: string): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/curso/searchModalidadCursoId/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }




  getSeguroSearch(fieldName: string, values: string): Observable<SearchSeguro[]> {

    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchSeguro>>('api/seguros/search', {
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

  getSeguroFromName(fieldName: string, values: string): Observable<SearchSeguro[]> {
    return this.getSeguroSearch(fieldName, values)
  }


  getGrupoActividadFromName(fieldName: string, values: string): Observable<Search[]> {
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

  getDireccion(direccion: string): Observable<any[]> {
    if (!direccion || direccion == '') {
      return of([]);
    }

    const params = new URLSearchParams({
      text: direccion,
      apiKey: 'f5cdd3892a38432fbcd0edc786268446',
      limit: '5'
    });
    console.log('getDireccion', direccion)
    return new Observable<any[]>(observer => {
      console.log('fetch', 'https://api.geoapify.com/v1/geocode/autocomplete?' + params.toString())
      fetch('https://api.geoapify.com/v1/geocode/autocomplete?' + params.toString())
        .then(res => res.json())
        .then(data => {
          observer.next(data?.features || []);
          observer.complete();
        })
        .catch(error => {
          console.error('Error fetching geocoding data:', error);
          observer.next([]);
          observer.complete();
        });
    });
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

  getAdministradorFromName(fieldName: string, values: string): Observable<SearchAdmind[]> {
    if (!values || values == '') {
      return of([]);
    }
    return this.http
      .post<ResponseJSON<ResponseBySearchAdministrador>>('api/administrador/search', {
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

  getPersonas(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/sucursales`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoProducto(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/descripcion-productos`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getSePaga(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/carga-licencia/sepaga_getOptions`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getInactivo(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/grupo-actividad/inactivo_getOptions`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getInactivoBoolean(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/grupo-actividad/inactivoboolean_getOptions`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getBooleanSiNo(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/clientes/get_options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipo(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/grupo-actividad/tipo_getOptions`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getComprobanteTipoSearch(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`/api/facturacion/comprobanteTipo_getOptions`).pipe(
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

  getProcAutoEstadosOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/procesos-automaticos/estado/options`).pipe(
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
      PersonalFotoId: 0,
      image: '',
      NRO_EMPRESA: '',
      DNI: '',
      CategoriaPersonalDescripcion: '',
      FechaDesde: new Date(),
      FechaHasta: new Date(),
      Faltantes: true
    };
    if (!id || id == '')
      return new BehaviorSubject<PersonaObj>(dummy).asObservable();
    else
      return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/${id}`).pipe(
        map(res => {

          return res.data
        }),
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

  getDescuentosObjetivo(
    ObjetivoId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!ObjetivoId) return of([]);

    return this.http
      .get(`api/asistencia/descuentosxobj/${anio}/${mes}/${ObjetivoId}`)
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


  getDescuentosPersonaCoord(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/descuentosxpercoord/${anio}/${mes}/${personalId}`)
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
    SucursalId: number,
    ObjetivoId: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/categoriasxper/${anio}/${mes}/${personalId}/${SucursalId}/${ObjetivoId}`)
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

  getHabilitacionesPersona(
    personalId: number,
    anio: number,
    mes: number,
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/habilitacionesxper/${anio}/${mes}/${personalId}`)
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
  getCustodiasPersona(
    personalId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/listacusporper/${anio}/${mes}/${personalId}`)
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

  getDescuentosPerxObjetivo(
    objetivoId: number,
    anio: number,
    mes: number
  ): Observable<any> {
    if (!objetivoId) return of([]);

    return this.http
      .get(`api/asistencia/descuentosperxobj/${anio}/${mes}/${objetivoId}`)
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

  getPersonalById(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getProductoById(codigoHistory: any): Observable<any> {
    if (!codigoHistory) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/precios-productos/${codigoHistory}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getObjetivoById(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/objetivos/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTelefonosPersona(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/telefonos/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getContactoOperativo(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/objetivos/contactooperativo/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDomicilio(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/objetivos/domicilio/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCoberturaServicio(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/objetivos/coberturaservicio/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  getCuentasBancoPersona(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/banco/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLicenciasPersona(
    personalId: number,
    anio: number,
    mes: number,
  ): Observable<any> {
    if (!personalId) return of([]);

    return this.http
      .get(`api/asistencia/licenciasxper/${anio}/${mes}/${personalId}`)
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

  getListaAsistenciaPersonalAsignadoAnterior(ObjetivoId: number, anio: number, mes: number) {
    if (!ObjetivoId)
      return of([])
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/listaperasigant/${anio}/${mes}/${ObjetivoId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListaAsistenciaControAcceso(ObjetivoId: number, anio: number, mes: number) {
    if (!ObjetivoId)
      return of([])
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/listacontrolacceso/${anio}/${mes}/${ObjetivoId}`)
      .pipe(
        map(res => res.data),
        //catchError(() => of([]))
      );
  }

  getTiposHora() {
    return this.http
      .get<ResponseJSON<any>>(`api/asistencia/tiposhora`)
      .pipe(

        map((res: ResponseJSON<any>) =>
          res && res.data ? res.data : []
        ),
        catchError(() => of([]))
      )
  }

  getListaPersonalCustodia(options: any, periodo: Date) {
    if (!periodo) return of([]);
    return this.http
      .post<ResponseJSON<any>>(`api/custodia/personallist`, { options, periodo })
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListaClientes(filters: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/clientes/list`, filters)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListaPrecioProductos(filters: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/precios-productos/list`, filters)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListGrupoActividadGrupos(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/grupo-actividad/listGrupos', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );


  }

  getListGrupoActividadResponsables(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/grupo-actividad/listResponsables', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );


  }

  getListGrupoActividadObjetivos(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/grupo-actividad/listObjetivos', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );


  }

  getListGrupoActividadPersonal(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/grupo-actividad/listPersonal', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );


  }

  getListSedes(filters: any, CentroCapacitacionId: number) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/instituciones/listEdit', { options: parameter, CentroCapacitacionId }).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );


  }

  getListAccessBot(filters: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/acceso-bot/list`, filters)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListObjetivos(filters: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/objetivos/list`, filters)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListNovedades(options: any, periodo: Date) {
    if (!periodo && !options.filtros.length) {
      this.notification.warning('Advertencia', `Por favor, ingrese al menos un filtro o un período.`);
      return of([]);
    }
    return this.http
      .post<ResponseJSON<any>>(`api/novedades/list`, { options, periodo })
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }


  getInfoObjCustodia(objCustodiaId: number) {
    return this.http
      .get<ResponseJSON<any>>(`api/custodia/obj/${objCustodiaId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }


  getInfoObj(objetivo: number, ClienteId: any, ClienteElementoDependienteId: any) {
    return this.http
      .get<ResponseJSON<any>>(`api/objetivos/infObjetivo/${objetivo}/${ClienteId}/${ClienteElementoDependienteId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getNovedad(novedadId: number) { 
    return this.http 
      .get<ResponseJSON<any>>(`api/novedades/infNovedad/${novedadId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getInfoFilterReport(title: string) {
    return this.http
      .get<ResponseJSON<any>>(`api/reportes/filterReport/${title}`)
      .pipe(
        map(res => res.data)
      );
  }

  getInfoObjCliente(objClienteId: number) {
    return this.http
      .get<ResponseJSON<any>>(`api/clientes/infoCliente/${objClienteId}`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getEstadoCustodia(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/custodia/estados`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getEstadoPrestamo(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/ayuda-asistencial/estados`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getOptionsCondicionAnteIva(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getCondicion`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuento(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/objetivos/getDescuento`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getProvincia(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getProvincia`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoNovedad(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/novedades/tipo_novedad`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoTelefono(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getTipoTelefono`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLocalidad(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getLocalidad`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getBarrio(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getBarrio`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoContacto(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getTipoContacto`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getJurImpositiva(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/clientes/getJurImpositiva`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLastPersonalByPatente(patente: string): Observable<any> {
    if (!patente || patente == '') {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/custodia/lastdueno`, { patente }).pipe(
      map(res => {
        return (res && res.data) ? res.data[0] : null
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getRequirentesByCliente(clienteId: number): Observable<any> {
    if (!clienteId) {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/custodia/requirente`, { clienteId }).pipe(
      map(res => {
        return res.data
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getRequirente(value: string): Observable<Search[]> {
    if (!value || value == '') {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>('api/custodia/requirente/search', { value }).pipe(
      map(res => {
        return res.data;
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonasAyudaAsistencial(filters: any) {
    return this.http.post<ResponseJSON<any>>('/api/ayuda-asistencial/list', filters).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );
  }

  getTipoPrestamo(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/ayuda-asistencial/tipos`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  getProxAplicaEl(parameter: any) {
    return this.http.post<ResponseJSON<any>>('/api/ayuda-asistencial/proxfecha', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of({}))
    );
  }

  getPersonalList(filters: any) {
    return this.http
      .post<ResponseJSON<any>>(`api/personal/list`, filters)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getPersonal() {
    return this.http
      .post<ResponseJSON<any>>(`api/personal/listfull`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }


  getSitRevistaOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/sitrevista/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }




  getDatosFacturacionByCliente(listClientes: any) {
    return this.http.post<ResponseJSON<any>>('/api/cliente/facturacion', listClientes).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of({}))
    );
  }

  getNacionalidadOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/nacionalidad/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonalInfoById(id: number): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/info/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPaises(): Observable<any> {
    return this.http.post<ResponseJSON<any>>(`api/residencia/paises`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getProvinciasByPais(paisId: number): Observable<any> {
    if (!paisId) {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/residencia/provincias`, { paisId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLocalidadesByProvincia(paisId: number, provinciaId: number): Observable<any> {
    if (!paisId || !provinciaId) {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/residencia/localidades`, { paisId, provinciaId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getBarriosByLocalidad(paisId: number, provinciaId: number, localidadId: number): Observable<any> {
    if (!paisId || !provinciaId || !localidadId) {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/residencia/barrios`, { paisId, provinciaId, localidadId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDomicilioByPersonal(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/domicilio/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLugarTelefonoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/telefonia/lugar/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoTelefonoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/telefonia/tipo/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getEstadoEstudioOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/estudio/estado/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoEstudioOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/estudio/tipo/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getHistoriaSituacionRevistaPersona(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/personal/historial/sitrevista/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getSitRevistaNoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/sitrevista/no-options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getGrupoActividadOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/grupoactividad/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDocumentosByPersonal(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<PersonaObj>>(`api/personal/documentos/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getHistoriaCategoriaPersona(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/personal/historial/categoria/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCategoriasByTipoAsociado(tipoAsociadoId: number): Observable<any> {
    if (!tipoAsociadoId) {
      return of([]);
    }
    return this.http.post<ResponseJSON<any>>(`api/personal/categorias`, { tipoAsociadoId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoAsociadoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/tipo-asociado/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoParentescoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/tipo-parentesco/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getBancosOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/bancos/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getHistorialPersonalBanco(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/personal/historial/banco/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLugarHabilitacionOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/lugarhabilitacion/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDocumentoTipoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/documento/tipos/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDocumentoDownloadList(doc_id: number, options: any) {
    if (!doc_id) return of([]);
    return this.http
      .post<ResponseJSON<any>>(`api/documento/list-download`, { doc_id, options })
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getDocumentoNoDownloadList(doc_id: number, options: any) {
    if (!doc_id) return of([]);
    return this.http
      .post<ResponseJSON<any>>(`api/documento/list-no-download`, { doc_id, options })
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getDecuentosTipoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/gestion-descuentos/tipo/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDecuentosAplicaAOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/gestion-descuentos/aplicaa/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  // centro capacitacion

  getCentroCapacitacionSearch(): Observable<any[]> {

    return this.http.get<ResponseJSON<any>>(`api/centro-capacitacion/search`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  getCentroCapacitacionSearchId(id: number): Observable<any[]> {

    return this.http.get<ResponseJSON<any>>(`api/centro-capacitacion/search/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  // centro capacitacion sede


  getCentroCapacitacionSedeSearch(): Observable<any[]> {

    return this.http.get<ResponseJSON<any>>(`api/centro-capacitacion/searchSede`).pipe(
      map(res => {
        return res.data;
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );

  }

  getDocumentoById(docId: number) {
    if (!docId) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/documento/get/${docId}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentosByPersonalId(PersonalId: number, anio: number, mes: number) {
    if (!PersonalId && anio && mes) return of([]);
    return this.http.post<ResponseJSON<any>>(`/api/gestion-descuentos/personal`, { PersonalId, anio, mes }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getEstadoCivilOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/estado-civil/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoDocumentoOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/tipo-documento/options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentoPersona(PersonalId: number, DescuentoId: number) {
    if (!PersonalId || !DescuentoId) {
      return of({});
    }
    return this.http.post<ResponseJSON<any>>(`api/gestion-descuentos/persona`, { PersonalId, DescuentoId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentoObjetivo(ObjetivoId: number, DescuentoId: number) {
    if (!ObjetivoId || !DescuentoId) {
      return of({});
    }
    return this.http.post<ResponseJSON<any>>(`api/gestion-descuentos/objetivo`, { ObjetivoId, DescuentoId }).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentoTableOptions() {
    return this.http.get<ResponseJSON<any>>(`api/gestion-descuentos/tables`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  // Personal Acta

  getHistorialPersonalActa(id: number): Observable<any> {
    if (!id) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/personal/historial/acta/${id}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoPersonalActaOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/personal/acta/tipo-acta-options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getNroActaOptions(): Observable<any> {
    return this.http.get<ResponseJSON<any>>(`api/actas/nro-acta-options`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getSitRevsitaAsocByPersonalId(PersonalId:number): Observable<any> {
    if (!PersonalId) return of([]);
    return this.http.get<ResponseJSON<any>>(`api/personal/sitrevistaaso/options/${PersonalId}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getProcesoAutomatico(logCod: number) {
    if (!logCod ) {
      return of({});
    }
    return this.http.get<ResponseJSON<any>>(`api/procesos-automaticos/${logCod}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getNovedadesFilters(){
    return this.http.get<ResponseJSON<any>>(`api/novedades/filters`)
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  getListExcepcionesAsistencia(options: any, periodo: Date) {
    if (!periodo && !options.filtros.length) {
      this.notification.warning('Advertencia', `Por favor, ingrese al menos un filtro o un período.`);
      return of([]);
    }
    return this.http
      .post<ResponseJSON<any>>(`api/excepciones-asistencia/list`, { options, periodo })
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

}
