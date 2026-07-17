import { Component, effect, viewChild, computed, input, model, signal, inject, resource } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { map, firstValueFrom } from 'rxjs';
import { Selections } from '../../../shared/schemas/filtro';
import { ApiService } from '../../../services/api.service';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { toSignal } from '@angular/core/rxjs-interop';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Router } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableINAESRecibosComponent } from '../table-inaes-recibos/table-inaes-recibos'
// icons
// import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
// import { FileExcelFill } from '@ant-design/icons-angular/icons';


@Component({
    selector: 'app-inaes',
    templateUrl: './inaes.html',
    styleUrl: './inaes.less',
    // encapsulation: ViewEncapsulation.None,
    imports: [SHARED_IMPORTS, FiltroBuilderComponent, TableINAESRecibosComponent],
    providers: [AngularUtilService, ExcelExportService,] 
    
})
export class INAESComponent {
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataImport = signal<any[]>([]);
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  loadingExport = signal<boolean>(false)
  startFilters = signal<Selections[]>([])
  hiddenColumnIds: string[] = [];
  showColumnIds: string[] = [];

  readonly router = inject(Router)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService);
  private notification = inject(NzNotificationService)

  columns = toSignal(this.apiService.getCols('/api/inaes/altas-bajas/cols')
    .pipe(map((cols) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      this.showColumnIds = cols.map((col: Column) => col.id as string);
      
      return cols;
    })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      const res = await firstValueFrom(this.apiService.getINAESAltasBajas({ options: params.options })
        .pipe(map(data => { return data })));
      this.loadingSrv.close()
      return res;
    },
    defaultValue: []
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    // this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true
    this.gridOptions.enableExcelExport = false

    this.startFilters.set([{ index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true },])
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  async exportGrid(filter:string) {
    this.loadingExport.set(true)
    
    //Configuro el filtro
    let sitRevista:number[] = []
    switch (filter) {
      case 'altas':
        //ACTIVOS (2), LICENCIA (10), ASOCIADO EN TRAMITE (12) 
        sitRevista = [2,10,12]
        break;
      case 'bajas':
        //BAJA (3)
        sitRevista = [3]
        break;
    
      default:
        this.notification.warning('Advertencia', `Error al intenetar exportar.`);
        this.loadingExport.set(false)
        return
    }

    //Filtro los datos
    let dataExport:any[] = await this.gridData.value().filter(
      (row: any) => (sitRevista.includes(row.PersonalSituacionRevistaSituacionId))
    )

    if (!dataExport.length) {
      this.notification.warning('Advertencia', `No se encontraron ${filter}.`);
      this.loadingExport.set(false)
      return
    }
    this.gridData.value.set(dataExport)

    //Muestro todas la columnas
    if (this.hiddenColumnIds.length > 0) 
      this.angularGrid.gridService.showColumnByIds(this.showColumnIds)
    
    await this.excelExportService.exportToExcel({
      filename: `INAES-${filter}`,
      format: 'xlsx',
    });
    this.gridData.reload()

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0)
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)

    this.loadingExport.set(false)
  }
}