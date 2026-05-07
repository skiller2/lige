import { Component, input, resource, signal } from '@angular/core';
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

@Component({
  selector: 'app-table-deposito-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-deposito-efecto.html',
  standalone: true
})
export class TableDepositoEfectoComponent {

  refreshGrid = input<number>(0);
  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  startFilters = signal<Selections[]>([
    { index: 'StockStock', condition: 'AND', operator: '>', value: '0', closeable: true },
  ])

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }

  columns = toSignal(this.apiService.getCols('/api/efecto/colsDeposito'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async ({ params }) => {
      return await firstValueFrom(this.searchService.getEfectoDeposito(params.options))
    },
    defaultValue: []
  })

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerEfectoDeposito',
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

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-efecto-deposito',
      format: 'xlsx'
    });
  }
}
