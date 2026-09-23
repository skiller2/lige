import { Component, DestroyRef, ViewChild, resource, inject, signal, computed } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  of,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { DescuentoJSON } from '../../../shared/schemas/ResponseJSON';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { AuditOutline, BankOutline, CloudDownloadOutline, FileProtectOutline } from '@ant-design/icons-angular/icons';
import type { Options, Selections } from '../../../shared/schemas/filtro';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { LoadingService } from '@delon/abc/loading';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { DownloadService } from '../../../services/download.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  ComprobantesPendientesErroresComponent,
  ComprobantesPendientesErroresData,
  FallidoPendiente,
} from './comprobantes-pendientes-errores/comprobantes-pendientes-errores.component';

@Component({
  imports: [
    SHARED_IMPORTS,
  ],
  template: `<a app-down-file title="Comprobante {{ mes() }}/{{ anio() }}"
    httpUrl="api/impuestos_afip/{{anio()}}/{{mes()}}/0/{{item.PersonalId}}?original=true"
           style="float:right;padding-right: 5px;"><span class="pl-xs" nz-icon nzType="download"></span></a>`
})

export class CustomDescargaComprobanteComponent {
  item: any;
  anio: any
  mes: any
}


@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  imports: [ SHARED_IMPORTS, NzAffixModule, NzIconModule,
    FiltroBuilderComponent, NzUploadModule,
    AsyncPipe, DetallePersonaComponent, PersonalSearchComponent
  ],
  styleUrls: ['./impuesto-afip.component.less'],
  providers: [AngularUtilService,
    provideNzIconsPatch([BankOutline, AuditOutline, FileProtectOutline, CloudDownloadOutline])]
})
export class ImpuestoAfipComponent {
  url = '/api/impuestos_afip';
  url_forzado = '/api/impuestos_afip/forzado';
  
  files: NzUploadFile[] = [];
  selectedPersonalId: string | null = null;
  personaForzada: { PersonalCUITCUILCUIT?: string | null } = {};
  tableLoading$ = new BehaviorSubject(false);
  detailViewRowCount = 9;
  columnDefinitions: Column[] = []
  gridOptions!: GridOption;
  gridDataLen = 0

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  startFilters: Selections[] = []

  PersonalId = signal<number>(0);
  visibleDetalle = signal<boolean>(false)
  toggle = signal<boolean>(false);
  accionEnCurso = signal<string | null>(null);
  listOptions = signal<listOptionsT>({ filtros: [], sort: null, })
  periodo = signal<Date|null>(null);
  anio = computed(() => { 
    const f = this.periodo();
    return f ? f.getFullYear() : 0
  })
  mes = computed(() => { 
    const f = this.periodo();
    return f ? f.getMonth()+1 : 0
  })

  readonly router = inject(Router)
  private readonly loadingSrv = inject(LoadingService);
  private readonly modal = inject(NzModalService);
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private settingService = inject(SettingsService)
  private downloadService = inject(DownloadService)
  private notification = inject(NzNotificationService)

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.anio, mes: this.mes })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }


  columns$ = this.apiService.getCols('/api/impuestos_afip/cols').pipe(map((cols: Column<any>[]) => {
    let mapped = cols.map((col: any) => {
      if (col.id == 'monto') {
        col.asyncPostRender = this.renderAngularComponent.bind(this)
        col.params = { angularUtilService: this.angularUtilService, component: CustomDescargaComprobanteComponent }
      }
      return col
    });
    return mapped
  }));

  listOptionsChange(options: any) {
    this.listOptions.set(options);
  }

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        if (params.anio && params.mes) 
          response = await firstValueFrom(
            this.apiService.getDescuentosMonotributo({ anio: params.anio, mes: params.mes, options: params.options, toggle: this.toggle })
            .pipe(map((data: any) => { return data.list }))
          )
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },
    defaultValue: []
  });

  listaDescuentos = resource({
    params: () => ({ anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      let response = null
      
      try {
        response = await firstValueFrom(this.apiService.getDescuentoByPeriodo(params.anio, params.mes, 0)
          .pipe( map((items: any) => {
            return {
              RegistrosConComprobantes: items.RegistrosConComprobantes,
              RegistrosSinComprobantes: items.RegistrosSinComprobantes,
            };
          }))
        )
      } catch (_e) { }

      return response;
    },
    defaultValue: null
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


    const user: any = this.settingService.getUser()
      this.startFilters = [
        { index: 'GrupoActividadNumero', condition: 'AND', operator: '=', value: user.GrupoActividad.map((grupo: any) => grupo.GrupoActividadNumero).join(';') },
        { index: 'PersonalExencionCUIT', condition: 'AND', operator: '=', value: '0' },
        { index: 'monto', condition: 'AND', operator: '=', value: 'null' }
      ]


  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;
      this.periodo.set(new Date(Number(anio), Number(mes) - 1, 1))
    }, 1);
  }

  handleChange({ file, fileList }: NzUploadChangeParam): void {

    if (file.status === 'done') {
      this.listaDescuentos.reload();
    }
  }


  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('monto', this.angularGrid)
      columnTotal('montodescuento', this.angularGrid)
    })
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const PersonalId = this.angularGrid.dataView.getItemByIdx(rowNum)?.PersonalId
      this.PersonalId.set(PersonalId)

    } else {
      this.PersonalId.set(0)
    }
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'monotributos-listado',
      format: 'xlsx'
    });
  }

  /**
   * Pide la cantidad de monotributos a procesar y recién con la confirmación del usuario
   * dispara el envío del lote al banco.
   */
  async enviarSolicitudPagoPatagonia() {
    if (!this.anio() || !this.mes()) return
    if (this.accionEnCurso()) return

    let previo: any = null
    this.accionEnCurso.set('solicitudPagoPrevio')
    this.loadingSrv.open({ type: 'spin', text: '' })
    try {
      previo = await firstValueFrom(
        this.apiService.previoSolicitudPagoPatagonia(this.anio(), this.mes(), this.listOptions())
      )
    } catch (_e) {
    } finally {
      this.loadingSrv.close()
      this.accionEnCurso.set(null)
    }

    if (!previo) return

    if (!previo.cantidad) {
      this.modal.info({
        nzTitle: 'Enviar solicitud de pago al Banco Patagonia',
        nzContent: `No hay monotributos pendientes de solicitud en el período ${previo.mes}/${previo.anio}.`
      })
      return
    }

    // Si el banco contesta con error el interceptor muestra el detalle en el modal de APIs
    // externas, y lo abre recién cuando esta confirmación terminó de cerrarse.
    this.modal.confirm({
      nzTitle: 'Enviar solicitud de pago al Banco Patagonia',
      nzContent: `Período ${previo.mes}/${previo.anio}: se van a procesar ${previo.cantidad} monotributo(s). ¿Confirma?`,
      nzOkText: 'Ejecutar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.ejecutarAccion('solicitudPago', () =>
        firstValueFrom(this.apiService.enviarSolicitudPagoPatagonia(this.anio(), this.mes(), this.listOptions()))
      )
    })
  }

  /** Consulta el estado de los lotes del período; si alguna referencia falla, el interceptor muestra la respuesta del banco. */
  async consultarEstadoPagoPatagonia() {
    await this.ejecutarAccion('estadoPago', () =>
      firstValueFrom(this.apiService.consultarEstadoPagoPatagonia(this.anio(), this.mes()))
    )
  }

  /**
   * Trae de la API el comprobante de monotributo de la persona seleccionada. Si ya estaba en la
   * base el back no consulta y se descarga el documento igual; si la API no lo devuelve, el
   * interceptor muestra su respuesta en el modal de APIs externas.
   */
  async obtenerComprobanteMonotributo() {
    const PersonalId = this.PersonalId()
    if (!PersonalId) return

    const anio = this.anio()
    const mes = this.mes()

    await this.ejecutarAccion('comprobantePersona', async () => {
      await firstValueFrom(this.apiService.obtenerComprobanteMonotributo(anio, mes, PersonalId))
      this.descargarComprobante(anio, mes, PersonalId)
    })
  }

  /** Baja el PDF guardado, el mismo documento que ofrece la columna de importe de la grilla. */
  private descargarComprobante(anio: number, mes: number, PersonalId: number) {
    this.downloadService.downloadFile(
      'get', `/api/impuestos_afip/${anio}/${mes}/0/${PersonalId}?original=true`, null, null)
  }

  // ---------------------------------------------------------------------------------------------
  // Comprobantes pendientes por chunks
  //
  // Es un proceso largo (una consulta al banco por persona), así que en lugar de un solo request
  // se llama al back de a TAMANIO_CHUNK personas hasta que no queden pendientes:
  // - Los que fallan vuelven en `fallidos` y se mandan en `excluir` en la llamada siguiente, para
  //   que el back no los vuelva a tomar y el ciclo termine.
  // - Mientras corre se muestra el avance con un botón para cancelar. Lo ya procesado queda
  //   grabado: volver a apretar el botón sigue con lo que falte.
  // - Al terminar se avisa una sola vez: notificación si todo salió bien, o la tabla de errores
  //   (ComprobantesPendientesErroresComponent) si alguno falló.
  // ---------------------------------------------------------------------------------------------

  /** Personas por llamada al back. */
  private readonly TAMANIO_CHUNK = 20

  /** Avance del proceso; null cuando no está corriendo. */
  progresoPendientes = signal<{ procesados: number; total: number } | null>(null)
  porcentajePendientes = computed(() => {
    const p = this.progresoPendientes()
    return p?.total ? Math.round((p.procesados * 100) / p.total) : 0
  })
  /** Lo revisa el ciclo antes de pedir el chunk siguiente. */
  private cancelarPendientes = false

  constructor() {
    // Si se sale de la pantalla no se piden más chunks
    inject(DestroyRef).onDestroy(() => (this.cancelarPendientes = true))
  }

  async obtenerComprobantesPendientes() {
    if (!this.anio() || !this.mes()) return
    if (this.accionEnCurso()) return

    // El período se fija al empezar: cambiarlo en pantalla no afecta al proceso en curso
    const anio = this.anio()
    const mes = this.mes()
    const excluir: number[] = []
    const fallidos: FallidoPendiente[] = []
    let procesados = 0
    let conComprobante = 0
    let cancelado = false

    this.cancelarPendientes = false
    this.accionEnCurso.set('comprobantesPendientes')
    this.progresoPendientes.set({ procesados: 0, total: 0 })
    try {
      while (true) {
        if (this.cancelarPendientes) {
          cancelado = true
          break
        }
        const chunk = await firstValueFrom(
          this.apiService.obtenerComprobantesPendientes(anio, mes, this.TAMANIO_CHUNK, excluir)
        )
        procesados += chunk.procesados
        conComprobante += chunk.conComprobante
        fallidos.push(...chunk.fallidos)
        excluir.push(...chunk.fallidos.map((f: FallidoPendiente) => f.PersonalId))
        this.progresoPendientes.set({ procesados, total: procesados + chunk.restantes })

        // Sin procesados no hay avance posible: se corta aunque informe restantes
        if (!chunk.restantes || !chunk.procesados) break
      }
    } catch (_e) {
      // El interceptor ya mostró el error del chunk (configuración, token, …). Lo procesado en
      // los chunks anteriores quedó grabado y se informa igual abajo.
    } finally {
      this.progresoPendientes.set(null)
      this.accionEnCurso.set(null)
    }

    this.informarPendientes(anio, mes, procesados, conComprobante, fallidos, cancelado)

    try {
      this.gridData.reload()
      this.listaDescuentos.reload()
    } catch (_e) { }
  }

  cancelarObtenerPendientes() {
    this.cancelarPendientes = true
  }

  /** Aviso único al final de todos los chunks. */
  private informarPendientes(anio: number, mes: number, procesados: number, conComprobante: number,
    fallidos: FallidoPendiente[], cancelado: boolean) {
    if (!procesados) {
      if (!cancelado) this.notification.info('Respuesta', `No hay comprobantes pendientes en ${mes}/${anio}`)
      return
    }

    const mensaje = `${cancelado ? 'Cancelado. ' : ''}Se procesaron ${procesados} pendientes de ${mes}/${anio}: `
      + `${conComprobante} comprobante(s) obtenido(s), ${fallidos.length} con error`

    if (!fallidos.length) {
      this.notification.success('Respuesta', mensaje)
      return
    }

    this.modal.create<ComprobantesPendientesErroresComponent, ComprobantesPendientesErroresData>({
      nzTitle: 'Comprobantes pendientes con error',
      nzContent: ComprobantesPendientesErroresComponent,
      nzData: { mensaje, fallidos },
      nzCentered: true,
      nzWidth: 'min(1000px, calc(100vw - 32px))',
      nzFooter: null,
    })
  }

  private async ejecutarAccion(accion: string, fn: () => Promise<unknown>) {
    if (!this.anio() || !this.mes()) return
    if (this.accionEnCurso()) return

    this.accionEnCurso.set(accion)
    this.loadingSrv.open({ type: 'spin', text: '' })
    try {
      await fn()
    } catch (_e) {
    } finally {
      this.loadingSrv.close()
      this.accionEnCurso.set(null)
    }
    // Las recargas no deben propagar: si esto rechaza, el nzOnOk que lo llamó deja el
    // modal de confirmación abierto y trabado con el botón en loading.
    try {
      this.gridData.reload()
      this.listaDescuentos.reload()
    } catch (_e) { }
  }

  public forzadoUploadData(cuit: string | null | undefined, montoText: string | null | undefined) {
    return {
      anio: this.anio(),
      mes: this.mes(),
      cuit: cuit ?? '',
      monto: this.parseMontoForzado(montoText),
    };
  }

  private parseMontoForzado(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  closeDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(false)
  }

}
