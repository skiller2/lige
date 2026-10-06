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

@Component({
  selector: 'app-table-parametro-general',
  standalone: true,
  imports: [SHARED_IMPORTS, FiltroBuilderComponent],
  templateUrl: './table-parametro-general.html',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableParametroGeneralComponent implements OnInit {

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 9;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

  // Parámetros seleccionados (selección múltiple)
  parametrosSeleccionados = model<any[]>([]);

  // Cambia al guardar o dar de baja: la lista quedó vieja y hay que releerla
  refreshGrid = input<number>(0);

  // Filtros y orden de la grilla
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  private apiService = inject(ApiService)
  public angularUtilService = inject(AngularUtilService)

  columns = toSignal(this.apiService.getCols('/api/parametro-general/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async ({ params }) => {
      const response = await firstValueFrom(this.apiService.getListParametrosGenerales(params.options));
      return response.list;
    },
    defaultValue: []
  }).value;

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerParametroGeneral',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );

    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.enableCheckboxSelector = true;
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

  // Limpia la selección de la grilla
  clearSelection(): void {
    if (this.angularGrid?.slickGrid) {
      this.angularGrid.slickGrid.setSelectedRows([]);
    }
    this.parametrosSeleccionados.set([]);
  }

  async handleSelectedRowsChanged(e: any): Promise<void> {
    const selectedRows = e.detail.args.rows;
    const selectedData = selectedRows.map((r: any) => this.angularGrid.slickGrid.getDataItem(r).ParametroGeneralCodigo)
    this.parametrosSeleccionados.set(selectedData)
  }
}
