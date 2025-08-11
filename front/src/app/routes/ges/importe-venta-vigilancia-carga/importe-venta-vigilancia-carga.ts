import { ChangeDetectionStrategy, Component, effect, inject,input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, Formatters, GridOption, SlickGrid, GroupTotalFormatters, Aggregators } from 'angular-slickgrid';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-importe-venta-vigilancia-carga',
  imports: [
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    NzUploadModule,
    FileUploadComponent],
  templateUrl: './importe-venta-vigilancia-carga.html',
  styleUrl: './importe-venta-vigilancia-carga.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImporteVentaVigilanciaCarga { 

  DocumentoTipoCodigo = 'IMPVENV'

  anio = input<any>(null)
  mes = input<any>(null)
  fecha: Date = new Date()
  periodo: Date = new Date()
  files: NzUploadFile[] = []
  formChange$ = new BehaviorSubject('')
  filesChange$ = new BehaviorSubject('')
  uploading$ = new BehaviorSubject({loading:false,event:null})

  angularGrid!: AngularGridInstance
  gridObj!: SlickGrid
  gridOptions!: GridOption
  detailViewRowCount = 9

  gridDataImport$ = new BehaviorSubject([])

  gridDataLen = 0
  gridDataImportLen = 0
  toggle = false

  excelExportService = new ExcelExportService()

  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)

  columns$ = this.apiService.getCols('/api/importe-venta-vigilancia/cols-import').pipe(map((cols) => {
    return cols
  }));

  
constructor() {
  effect(() => {
    const year = this.anio();
    const month = this.mes();
    if (year && month) {
      this.formChange$.next('changed');
    }
  });
}

  $importacionesAnteriores = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getImportacionesOrdenesDeVentaAnteriores(
          this.anio(), this.mes(), this.DocumentoTipoCodigo
        )
        .pipe()
    })
  )

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.fullWidthRows = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


     // Escuchar cambios en ngForm.files
       this.ngForm.get('files')?.valueChanges.subscribe((filesValue: any) => {

        if(filesValue.length > 0){
          console.log('Cambió files:', filesValue);
          firstValueFrom(this.apiService.handleXLSUpload(filesValue, this.anio(), this.mes()))
        }
    
    //this.filesChange$.next(filesValue);
  });

}



fb = inject(FormBuilder)
ngForm = this.fb.group({  files: [] })

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      //columnTotal('ImporteTotal', this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

  }

  uploadChange(event: any) {
    switch (event.type) {
      case 'start':
        this.uploading$.next({ loading: true, event })
        this.gridDataImport$.next([])
        this.gridDataImportLen = 0
        
        break;
      case 'progress':

        break;
      case 'error':
        const Error = event.file.error
        if (Error.error.data?.list) {
          this.gridDataImport$.next(Error.error.data?.list)
          this.gridDataImportLen = Error.error.data?.list?.length
        }
        this.uploading$.next({ loading:false,event })
        break;
      case 'success':
        const Response = event.file.response
        this.gridDataImport$.next([])
        this.gridDataImportLen = 0
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)        
        break
      default:
        break;
    }

  }

}
