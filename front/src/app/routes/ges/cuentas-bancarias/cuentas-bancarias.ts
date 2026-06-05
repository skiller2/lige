import { Component, inject, model, signal, resource } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, firstValueFrom, } from 'rxjs';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { AngularGridInstance, AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-cuentas-bancarias',
    templateUrl: './cuentas-bancarias.html',
    styleUrl: './cuentas-bancarias.less',
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent ],
})
export class CuentasBancariasComponent {
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  periodo = model(new Date())
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  startFilters = signal<Selections[]>([])

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  columns = toSignal(this.apiService.getCols('/api/cuentas-bancarias/cols/'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
          response = await firstValueFrom(this.apiService.getCuentasBancarias(params.options));
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },

    defaultValue: []
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true
    
    // this.settingsService.setLayout('collapsed', true)
  }

    async angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid
        angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(angularGrid, 'Apellido Nombre')
            // columnTotal('ImporteFactura', angularGrid)
            // columnTotal('CantidadHorasExcedente', angularGrid)
            // columnTotal('ImporteHorasExcedente', angularGrid)
            // columnTotal('CantidadKmExcedente', angularGrid)
            // columnTotal('ImporteKmExcedente', angularGrid)
            // columnTotal('CantidadModulos', angularGrid)
            // columnTotal('ImportePeaje', angularGrid)

        })
        if (this.apiService.isMobile())
            angularGrid.gridService.hideColumnByIds([])
    }
  
}