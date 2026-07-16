import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column} from 'angular-slickgrid';
import { ExternalResource} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-table-inaes-recibos',
  templateUrl: './table-inaes-recibos.html',
  styleUrls: ['./table-inaes-recibos.less'],
  imports: [SHARED_IMPORTS, CommonModule, NzAffixModule, FiltroBuilderComponent, ],
  providers: [AngularUtilService],
  standalone: true
})
export class TableINAESRecibosComponent {

  private angularGrid!: AngularGridInstance;
  private readonly detailViewRowCount = 1;
  private excelExportService = new ExcelExportService();
  private textExportService:ExternalResource|TextExportService = new TextExportService();
  gridOptions!: GridOption;
  
  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)

  listOptions = signal<listOptionsT>({ filtros: [], sort: null })
  startFilters = signal<Selections[]>([])
  periodo = signal<Date>(new Date())

  columns = toSignal(this.apiService.getCols('/api/inaes/recibos/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        // const response = await firstValueFrom(this.searchService.getEfectoPersonal(params.options))
        // return response || []
        return []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  ngOnInit(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent);
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
    //Habilitando exportación de .CSV
    this.gridOptions.textExportOptions = { exportWithFormatter: true}
    this.gridOptions.externalResources = [this.textExportService as ExternalResource]

  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      // columnTotal('StockStock', this.angularGrid)
    });
  }
 
  exportGrid(): void {
    (this.textExportService as TextExportService).exportToFile({
      delimiter: ';',
      filename: 'inaes-recibos',
      format: 'csv'
    });
  }
} 