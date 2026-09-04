import { ChangeDetectionStrategy, Component, inject, input, model, OnInit, resource, signal } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { AngularGridInstance, AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Selections } from '../../../shared/schemas/filtro';

@Component({
  selector: 'app-table-orden-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, FiltroBuilderComponent],
  templateUrl: './table-orden-venta.html',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableOrdenVentaComponent implements OnInit {

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 9;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

  // Órdenes seleccionadas (selección múltiple)
  ordenesSeleccionadas = model<any[]>([]);

  // Cambia al guardar el detalle: la fila modificada quedó vieja y hay que releer la lista
  refreshGrid = input<number>(0);

  // Por omisión no se muestran las órdenes ya facturadas
  startFilters = signal<Selections[]>([
    { index: 'Estado', condition: 'AND', operator: '<>', value: 'Facturado', closeable: true }
  ])

  // Filtros y orden de la grilla
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  private apiService = inject(ApiService)
  public angularUtilService = inject(AngularUtilService)

  // Columnas configuradas desde el backend (controlador de orden de venta, el mismo de carga asistencia)
  columns = toSignal(this.apiService.getCols('/api/orden-venta/cols-ordenes'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async () => {
      const response = await firstValueFrom(this.apiService.getListOrdenesVenta(this.listOptions()));
      return response.list;
    },
    defaultValue: []
  }).value;

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerOrdenVenta',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );

    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    // Columna de check: la edición masiva trabaja sobre varias órdenes a la vez
    this.gridOptions.enableCheckboxSelector = true;
    this.gridOptions.selectionOptions = { selectActiveRow: false };
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });
  }

  async handleSelectedRowsChanged(e: any): Promise<void> {
    const selectedRows = e.detail.args.rows;
    const selectedData: any[] = [];

    selectedRows.forEach((rowIndex: number) => {
      const row = this.angularGrid.slickGrid.getDataItem(rowIndex);
      if (row) selectedData.push(row);
    });

    this.ordenesSeleccionadas.set(selectedData);
  }
}
