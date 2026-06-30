import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, input, resource, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { firstValueFrom, map } from 'rxjs';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';

@Component({
  selector: 'app-personal-inconsistencias',
  templateUrl: './personal-inconsistencias.html',
  styleUrls: ['./personal-inconsistencias.less'],
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalInconsistenciasComponent {
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  rows: number[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  hiddenColumnIds: string[] = [];
  anio = input<number>(0)
  mes = input<number>(0)
  reload = input<number>(0)

  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  startFilters = signal<Selections[]>([]);

  columnDefinitions: Column[] = []
  descuentoId = signal<number>(0)
  periodo = input<any>(null)
  personalId = signal<number>(0)

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService= inject(AngularUtilService)

  private readonly loadingSrv = inject(LoadingService)
  private notification = inject(NzNotificationService)

  columns = toSignal(
    this.apiService.getCols('/api/personal/inconsistencias-cols').pipe(map((cols: Column<any>[]) => {
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols.map(col =>
        col.id === 'ApellidoNombre' ? { ...col, asyncPostRender: this.renderApellidoNombreComponent.bind(this) } : col
      )
    }))
  , { initialValue: [] as Column[] })

  gridData = resource({
      params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes(), reload: this.reload() }),
      loader: async ({ params }) => {
          let response:any[] = []
          this.loadingSrv.open({ type: 'spin', text: '' })
          try {
              response = await firstValueFrom(this.searchService.getPersonalInconsistencias({ options: params.options }));
          } catch (_e) { }
          this.loadingSrv.close()

          return response || [];
      },

      defaultValue: []
  });


  async ngOnInit() {

      this.gridOptions = this.apiService.getDefaultGridOptions('.gridInconsistencias', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      this.gridOptions.enableRowDetailView = false
      this.gridOptions.enableAutoSizeColumns = true
      this.gridOptions.fullWidthRows = true
      this.gridOptions.showFooterRow = true
      this.gridOptions.createFooterRow = true

  }

  handleSelectedRowsChanged(e: any): void {
      if (e.detail.args.changedSelectedRows.length == 1) {
      } else {
          this.personalId.set(0)
      }
  }

  async angularGridReady(angularGrid: any) {
      this.angularGrid = angularGrid.detail
      this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
          totalRecords(this.angularGrid, 'ApellidoNombre')
          // columnTotal('importe', this.angularGrid)
          // columnTotal('cuotanro', this.angularGrid)
          // columnTotal('cantcuotas', this.angularGrid)
          // columnTotal('importetotal', this.angularGrid)
      })
      if (this.apiService.isMobile())
          this.angularGrid.gridService.hideColumnByIds([])
  }

  onAddorUpdate(_e: any) {
      this.gridData.reload()
  }

  renderApellidoNombreComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
      const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)

      let PersonalId = dataContext.PersonalId
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, link: '/ges/personal/listado', params: { PersonalId: PersonalId }, detail: cellNode.innerText })
      componentOutput.componentRef.instance.detail = dataContext[colDef.field as string]

      cellNode.replaceChildren(componentOutput.domElement)
  }
}