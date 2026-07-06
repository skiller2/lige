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
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';

@Component({
    selector: 'app-inaes',
    templateUrl: './inaes.html',
    styleUrl: './inaes.less',
    // encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService, ExcelExportService],
    imports: [SHARED_IMPORTS, FiltroBuilderComponent, FileUploadComponent],
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
  startFilters = signal<Selections[]>([])
  files = signal<any[]>([])
  fileUploadComponent = viewChild.required(FileUploadComponent);

  readonly router = inject(Router)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService);

  columns = toSignal(this.apiService.getCols('/api/inaes/cols'), { initialValue: [] as Column[] })

  // gridData = resource({
  //   params: () => ({ options: this.listOptions() }),
  //   loader: async ({ params }) => {
  //     const res = await firstValueFrom(this.apiService.getINAESAltasBajas({ options: params.options })
  //       .pipe(map(data => { return data })));
  //     return res;
  //   },
  //   defaultValue: []
  // });

  effect1 = effect(async () => {
    if(!this.files().length) return
    console.log('files: ', this.files());
    try {

      this.loadingSrv.open({ type: 'spin', text: '' })

        this.gridDataImport.set([])
        const res = await firstValueFrom(this.apiService.getINAESAltasBajas({ options: this.listOptions(), files: this.files()})
        .pipe(map(data => { return data })));

      //   try {
      //     await firstValueFrom(this.apiService.importXLSImporteVenta(filesValue, this.anio(), this.mes()))
      //     this.formChange$.next('changed');
      //     this.fileUploadComponent().DeleteFileByExporterror(filesValue)
      //   } catch (e: any) {
      //     this.fileUploadComponent().DeleteFileByExporterror(filesValue)
      //     if (e.error?.data?.list) {
      //       this.gridDataImport.set(e.error.data.list)
      //     }
      //     this.uploading$.next({ loading: false, event: null })
      //   }
        this.loadingSrv.close()
      
    } catch (error) {
      
    }
    
    
    // this.gridDataImport.set([])
    // const fileUploadComponent = this.fileUploadComponent().files
  })

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true

    this.startFilters.set([{ index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true },])
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    // if (this.hiddenColumnIds.length > 0) {
    //   this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    // }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'INAES-altas',
      format: 'xlsx'
    });
  }
}