import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  input,
  inject,
  resource
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom, map } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import {
  AngularGridInstance,
  AngularUtilService,
  SlickGrid,
  GridOption,
  Column
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-table-orden-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, NzAffixModule],
  templateUrl: './table-orden-venta.html',
  styleUrl: './table-orden-venta.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableOrdenVentaComponent implements OnInit {

  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 9;

  excelExportService = new ExcelExportService();

  hiddenColumnIds: string[] = [];

  private apiService = inject(ApiService)
  public angularUtilService = inject(AngularUtilService)

  columns = toSignal(
    this.apiService.getCols('/api/orden-venta/cols').pipe(
      map((cols) => {
        this.hiddenColumnIds = cols
          .filter((col: any) => col.showGridColumn === false)
          .map((col: Column) => col.id as string);

        return cols;
      }))
    , { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ objetivoId: this.objetivoId(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      if (!params.objetivoId || !params.anio || !params.mes) return []

      const response = await firstValueFrom(
        this.apiService.getListOrdenVenta(params.objetivoId, params.anio, params.mes)
      );
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
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });

    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds);
    }
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'orden-venta',
      format: 'xlsx'
    });
  }
}
