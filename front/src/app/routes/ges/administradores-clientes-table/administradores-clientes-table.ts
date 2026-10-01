

import { Component, computed, signal, resource, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, firstValueFrom } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

// interface ListOptions {
//   filtros: any[];
//   extra: any;
//   sort: any;
// }

@Component({
  selector: 'app-administradores-clientes-table',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './administradores-clientes-table.html',
  styleUrls: ['./administradores-clientes-table.less'],
  standalone: true
})
export class AdministradoresClientesTableComponent {

  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private dataAngularGrid: any[] = [];
  private personalEstudios: any[] = [];
  private excelExportService = new ExcelExportService();
  private readonly loadingSrv = inject(LoadingService)
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)

  columns = toSignal(this.apiService.getCols('/api/administradores/cols-clientes'), { initialValue: [] as Column[] })

  gridData = resource({
      params: () => ({ options: this.listOptions() }),
      loader: async ({ params }) => {
        let response = []
        this.loadingSrv.open({ type: 'spin', text: '' })
        try {
          const res = await firstValueFrom(this.apiService.setListAdministradoresClientes({ options: params.options }));
          response = res.list;
        } catch (error) {}
        
        this.loadingSrv.close()
        return response || [];
      },
      defaultValue: []
    });

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerAdministradoresClientes',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
  }

  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

    this.angularGridEdit.slickGrid.onClick.subscribe((_e: any, args: { row: number }) => {
    });
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-administradores-clientes',
      format: 'xlsx'
    });
  }
} 