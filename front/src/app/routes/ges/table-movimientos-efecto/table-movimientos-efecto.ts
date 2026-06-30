import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
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
  selector: 'app-table-movimientos-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-movimientos-efecto.html',
  standalone: true
})
export class TableMovimientosEfectoComponent {

  refreshGrid = input<number>(0);
  movimientoCodigoFilter = input<number>(0);
  comprobanteSelected = output<number | null>();
  private angularGrid!: AngularGridInstance;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  filtersReady = signal(false)
  startFilters = signal<Selections[]>([])
  filtroVisible = signal(true)

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)

  // Al volver del alta de un movimiento, la grilla queda filtrada por el código recién agregado.
  private applyMovimientoFilter = effect(() => {
    const id = this.movimientoCodigoFilter()
    if (id > 0) {
      this.startFilters.set([
        { index: 'MovimientoStockCodigo', condition: 'AND', operator: '=', value: String(id), closeable: true },
      ])
      this.filtroVisible.set(false)
      setTimeout(() => this.filtroVisible.set(true))
    }
  })

  columns = toSignal(this.apiService.getCols('/api/efecto/colsMovimientos'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const response = await firstValueFrom(this.searchService.getEfectoMovimientos(params.options ?? { filtros: [], sort: null }))
        return response || []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerEfectoMovimientos',
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
    if (!this.filtersReady()) this.filtersReady.set(true);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('CantidadEfectos', this.angularGrid)
    });
  }

  handleSelectedRowsChanged(e: any): void {
    const rows: number[] = e.detail.args.rows ?? []
    if (rows.length === 1) {
     const item = this.angularGrid.dataView.getItem(rows[0])
      this.comprobanteSelected.emit(item?.MovimientoStockCodigo ?? null)
    } else {
      this.comprobanteSelected.emit(null)
    }
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-efecto-movimientos',
      format: 'xlsx'
    });
  }
}
