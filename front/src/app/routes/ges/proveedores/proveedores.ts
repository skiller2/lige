import { Component, viewChild, inject, signal, model, computed, effect, ChangeDetectionStrategy, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { LoadingService } from '@delon/abc/loading';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.less',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProveedoresComponent {
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  
  listOptions = signal<listOptionsT>({filtros: [], sort: null});
  startFilters = signal<Selections[]>([])
  ProveedorId = signal<number>(0)
  tabIndex = signal<number>(1)

  private readonly angularUtilService = inject(AngularUtilService)
  private readonly searchService = inject(SearchService)
  private readonly apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService);

  columns = toSignal(this.apiService.getCols('/api/proveedores/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions()}),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getProveedores({options: params.options}));
        console.log('response: ', response);
        
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },

    defaultValue: []
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const ProveedorId = this.angularGrid.dataView.getItemByIdx(rowNum)?.id
      this.ProveedorId.set(ProveedorId)

    } else {
      this.ProveedorId.set(0)
    }
  }
}