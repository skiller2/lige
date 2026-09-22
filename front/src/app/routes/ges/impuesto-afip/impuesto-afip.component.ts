import { Component, ViewChild, resource, inject, signal, computed } from '@angular/core';
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
import { AsyncPipe, JsonPipe } from '@angular/common';
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
    AsyncPipe, JsonPipe, DetallePersonaComponent, PersonalSearchComponent
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
  /** Respuesta del Banco Patagonia, tal cual la devuelve el servicio, para mostrarla en el modal. */
  respuestaApiResultado = signal<any[]>([]);
  respuestaApiTitulo = signal<string>('');
  /** Motivo del rechazo (el msg del envelope), que se muestra arriba del JSON. */
  respuestaApiMensaje = signal<string>('');
  respuestaApiVisible = signal<boolean>(false);
  /** Respuesta que quedó para mostrar una vez que se cierre el modal de confirmación. */
  private respuestaApiPendiente: { titulo: string; mensaje: string; resultado: any } | null = null;
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

    this.modal.confirm({
      nzTitle: 'Enviar solicitud de pago al Banco Patagonia',
      nzContent: `Período ${previo.mes}/${previo.anio}: se van a procesar ${previo.cantidad} monotributo(s). ¿Confirma?`,
      nzOkText: 'Ejecutar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.ejecutarSolicitudPagoPatagonia()
    }).afterClose.subscribe(() => {
      // El modal con la respuesta se abre recién cuando el de confirmación terminó de
      // destruirse: si se abren superpuestos, el de arriba queda bloqueado por el overlay
      // del de abajo y no se puede cerrar. El setTimeout espera a que el overlay se libere.
      if (!this.respuestaApiPendiente) return
      const { titulo, mensaje, resultado } = this.respuestaApiPendiente
      this.respuestaApiPendiente = null
      setTimeout(() => this.mostrarRespuestaApi(titulo, resultado, mensaje))
    })
  }

  private async ejecutarSolicitudPagoPatagonia() {
    await this.ejecutarAccion('solicitudPago', async () => {
      try {
        const data: any = await firstValueFrom(
          this.apiService.enviarSolicitudPagoPatagonia(this.anio(), this.mes(), this.listOptions())
        )
        this.respuestaApiPendiente = {
          titulo: `Solicitud de pago enviada - ${this.mes()}/${this.anio()}`,
          mensaje: '',
          resultado: this.bloquesRespuestaApi(data)
        }
      } catch (error: any) {
        // Ante un rechazo se guarda la respuesta del banco para mostrarla al cerrarse la confirmación.
        // El msg del envelope es el motivo del rechazo; el data, la respuesta cruda del banco.
        const msg = error?.error?.msg
        this.respuestaApiPendiente = {
          titulo: `Error al enviar la solicitud de pago - ${this.mes()}/${this.anio()}`,
          mensaje: Array.isArray(msg) ? msg.join(' ') : (msg ?? error?.message ?? String(error)),
          resultado: this.bloquesRespuestaApi(error?.error?.data ?? error?.error ?? { error: error?.message ?? String(error) })
        }
      }
    })
  }

  /** Consulta el estado de los lotes del período y muestra la respuesta cruda del banco en un modal. */
  async consultarEstadoPagoPatagonia() {
    await this.ejecutarAccion('estadoPago', async () => {
      const resultados = await firstValueFrom(this.apiService.consultarEstadoPagoPatagonia(this.anio(), this.mes()))
      this.mostrarRespuestaApi(
        `Estado de pago Banco Patagonia - ${this.mes()}/${this.anio()}`,
        resultados ?? []
      )
    })
  }

  /**
   * Muestra en el modal la respuesta de la API. Acepta tanto el array de resultados por
   * referencia como una respuesta suelta (un error), que se envuelve para mostrarla igual.
   */
  /**
   * Arma los bloques del modal para una llamada a la API: el body que se mandó y lo que contestó
   * el banco. Si no viene el request (un error anterior al envío) muestra solo lo que haya.
   */
  private bloquesRespuestaApi(data: any) {
    if (data?.request)
      return [
        { titulo: 'Request enviado', status: 0, ok: true, respuesta: data.request },
        { titulo: 'Respuesta del banco', status: data.status ?? 0, ok: data.status >= 200 && data.status < 300, respuesta: data.respuesta }
      ]

    // Un error anterior al envío no trae request ni respuesta. ClientException manda el
    // extended vacío ('') cuando no se le pasa nada, y ahí no hay JSON que mostrar:
    // el motivo ya se ve en el alert de arriba.
    if (data === '' || data == null) return []

    return [{ titulo: 'Detalle', status: 0, ok: false, respuesta: data }]
  }

  private mostrarRespuestaApi(titulo: string, resultado: any, mensaje = '') {
    this.respuestaApiTitulo.set(titulo)
    this.respuestaApiMensaje.set(mensaje)
    this.respuestaApiResultado.set(
      Array.isArray(resultado) ? resultado : [{ ReferenciaPago: '', status: 0, ok: false, respuesta: resultado }]
    )
    this.respuestaApiVisible.set(true)
  }

  /**
   * Trae de la API el comprobante de monotributo de la persona seleccionada. Si ya estaba en la
   * base el back no consulta y se descarga el documento igual; si la API no lo devuelve, su
   * respuesta se muestra en el mismo modal que usan las demás acciones del banco.
   */
  async obtenerComprobanteMonotributo() {
    const PersonalId = this.PersonalId()
    if (!PersonalId) return

    const anio = this.anio()
    const mes = this.mes()

    await this.ejecutarAccion('comprobantePersona', async () => {
      try {
        await firstValueFrom(this.apiService.obtenerComprobanteMonotributo(anio, mes, PersonalId))
        this.descargarComprobante(anio, mes, PersonalId)
      } catch (error: any) {
        const msg = error?.error?.msg
        this.mostrarRespuestaApi(
          `Comprobante de monotributo - ${mes}/${anio}`,
          this.bloquesRespuestaApi(error?.error?.data ?? error?.error ?? { error: error?.message ?? String(error) }),
          Array.isArray(msg) ? msg.join(' ') : (msg ?? error?.message ?? String(error))
        )
      }
    })
  }

  /** Baja el PDF guardado, el mismo documento que ofrece la columna de importe de la grilla. */
  private descargarComprobante(anio: number, mes: number, PersonalId: number) {
    this.downloadService.downloadFile(
      'get', `/api/impuestos_afip/${anio}/${mes}/0/${PersonalId}?original=true`, null, null)
  }

  /**
   * Trae los comprobantes del período que quedaron pendientes (con solicitud enviada y sin
   * documento). Es un proceso largo: el back devuelve el resumen y solo los que fallaron, que
   * se muestran en el modal.
   */
  async obtenerComprobantesPendientes() {
    const anio = this.anio()
    const mes = this.mes()

    await this.ejecutarAccion('comprobantesPendientes', async () => {
      try {
        const data: any = await firstValueFrom(this.apiService.obtenerComprobantesPendientes(anio, mes))
        if (data?.resultados?.length)
          this.mostrarRespuestaApi(
            `Comprobantes pendientes con error - ${mes}/${anio}`,
            data.resultados,
            `${data.conError} de ${data.procesados} pendientes no devolvieron comprobante`
          )
      } catch (error: any) {
        const msg = error?.error?.msg
        this.mostrarRespuestaApi(
          `Comprobantes pendientes - ${mes}/${anio}`,
          this.bloquesRespuestaApi(error?.error?.data ?? error?.error ?? { error: error?.message ?? String(error) }),
          Array.isArray(msg) ? msg.join(' ') : (msg ?? error?.message ?? String(error))
        )
      }
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
