import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, resource } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '@delon/abc/loading';
import { SettingsService } from '@delon/theme';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { EventoLogDetalleComponent } from "../evento-log-detalle/evento-log-detalle";
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableBloqueadasComponent } from '../table-bloqueadas/table-locked '

@Component({
  selector: 'app-evento-log',
  templateUrl: './evento-log.html',
  styleUrl: './evento-log.less',
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, EventoLogDetalleComponent,TableBloqueadasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EventoLogComponent {
  periodo = signal(new Date());
  anio = computed(() => this.periodo()?.getFullYear());
  mes = computed(() => this.periodo()?.getMonth() + 1);
  logCodigo = signal<number>(0);
  visibleDetalle = model<boolean>(false);
  controlAccesoDisabled = signal(false)
  fechaBio = signal(new Date())
  gridOptions!: GridOption;
  startFilters: any[] = [];
  selectedPeriod = { year: 0, month: 0 };
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });

  private apiService = inject(ApiService);
  private searchService = inject(SearchService);
  // private readonly loadingSrv = inject(LoadingService);
  private settingsService = inject(SettingsService);
  private angularGrid!: AngularGridInstance;
  private angularUtilService = inject(AngularUtilService);
  private readonly detailViewRowCount = 1;
  private excelExportService = new ExcelExportService();
  private notification = inject(NzNotificationService)

  columns$ = this.apiService.getCols('/api/evento-log/cols');
  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      return await firstValueFrom(this.apiService.getListEventoLog(params.options))
    },
    defaultValue: []
  });

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    // this.gridOptions.fullWidthRows = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    const now = new Date()
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1)
    this.startFilters = [
      { index: 'FechaInicio', condition: 'AND', operator: '>=', value: primerDiaMes, closeable: true }
    ]

    this.selectedDate()
    // this.settingsService.setLayout('collapsed', true)
  }

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail

    this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata)

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      this.angularGrid.slickGrid.invalidate()
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  updateItemMetadata(previousItemMetadata: any) {
    return (rowNumber: number) => {
      const item = this.angularGrid.dataView.getItem(rowNumber)
      let meta: any = { cssClasses: '', columns: {} }
      if (typeof previousItemMetadata === 'object')
        meta = { columns: {}, ...previousItemMetadata(rowNumber) }

      if (item?.Descripcion === 'Error')
        meta.columns = { ...meta.columns, Descripcion: { cssClass: 'cell-error' } }
      else if (item?.Descripcion === 'Completado')
        meta.columns = { ...meta.columns, Descripcion: { cssClass: 'cell-completado' } }

      return meta
    }
  }

  selectedDate() {
    const now = new Date(); //date
    const anio =
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear();
    const mes =
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;
    this.periodo.set(new Date(anio, mes - 1, 1))
    this.selectedPeriod = { year: anio, month: mes }
  }

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const row = this.angularGrid.dataView.getItemByIdx(rowNum)

      this.logCodigo.set(Number(row?.EventoLogCodigo))
    } else {
      this.logCodigo.set(0)
    }
  }

  listOptionsChange(options: any) {
    this.listOptions.set(options);
  }

  openDrawerforDetalle(): void {
    this.visibleDetalle.set(true)
  }

  async leerControlAcceso() {
    if (!this.fechaBio()) {
      this.notification.warning(`Advertencia`, `Ingrese un periodo`);
      return
    }
    const anio = (this.fechaBio() as Date).getFullYear()
    const mes = (this.fechaBio() as Date).getMonth() + 1
    this.controlAccesoDisabled.set(true)
    try {
      await firstValueFrom(this.searchService.getListaAsistenciaControAcceso(1102, anio, mes))
      this.notification.success('Finalización', 'Existosa');

    } catch (error) { }
    this.controlAccesoDisabled.set(false)
  }

}