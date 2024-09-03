import { Inject, Injectable, Injector, LOCALE_ID } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { DescuentoJSON, ResponseDescuentos, ResponseJSON } from '../shared/schemas/ResponseJSON';
import { Observable, catchError, combineLatest, debounceTime, defer, filter, map, of, tap, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { error } from 'pdf-lib';
import { DownloadService } from './download.service';
import { formatNumber } from '@angular/common';
import { collectionFormatter, ExternalResource, FieldType, Formatters } from '@slickgrid-universal/common';
import { AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { HttpContext } from '@angular/common/http';
import { ALLOW_ANONYMOUS } from '@delon/auth';


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  addAsistenciaPeriodo(anio: number, mes: number, ObjetivoId: number) {
    return this.http.post<ResponseJSON<any>>('api/asistencia/periodo/inicio', { anio, mes, ObjetivoId }).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }
  endAsistenciaPeriodo(anio: number, mes: number, ObjetivoId: number) {
    return this.http.post<ResponseJSON<any>>('api/asistencia/periodo/fin', { anio, mes, ObjetivoId }).pipe(
      tap((res: ResponseJSON<any>) => this.response(res))
    )
  }


  getTipoMovimientoById(TipoMovimiento: string) {
    return this.http.get(`/api/liquidaciones/tipo_movimiento_by_id/${TipoMovimiento}`).pipe(
      //      map(res => res.data.list.map((row: { tipo_movimiento_id: any; des_movimiento: any; }) => ( { value: row.tipo_movimiento_id, label: row.des_movimiento } ))),
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoMovimiento(TipoMovimiento: string) {
    return this.http.get(`/api/liquidaciones/tipo_movimiento/${TipoMovimiento}`).pipe(
      //      map(res => res.data.list.map((row: { tipo_movimiento_id: any; des_movimiento: any; }) => ( { value: row.tipo_movimiento_id, label: row.des_movimiento } ))),
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getImportacionesAnteriores(anio: number, mes: number) {
    return this.http.get(`/api/liquidaciones/importaciones_anteriores/${anio}/${mes}`).pipe(
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLicenciasArchivosAnteriores(anio: number, mes: number,PersonalId:number,PersonalLicenciaId:number) {
    console.log("PersonalId ", PersonalId)
    console.log("PersonaPersonalLicenciaIdlId ", PersonalLicenciaId)
    return this.http.get(`/api/carga-licencia/licencia_anteriores/${anio}/${mes}/${PersonalId}/${PersonalLicenciaId}`).pipe(
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getArchivosAnteriores(id:number, TipoSearch:string) {
    console.log("............. voy a buscar los archivos ")
    console.log("id ", id)
    console.log("TipoSearch ", TipoSearch)
    return this.http.get(`/api/file-upload/archivos_anteriores/${id}/${TipoSearch}`).pipe(
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getOptionsForLicenciaDrawer() {
    return this.http.get(`/api/carga-licencia/sepaga_getOptions`).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getImportacionesTelefoniaAnteriores(anio: number, mes: number) {
    return this.http.get(`/api/telefonia/importaciones_anteriores/${anio}/${mes}`).pipe(
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getTipoCuenta() {
    return this.http.get(`/api/liquidaciones/tipo_cuenta`).pipe(
      map((res: any) => res.data.list),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  isMobile(): boolean {
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  }

  constructor(private http: _HttpClient, private injector: Injector, @Inject(LOCALE_ID) public locale: string) { }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  getDefaultGridOptions(container: string, detailViewRowCount: number, xlsService: ExcelExportService | ExternalResource, utilService: AngularUtilService, parent: any, viewComponent: any): GridOption {
    return {
      asyncEditorLoading: false,
      autoEdit: false,
      autoCommitEdit: false,
      //    presets: { columns: [{ columnId: '', width: 0 }]},
      autoResize: {
        container,
        rightPadding: 1,    // defaults to 0
        bottomPadding: 45,  // defaults to 20
        //minHeight: 550,     // defaults to 180
        //minWidth: 250,      // defaults to 300
        //sidePadding: 10,
        //bottomPadding: 10
        resizeDetection: 'container',
      },
      // gridAutosizeColsMode: GridAutosizeColsMode.fitColsToViewport,

      contextMenu: {
        autoAdjustDrop: true,
        autoAlignSide: true,
        hideCloseButton: true,
        hideClearAllGrouping: false,
        hideCollapseAllGroups: false,
        hideCommandSection: false,
        hideCopyCellValueCommand: false,
        hideExpandAllGroups: false,
        hideExportCsvCommand: false,
        hideExportExcelCommand: false,
        hideExportTextDelimitedCommand: true,
        hideMenuOnScroll: true,
        hideOptionSection: false,
        iconCollapseAllGroupsCommand: 'fa fa-compress mdi mdi-arrow-collapse',
        iconExpandAllGroupsCommand: 'fa fa-expand mdi mdi-arrow-expand',
        iconClearGroupingCommand: 'fa fa-times mdi mdi-close',
        iconCopyCellValueCommand: 'fa fa-clone mdi mdi-content-copy',
        iconExportCsvCommand: 'fa fa-download mdi mdi-download',
        iconExportExcelCommand: 'fa fa-file-excel-o mdi mdi-file-excel-outline',
        iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
        showBulletWhenIconMissing: true,
      },
      headerMenu: {
        autoAlign: true,
        autoAlignOffset: 4,
        minWidth: 140,
        iconClearFilterCommand: 'fa fa-filter mdi mdi mdi-filter-remove-outline',
        iconClearSortCommand: 'fa fa-unsorted mdi mdi-swap-vertical',
        iconFreezeColumns: 'fa fa-thumb-tack mdi mdi-pin-outline',
        iconSortAscCommand: 'fa fa-sort-amount-asc mdi mdi-flip-v mdi-sort-ascending',
        iconSortDescCommand: 'fa fa-sort-amount-desc mdi mdi-flip-v mdi-sort-descending',
        iconColumnHideCommand: 'fa fa-times mdi mdi-close',
        iconColumnResizeByContentCommand: 'fa fa-arrows-h mdi mdi-arrow-expand-horizontal',
        hideColumnResizeByContentCommand: false,
        hideColumnHideCommand: false,
        hideClearFilterCommand: false,
        hideClearSortCommand: false,
        hideFreezeColumnsCommand: true,
        hideSortCommands: false
      },
      gridMenu: {
        iconCssClass: 'fa fa-bars mdi mdi-menu',
        iconClearAllFiltersCommand: 'fa fa-filter mdi mdi-filter-remove-outline',
        iconClearAllSortingCommand: 'fa fa-unsorted mdi mdi-swap-vertical',
        iconClearFrozenColumnsCommand: 'fa fa-times mdi mdi-pin-off-outline',
        iconExportCsvCommand: 'fa fa-download mdi mdi-download',
        iconExportExcelCommand: 'fa fa-file-excel-o mdi mdi-file-excel-outline',
        iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
        iconRefreshDatasetCommand: 'fa fa-refresh mdi mdi-sync',
        iconToggleFilterCommand: 'fa fa-random mdi mdi-flip-vertical',
        iconTogglePreHeaderCommand: 'fa fa-random mdi mdi-flip-vertical',
      },
      rowHeight: 28,
      //    headerRowHeight: 45,
      //    rowHeight: 45, // increase row height so that the ng-select fits in the cell
      //    autoHeight: true,    
      editable: true,
      enableCellMenu: true,
      enableCellNavigation: true,
      //    enableAutoResize: true,
      enableColumnPicker: true,
      //enableExcelCopyBuffer: true,
      enableExcelExport: true,
      externalResources: [xlsService],

      enableAutoTooltip: true,
      enableFiltering: false,
      enableRowSelection: true,
      enableGrouping: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableRowDetailView: true,
      rowDetailView: {
        // optionally change the column index position of the icon (defaults to 0)
        //columnIndexPosition: 0,

        // We can load the "process" asynchronously in 2 different ways (httpClient OR even Promise)
        process: (item: any) => { return new Promise((resolve) => { setTimeout(() => { resolve(item) }, 0) }) },
        //process: (item:any) => item,
        // process: (item) => this.http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // false by default, clicking anywhere on the row will open the detail view
        // when set to false, only the "+" icon would open the row detail
        // if you use editor or cell navigation you would want this flag set to false (default)
        useRowClick: true,

        // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
        // also note that the detail view adds an extra 1 row for padding purposes
        // so if you choose 4 panelRows, the display will in fact use 5 rows
        panelRows: detailViewRowCount,

        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        // expandableOverride: (row: number, dataContext: any) => (dataContext.rowId % 2 === 1),

        // Preload View Component
        //preloadComponent: RowDetailPreloadComponent,
        //preloadComponent: RowPreloadDetailComponent,

        // View Component to load when row detail data is ready
        viewComponent: viewComponent,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parent: parent
      },

      //    autoFitColumnsOnFirstLoad: true,
      enableAsyncPostRender: true, // for the Angular PostRenderer, don't forget to enable it
      asyncPostRenderDelay: 0,    // also make sure to remove any delay to render it

      params: {
        angularUtilService: utilService // provide the service to all at once (Editor, Filter, AsyncPostRender)
      },
      //showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        //leftFooterText: 'Prueba',
        //hideTotalItemCount: true,
        hideLastUpdateTimestamp: true,
        hideRowSelectionCount: true,
        metricTexts: {},
        //rightFooterText:'fin'

      },
    };
  }

  getPersonaMonotributo(year: number, month: number, personalId: number) {
    if (personalId == 0) return of([])

    return this.http.get<ResponseJSON<any[]>>(`api/personal/monotributo/${personalId}/${year}/${month}`).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  get(url: string) {
    return this.http.get<any>(url).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCols(url: string) {
    return this.http.get<any>(url).pipe(
      map((res: any) => {
        const mapped = res.data.map((col: Column) => {
          if(String(col.formatter)=='collectionFormatter')
            col.formatter = collectionFormatter

            if (String(col.formatter) == 'complexObject')
            col.formatter= Formatters.complexObject

          if (col.type == 'date')
            col.formatter = Formatters.dateEuro




          if (String(col.type) == 'currency' || String(col.type) == 'money') {
            col.formatter = Formatters.multiple
            col.params = { formatters: [Formatters.currency], thousandSeparator: '.', decimalSeparator: ',' }
            col.type = 'float'
            col.cssClass = 'text-right'
          }

          if (col.type == 'number') {
            col.formatter = Formatters.multiple
            col.params = { formatters: [] }
            col.cssClass = 'text-right'
          }

          if (col.type == 'object')
            col.type = FieldType.object

          return col
        });
        return res.data
      }),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  getAdelantos(year: number, month: number, personalID: string) {
    if (!month && !year) {
      return of([]);
    }
    if (personalID == "") personalID = "0"
    return this.http.get<ResponseJSON<any[]>>(`api/adelantos/${personalID}/${year}/${month}`).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonaResponsables(personalID: number, year: number, month: number) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http.get<ResponseJSON<any[]>>(`api/personal/responsables/${personalID}/${year}/${month}`).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonaSitRevista(personalID: number, year: number, month: number) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http.get<ResponseJSON<any[]>>(`api/personal/sitrevista/${personalID}/${year}/${month}`).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getIdentCode(identData: string, encTelNro: string): Observable<unknown> {
    return this.http.get<ResponseJSON<any>>(`mess/api/personal/ident`, { identData, encTelNro },{observe:'body', context: new HttpContext().set(ALLOW_ANONYMOUS, true)}).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  genIdentCode(data: string): Observable<unknown> {
    return this.http.get<ResponseJSON<any>>(`mess/api/personal/encode`, { data }).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }


  getLiquidaciones(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/list', parameter).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLiquidacionesBanco(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/banco/list', parameter).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getMovimientosBanco(filters: any) {
    console.log("pase por aca")
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/banco/listMovimientos', parameter).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLiquidacionesBancoAyudaAsistencial(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/banco/listAyudaAsistencial', parameter).pipe(
      map((res: any) => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getDescuentosMonotributo(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/impuestos_afip/list', parameter).pipe(
      map((res: any) => res.data),
      catchError(() => of([]))
    );

  }

  getPersonasResponsable(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/asistencia/personalxresp/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  getPersonasResponsableDesc(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/asistencia/personalxrespdesc/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }


  getPersonasAdelanto(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/adelantos/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  getPersonalCategoriaPendiente(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/categorias/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }
  getObjetivosPendAsis(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/objetivos-pendasis/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  getListObjetivoCarga(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/lista-permisocarga/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  getListCargaLicencia(filters: any, anio: any, mes: any) {
    const parameter = [filters, anio, mes]
    return this.http.post<ResponseJSON<any>>('/api/carga-licencia/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  
  getListHorasLicencia(filters: any, anio: any, mes: any) {
    const parameter = [filters, anio, mes]
    return this.http.post<ResponseJSON<any>>('/api/carga-licencia/listhoras', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  setchangehours(gridDataInsert: any) {
    return this.http.post<ResponseJSON<any>>('/api/carga-licencia/changehours', gridDataInsert).pipe(
      //tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  getTipoDocumentos(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/tipo-documento/list', parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([]))
    );

  }

  setAgregarRegistros(gridDataInsert: any, periodo: any) {
    const parameter = [periodo, gridDataInsert]
    this.notification.success('Respuesta', `Inicio insercion `);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/add', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setDeleteImportacion(deleteId: any, valuePeriodo: any) {
    const parameter = [deleteId, valuePeriodo]
    this.notification.success('Respuesta', `Inicio Borrado `);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/delete', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }


  setDeleteMovimiento(row: any) {
    const parameter = {
      persona_id: row.persona_id,
      banco_id: row.banco_id,
      envio_nro: row.envio_nro,
      tipocuenta_id: row.tipocuenta_id

    }
    //    this.notification.success('Respuesta', `Inicio Borrado `);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/deleteMovimiento', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setCambiarCategorias(filters: any) {
    const parameter = filters
    this.notification.success('Respuesta', `Inicio cambio de categoría`);

    return this.http.post<ResponseJSON<any>>('/api/categorias/cambiarCategorias', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  

  setmovimientosAutomaticos(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio Carga Mov Automatico`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/movimientosAutomaticos', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }


  setingresoPorAsistencia(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio Ingreso por Asistencia`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresoPorAsistencia', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }
  setingresoPorAsistenciaAdministrativosArt42(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio Ingreso por Licencias`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresoPorAsistenciaAdministrativosArt42', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setingresosCoordinadorDeCuenta(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio Ingreso coordinador de cuenta`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresosCoordinadorDeCuenta', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setdescuentoPorDeudaAnterior(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio descuentos por deduda anterior`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/descuentoPorDeudaAnterior', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setdescuentos(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio descuentos`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/descuentos', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  setmovimientoAcreditacionEnCuenta(anio: number, mes: number) {
    const parameter = { anio, mes }
    this.notification.success('Respuesta', `Inicio movimiento Acreditacion En Cuenta`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/movimientoAcreditacionEnCuenta', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  generaRecibos(anio: number, mes: number, fechaRecibo: Date) {
    const isUnique = false
    const parameter = { anio, mes, isUnique, fechaRecibo }
    console.log('parameter', parameter)
    this.notification.success('Respuesta', `Inicio generación de recibos`);

    return this.http.post<ResponseJSON<any>>('/api/recibos/generar', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  generaReciboUnico(anio: number, mes: number, personalId: number) {
    let isUnique = true
    const parameter = { anio, mes, personalId, isUnique }
    this.notification.success('Respuesta', `Inicio generación de recibo Unico`);

    return this.http.post<ResponseJSON<any>>('/api/recibos/generarunico', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  confirmaMovimientosBanco(selectedPeriod: any) {
    this.notification.success('Respuesta', `Inicio confirmación de movimientos bancarios`);
    const parameter = { selectedPeriod }
    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/confirmaMovimientosBanco', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  eliminaMovimientosBanco(banco_id: number) {
    const parameter = { banco_id }
    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/elimina/banco', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      catchError(() => of(''))

    )

  }


  getDescuentoByPeriodo(year: number, month: number, personaIdRel: number): Observable<ResponseDescuentos> {
    const emptyResponse: ResponseDescuentos = { RegistrosConComprobantes: 0, RegistrosSinComprobantes: 0, Registros: [] };
    if (!month || !year) {
      return of(emptyResponse);
    }
    const path = `/api/impuestos_afip/${year}/${month}` + (personaIdRel > 0 ? `/${personaIdRel}` : ``);
    return this.http.get<ResponseJSON<ResponseDescuentos>>(path).pipe(
      map((res: any) => res.data),
      catchError(() => of(emptyResponse))
    );
  }

  getTelefonos(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/telefonia/list', parameter).pipe(
      map((res: any) => res.data),
      catchError(() => of([]))
    );

  }

  getMessInfo() {
    const path = `/mess/api/chatbot/status`;
    return this.http.get(path).pipe(
      map((res: any) => res.data)
    );
  }

  getMessInfoDb() {
    const path = `/mess/api/info/dbstatus`;
    return this.http.get(path).pipe(
      map((res: any) => res.data)
    );
  }

  getChatBotDelay() {
    const path = `/mess/api/chatbot/delay`;
    return this.http.get(path).pipe(
      map((res: any) => res.data)
    );
  }

  setChatBotDelay(ms: number) {
    return this.http.post<ResponseJSON<any>>(`/mess/api/chatbot/delay`, { ms }).pipe(tap((res: ResponseJSON<any>) => this.response(res)));
  }

  addAdelanto(adelanto: { PersonalId: string; monto: number, anio:number,mes:number }) {
    return this.http.post<ResponseJSON<any>>(`api/adelantos`, adelanto).pipe(tap((res: ResponseJSON<any>) => this.response(res)));
  }

  delAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http
      .delete<ResponseJSON<any>>(`api/adelantos/${adelanto.PersonalId}`, adelanto)
      .pipe(tap((res: ResponseJSON<any>) => this.response(res)));
  }

  response(res: ResponseJSON<any>) {
    let tiempoConsido = ''
    if (res.ms)
      tiempoConsido = `<BR> Tiempo consumidio ${formatNumber(Number(res.ms) / 1000, this.locale, '1.2-2')} segundos`
    this.notification.success('Respuesta', `${res.msg} ${tiempoConsido}`);
  }

  addAsistencia(asistencia: any) {
    return this.http.post<ResponseJSON<any>>(`api/asistencia/agregarasistencia`, asistencia).pipe(map(res => res.data));
  }

  validaGrilla(anio: number, mes: number, ObjetivoId: number) {
    return this.http.post<ResponseJSON<any>>(`api/asistencia/validargrilla`, { anio, mes, ObjetivoId }).pipe(tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }


  setRecibo(parameter: any) {
    console.log('parameters', parameter)
    return this.http.post<ResponseJSON<any>>('/api/recibos/config', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  getValuesRecibo(prev: boolean) {
    let parameter = ""
    return this.http.get<ResponseJSON<any>>(`/api/recibos/config/${prev}`, parameter).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([])),

    )

  }

  getLicencia(anio: number, mes: number, PersonalId: number, PersonalLicenciaId: number) {

    return this.http.get<ResponseJSON<any>>(`/api/carga-licencia/${anio}/${mes}/${PersonalId}/${PersonalLicenciaId}`).pipe(
      map((res: { data: any; }) => res.data),
      catchError(() => of([])),

    )

  }

  setLicencia(vals: any) {
    return this.http.post<ResponseJSON<any>>(`/api/carga-licencia`, vals).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      //catchError(() => of([])),
    )

  }

  deleteLicencia(vals: any) {
    return this.http.delete<ResponseJSON<any>>(`/api/carga-licencia`,  vals ).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      catchError(() => of([])),

    )

  }

  deleteCliente(vals: any) {
    return this.http.delete<ResponseJSON<any>>(`/api/clientes`,  vals ).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      catchError(() => of([])),

    )

  }

  deleteObjetivos(vals: any) {
    return this.http.delete<ResponseJSON<any>>(`/api/objetivos`,  vals ).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      catchError(() => of([])),

    )

  }

  deleteArchivosLicencias(deleteId: any) {
    const parameter = [deleteId]
    this.notification.success('Respuesta', `Inicio Borrado `);

    return this.http.delete<ResponseJSON<any>>('/api/carga-licencia/deleteArchivo', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
      catchError(() => of([])),
    )

  }

  setPersonalAndGroupDelete(userId: any, ObjetivoId: any) {
    let parameter = { userId, ObjetivoId }
    return this.http.post<ResponseJSON<any>>('/api/personalobjetivo/setPersonalAndGroupDelete', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }
  setPersonaAndGroup(userId: any, ObjetivoId: any) {
    let parameter = { userId, ObjetivoId }
    return this.http.post<ResponseJSON<any>>('/api/personalobjetivo/setPersonaAndGroup', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  getValuePersona(objetivo: number) {
    return this.http.get<ResponseJSON<any>>(`/api/personalobjetivo/getpersonal/${objetivo}`).pipe(
      map((res: { data: any; }) => res.data.recordsArray),
      catchError(() => of([])),

    )
  }

  getValueObjetivo(user: number) {
    return this.http.get<ResponseJSON<any>>(`/api/personalobjetivo/getObjetivo/${user}`).pipe(
      map((res: { data: any; }) => res.data.recordsArray),
      catchError(() => of([])),

    )
  }

  downloadReciboPrueba(parameter: any) {
    console.log('parameters', parameter)
    return this.http.post<ResponseJSON<any>>('/api/recibos/prueba', parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )

  }

  addObjCustodia(custodia: any) {
    return this.http.post<ResponseJSON<any>>('/api/custodia/add', custodia).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  updateObjCustodia(custodia: any, custodiaId: any) {
    return this.http.post<ResponseJSON<any>>(`/api/custodia/update/${custodiaId}`, custodia).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  addCliente(cliente: any) {
    return this.http.post<ResponseJSON<any>>('/api/clientes/add', cliente).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  addObjetivo(objetivo: any) {
    return this.http.post<ResponseJSON<any>>('/api/objetivos/add', objetivo).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  updateCliente(cliente: any, ClienteId: any) {
    return this.http.post<ResponseJSON<any>>(`/api/clientes/update/${ClienteId}`, cliente).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  updateObjetivo(objetivo: any, ObjetivoId: any) {
    return this.http.post<ResponseJSON<any>>(`/api/objetivos/update/${ObjetivoId}`, objetivo).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }


  ayudaAsistencialRechazar(parameter: any,) {
    return this.http.post<ResponseJSON<any>>(`/api/ayuda-asistencial/rechazar`, parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  ayudaAsistencialAprobar(parameter: any,) {
    return this.http.post<ResponseJSON<any>>(`/api/ayuda-asistencial/aprobar`, parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  updateRowAyudaAsistencial(parameter: any,) {
    return this.http.post<ResponseJSON<any>>(`/api/ayuda-asistencial/updaterow`, parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  ayudaAsistencialAddCuota(parameter: any,) {
    return this.http.post<ResponseJSON<any>>(`/api/ayuda-asistencial/addcuota`, parameter).pipe(
      tap((res: ResponseJSON<any>) => this.response(res)),
    )
  }

  addAyudaAsistencial(parameter: any) {
    return this.http.post<ResponseJSON<any>>(`api/ayuda-asistencial/addpres`, parameter).pipe(map(res => res.data));
  }

  getAyudaAsitencialByPersonalId(personalId: any) {
    if (personalId == "") personalId = "0"
    return this.http.post<ResponseJSON<any>>(`api/ayuda-asistencial/personal`, personalId).pipe(map(res => res.data));
  }

}

export function doOnSubscribe<T>(onSubscribe: () => void): (source: Observable<T>) => Observable<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();

      return source;
    });
  };
}


