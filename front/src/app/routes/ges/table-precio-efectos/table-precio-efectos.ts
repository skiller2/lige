import { Component, ChangeDetectionStrategy, OnInit, inject, model, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-table-precio-efectos',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzAffixModule],
  templateUrl: './table-precio-efectos.html',
  styleUrl: './table-precio-efectos.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablePrecioEfectosComponent implements OnInit {

  // Se usa para forzar el refresh de la grilla
  refreshPrecios = model<number>(0)

  // Fila seleccionada (para modificar el valor)
  precioSeleccionado = model<any | null>(null)

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 9;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

  // Filtros iniciales: precios vigentes a la fecha del día
  startFilters = signal<Selections[]>([])

  // Filtros y orden de la grilla
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  private apiService = inject(ApiService)
  public angularUtilService = inject(AngularUtilService)

  // Columnas de la grilla (configuradas desde backend)
  columns = toSignal(
    this.apiService.getCols('/api/precio-efectos/cols'),
    { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshPrecios() }),
    loader: async () => {
      const response = await firstValueFrom(this.apiService.getListPrecioEfectos(this.listOptions()));
      return response.list;
    },
    defaultValue: []
  }).value;

  ngOnInit(): void {
    this.initializeGridOptions();

    // Por defecto se muestran los precios vigentes al día de hoy
    // const hoy = new Date()
    // hoy.setHours(0, 0, 0, 0)
    // this.startFilters.set([
    //   { index: 'FechaDesde', condition: 'AND', operator: '<=', value: hoy, closeable: true },
    //   { index: 'FechaHasta', condition: 'AND', operator: '>=', value: hoy, closeable: true }
    // ]);
  }

  // Configuración base de la grilla
  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerPrecioEfectos',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );

    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
  }

  // Evento cuando la grilla está lista
  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    // Actualiza el total de registros
    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });
  }

  // Selección de fila en la grilla
  handleSelectedRowsChanged(e: any): void {
    const rows: number[] = e.detail.args.rows ?? []
    const row = rows.length === 1 ? this.angularGrid.slickGrid.getDataItem(rows[0]) : null
    this.precioSeleccionado.set(row ?? null)
  }

  // Exporta la grilla a Excel
  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-precio-efectos',
      format: 'xlsx'
    });
  }
}
