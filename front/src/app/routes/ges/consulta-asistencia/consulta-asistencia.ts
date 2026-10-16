import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AngularGridInstance, AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { LoadingService } from '@delon/abc/loading';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Selections } from '../../../shared/schemas/filtro';

@Component({
  selector: 'app-consulta-asistencia',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, FiltroBuilderComponent],
  templateUrl: './consulta-asistencia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaAsistenciaComponent {
  angularGrid!: AngularGridInstance
  gridOptions!: GridOption
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()

  listOptions = signal<listOptionsT>({ filtros: [], sort: null })
  startFilters = signal<Selections[]>([])

  private readonly angularUtilService = inject(AngularUtilService)
  private readonly apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  columns = toSignal(this.apiService.getCols('/api/registro-asistencia/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getListRegistrosAsistencia({ options: params.options }))
      } catch (_e) { }
      this.loadingSrv.close()

      return response || []
    },
    defaultValue: []
  })

  readonly calculandoVectores = signal(false)

  // Botón de la tuerca: inicia el cálculo de los vectores faciales en el back. El mensaje de la
  // respuesta (o el error) lo muestra el interceptor HTTP
  async iniciarCalculoVectoresFaciales() {
    if (this.calculandoVectores()) return
    this.calculandoVectores.set(true)
    try {
      await firstValueFrom(this.apiService.iniciarCalculoVectoresFaciales())
    } catch (_e) { }
    this.calculandoVectores.set(false)
  }

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.forceFitColumns = true
  }

  angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }
}
