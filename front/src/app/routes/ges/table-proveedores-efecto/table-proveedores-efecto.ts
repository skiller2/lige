import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-table-proveedores-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-proveedores-efecto.html',
  standalone: true
})
export class TableProveedoresEfectoComponent {

  refreshGrid = input<number>(0);
  proveedorIdFilter = input<number>(0);
  // Efecto seleccionado en la grilla (o null). Lo consume el padre para los botones consultar/modificar.
  efectoSelected = output<any | null>();
  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  startFilters = signal<Selections[]>([])
  startFiltersReady = signal(false)
  filtroVisible = signal(true)

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)

  private applyProveedorFilter = effect(() => {
    const id = this.proveedorIdFilter()
    if (id > 0) {
      this.filtroVisible.set(false)
      setTimeout(() => this.filtroVisible.set(true))
    }
  })

  columns = toSignal(this.apiService.getCols('/api/efecto/colsProveedores'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async ({ params }) => {

      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const response = await firstValueFrom(this.searchService.getEfectoProveedores(params.options))
        return response || []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  async ngOnInit(): Promise<void> {
    this.initializeGridOptions();
    this.startFiltersReady.set(true)
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerEfectoProveedores',
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

  listOptionsChange(options: any): void {
    this.listOptions.set(options);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('StockStock', this.angularGrid)
    });
  }

  handleSelectedRowsChanged(e: any): void {
    const rows: number[] = e.detail.args.rows ?? []
    const item = rows.length === 1 ? this.angularGrid.dataView.getItem(rows[0]) : null
    this.efectoSelected.emit(item ?? null)
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-efecto-proveedores',
      format: 'xlsx'
    });
  }
}
