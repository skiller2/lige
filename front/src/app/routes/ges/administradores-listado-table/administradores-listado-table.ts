import { Component, inject, signal, resource, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { firstValueFrom } from 'rxjs';
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

@Component({
  selector: 'app-administradores-listado-table',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './administradores-listado-table.html',
  styleUrls: ['./administradores-listado-table.less'],
  standalone: true
})
export class AdministradoresListadoTableComponent {

  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  private readonly loadingSrv = inject(LoadingService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)

  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  administradorId = model<number>(0)

  columns = toSignal(this.apiService.getCols('/api/administradores/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.setListAdministradores({ options: params.options }));
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
      '.gridContainerAdministradores',
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
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });

    this.angularGrid.slickGrid.onClick.subscribe((_e: any, args: { row: number }) => {
    });
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const AdministradorId = this.angularGrid.dataView.getItemByIdx(rowNum)?.id || 0
      this.administradorId.set(AdministradorId)

    } else {
      this.administradorId.set(0)
    }
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-administradores',
      format: 'xlsx'
    });
  }
} 