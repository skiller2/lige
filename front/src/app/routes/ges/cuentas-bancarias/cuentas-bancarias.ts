import { Component, inject, model, signal, resource, computed } from '@angular/core';
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
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { BankOutline, } from '@ant-design/icons-angular/icons';
import { PersonalBancoDrawerComponent } from '../personal-banco-drawer/personal-banco-drawer.component';
import { CuentasBancariasImportacionMasivaComponent } from '../cuentas-bancarias-importacion-masiva/cuentas-bancarias-importacion-masiva'

@Component({
    selector: 'app-cuentas-bancarias',
    templateUrl: './cuentas-bancarias.html',
    styleUrl: './cuentas-bancarias.less',
    providers: [AngularUtilService, provideNzIconsPatch([BankOutline, ])],
    imports: [SHARED_IMPORTS, CommonModule, NzIconModule, FiltroBuilderComponent
      , PersonalBancoDrawerComponent, CuentasBancariasImportacionMasivaComponent],
})
export class CuentasBancariasComponent {
  periodo = signal<Date>(new Date())
  periodoSR = signal<Date>(new Date())
  periodoIT = signal<Date>(new Date())
  tabIndex = signal<number>(0)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  startFilters = signal<Selections[]>([])
  personalId = signal<number>(0)
  visiblePersonalBanco = model<boolean>(false)
  visibleDatosBanco = model<boolean>(false)
  anio = computed(() => this.periodo()? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()? this.periodo().getMonth()+1 : 0)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  columns = toSignal(this.apiService.getCols('/api/cuentas-bancarias/cols/'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), periodo: this.periodo(), sitRevistaPeriodo: this.periodoSR(), liqmaperiodo: this.periodoIT()  }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getCuentasBancarias({
          options: params.options, 
          periodo: params.periodo, 
          sitRevistaPeriodo: params.sitRevistaPeriodo, 
          liqmaperiodo: params.liqmaperiodo
        }));
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
      totalRecords(angularGrid, 'PersonalCUITCUILCUIT')
      // columnTotal('ImporteTranferido', angularGrid)

    })
    if (this.apiService.isMobile())
      angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const PersonalId = this.angularGrid.dataView.getItemByIdx(rowNum)?.PersonalId
      this.personalId.set(PersonalId)

    } else {
      this.personalId.set(0)
    }
  }

  onAddorUpdate(_e: any) {
    this.gridData.reload()
  }

  openDrawerforConsultBanco(): void {
    this.visibleDatosBanco.set(true)
  }

  openDrawerforNewPersonalBanco(): void {
    this.visiblePersonalBanco.set(true)
  }
  
}