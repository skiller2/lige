import { Inject, Injectable, Injector, LOCALE_ID } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { DescuentoJSON, ResponseDescuentos, ResponseJSON } from '../shared/schemas/ResponseJSON';
import { Observable, catchError, combineLatest, debounceTime, defer, filter, map, of, tap, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { error } from 'pdf-lib';
import { DownloadService } from './download.service';
import { formatNumber } from '@angular/common';
import { ExternalResource, Formatters } from '@slickgrid-universal/common';
import { AngularUtilService, Column, GridAutosizeColsMode, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export/*';


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  getTipoMovimiento() {
    return this.http.get(`/api/liquidaciones/tipo_movimiento`).pipe(
      map(res => res.data.list.map((row: { tipo_movimiento_id: any; des_movimiento: any; }) => ( { value: row.tipo_movimiento_id, label: row.des_movimiento } ))),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  isMobile():boolean { 
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  }

  constructor(private http: _HttpClient, private injector: Injector, @Inject(LOCALE_ID) public locale: string) { }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  getDefaultGridOptions(detailViewRowCount: number, xlsService: ExcelExportService | ExternalResource, utilService: AngularUtilService, parent: any, viewComponent: any): GridOption {
    return {
      asyncEditorLoading: false,
      autoEdit: false,
      autoCommitEdit: false,
      //    presets: { columns: [{ columnId: '', width: 0 }]},
      autoResize: {
        container: '.gridContainer',
        rightPadding: 1,    // defaults to 0
        bottomPadding: 45,  // defaults to 20
        //minHeight: 550,     // defaults to 180
        //minWidth: 250,      // defaults to 300
        //sidePadding: 10,
        //bottomPadding: 10        
      },
      gridAutosizeColsMode: GridAutosizeColsMode.fitColsToViewport,
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
      enableExcelCopyBuffer: true,
      enableExcelExport: true,
      registerExternalResources: [xlsService],
      enableAutoTooltip: true,
      enableFiltering: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableRowDetailView: true,
      rowDetailView: {
        // optionally change the column index position of the icon (defaults to 0)
        columnIndexPosition: 0,

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
      showCustomFooter: false, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        leftFooterText: 'Prueba',
        hideTotalItemCount: true,
        hideLastUpdateTimestamp: true,
        hideRowSelectionCount: true,
        metricTexts: {},
        rightFooterText:'fin'

      },
      createFooterRow: false,
      showFooterRow: false,
    };
  }

  getPersonaMonotributo(year: number, month: number, personalId: number) {
    if (personalId == 0) return of([])

    return this.http.get<ResponseJSON<any[]>>(`api/personal/monotributo/${personalId}/${year}/${month}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  get(url: string) {
    return this.http.get<any>(url).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getCols(url: string) {
    return this.http.get<any>(url).pipe(
      map((res) => {
        const mapped = res.data.map((col: Column) => {
          if (col.type == 'date')
            col.formatter = Formatters.dateEuro

          if (String(col.type) == 'currency' || String(col.type) == 'money') {
            col.formatter = Formatters.multiple
            col.params= { formatters: [Formatters.currency, Formatters.alignRight] }

          }
          
          if (col.type == 'number') {
            col.formatter = Formatters.multiple
            col.params= { formatters: [Formatters.alignRight] }
          }

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
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getPersonaResponsables(year: number, month: number, personalID: string) {
    if (!personalID || !month || !year) {
      return of([]);
    }
    return this.http.get<ResponseJSON<any[]>>(`api/personal/responsables/${personalID}/${year}/${month}`).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLiquidaciones(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/list',parameter).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }

  getLiquidacionesBanco(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('api/liquidaciones/banco/list',parameter).pipe(
      map(res => res.data),
      catchError((err, caught) => {
        console.log('Something went wrong!');
        return of([]);
      })
    );
  }


  getDescuentosMonotributo(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/impuestos_afip/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  getPersonasAdelanto(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/adelantos/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  getPersonalCategoriaPendiente(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/categorias/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }
  getObjetivosPendAsis(filters: any) {
    const parameter = filters
    return this.http.post<ResponseJSON<any>>('/api/objetivos-pendasis/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  setCambiarCategorias(filters: any) {
    const parameter = filters
    this.notification.success('Respuesta', `Inicio cambio de categoría`);

    return this.http.post<ResponseJSON<any>>('/api/categorias/cambiarCategorias', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setmovimientosAutomaticos(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio Carga Mov Automatico`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/movimientosAutomaticos', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setingresoPorAsistencia(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio Ingreso por Asistencia`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresoPorAsistencia', parameter).pipe(
      tap(res => this.response(res)),
    )

  }
  setingresoPorAsistenciaAdministrativosArt42(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio Ingreso por Asistencia Administrativos`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresoPorAsistenciaAdministrativosArt42', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setingresosCoordinadorDeCuenta(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio Ingreso coordinador de cuenta`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/ingresosCoordinadorDeCuenta', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setdescuentoPorDeudaAnterior(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio descuentos por deduda anterior`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/descuentoPorDeudaAnterior', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setdescuentos(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio descuentos`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/descuentos', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  setmovimientoAcreditacionEnCuenta(anio:number,mes:number) {
    const parameter = {anio,mes}
    this.notification.success('Respuesta', `Inicio movimiento Acreditacion En Cuenta`);

    return this.http.post<ResponseJSON<any>>('/api/liquidaciones/movimientoAcreditacionEnCuenta', parameter).pipe(
      tap(res => this.response(res)),
    )

  }

  getDescuentoByPeriodo(year: number, month: number, personaIdRel: number): Observable<ResponseDescuentos> {
    const emptyResponse: ResponseDescuentos = { RegistrosConComprobantes: 0, RegistrosSinComprobantes: 0, Registros: [] };
    if (!month || !year) {
      return of(emptyResponse);
    }
    const path = `/api/impuestos_afip/${year}/${month}` + (personaIdRel > 0 ? `/${personaIdRel}` : ``);
    return this.http.get<ResponseJSON<ResponseDescuentos>>(path).pipe(
      map(res => res.data),
      catchError(() => of(emptyResponse))
    );
  }

  getTelefonos(filters: any) {
    const parameter = filters

    return this.http.post<ResponseJSON<any>>('/api/telefonia/list', parameter).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );

  }

  addAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http.post<ResponseJSON<any>>(`api/adelantos`, adelanto).pipe(tap(res => this.response(res)));
  }

  delAdelanto(adelanto: { PersonalId: string; monto: number }) {
    return this.http
      .delete<ResponseJSON<any>>(`api/adelantos/${adelanto.PersonalId}`, adelanto)
      .pipe(tap(res => this.response(res)));
  }

  response(res: ResponseJSON<any>) {
    let tiempoConsido = ''
    if (res.ms)
      tiempoConsido = `<BR> Tiempo consumidio ${formatNumber(Number(res.ms) / 1000, this.locale, '1.2-2')} segundos`
    this.notification.success('Respuesta', `${res.msg} ${tiempoConsido}`);
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
