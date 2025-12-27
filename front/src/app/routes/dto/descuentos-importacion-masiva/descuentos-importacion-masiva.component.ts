import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { FormBuilder, FormArray } from '@angular/forms';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { LoadingService } from '@delon/abc/loading';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"


@Component({
    selector: 'app-descuentos-importacion-masiva-drawer',
    templateUrl: './descuentos-importacion-masiva.component.html',
    styleUrl: './descuentos-importacion-masiva.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, NzUploadModule, FileUploadComponent],
    providers: [AngularUtilService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescuentosImportacionMasivaComponent {
    gridDataLen = 0
    gridDataImportLen = 0
    uploading$ = new BehaviorSubject({loading:false,event:null});
    gridDataImport$ = new BehaviorSubject([]);
    private readonly loadingSrv = inject(LoadingService);
    fb = inject(FormBuilder)
    anio = input<number>(0)
    mes = input<number>(0)
    formChange$ = new BehaviorSubject('');
    fecha: Date = new Date()
    periodo: Date = new Date()
    angularGrid!: AngularGridInstance;
    gridOptionsPer!: GridOption;
    gridOptionsObj!: GridOption;
    gridData: any;
    gridObj!: SlickGrid;
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService();
    fileUploadComponent = viewChild.required(FileUploadComponent);
    formAltaDesc = this.fb.group({
        DescuentoId:0, tableName:'', files: [[]]
    })

    constructor(
        private apiService: ApiService,
        private searchService: SearchService,
        private angularUtilService : AngularUtilService,
    ) {
      effect(async() => { 
        const tableName = this.tableName()
        this.formAltaDesc.get('DescuentoId')?.reset()
      })


      effect(() => {
        const currentAnio = this.anio()
        const currentMes = this.mes()
        if (currentAnio > 0 && currentMes > 0) {
          this.formChange$.next('anio-mes-changed')
        }
      })
    }

    $optionsTipo = this.searchService.getDecuentosTipoOptions();
    $optionsTable = this.searchService.getDescuentoTableOptions();

    columnsPer:any[] = [
      {
        id:'id', name:'id', field:'id',
        type:'number',
        sortable: true,
        hidden: true,
        searchHidden: true
      },
      {
        id:'CUIT', name:'CUIT', field:'CUIT',
        type:'number',
        sortable: true,
        hidden: false,
        searchHidden: true,
      },
      {
        id:'Detalle', name:'Detalle', field:'Detalle',
        type:'string',
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: false,
      },
    ]

    columnsObj:any[] = [
      {
        id:'id', name:'id', field:'id',
        type:'number',
        searchType: 'number',
        sortable: true,
        hidden: true,
        searchHidden: true,
      },
      {
        id:'Codigo', name:'Codigo', field:'Codigo',
        type: 'number',
        sortable: true,
        hidden: false,
        searchHidden: true,
      },
      {
        id:'Detalle', name:'Detalle', field:'Detalle',
        type:'string',
        searchType: 'string',
        sortable: true,
        hidden: false,
        searchHidden: true,
      },
    ]

    $importacionesAnteriores = this.formChange$.pipe(
      debounceTime(500),
      switchMap(() => {
        return this.apiService
          .getImportacionesDescuentosAnteriores(this.anio(), this.mes())
          .pipe(
         
        )
      })
    )


    ngOnInit(): void {
      this.gridOptionsPer = this.apiService.getDefaultGridOptions('.gridErrorPer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      this.gridOptionsPer.enableRowDetailView = this.apiService.isMobile()
      this.gridOptionsPer.showFooterRow = true
      this.gridOptionsPer.createFooterRow = true

      this.gridOptionsObj = this.apiService.getDefaultGridOptions('.gridErrorObj', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      this.gridOptionsObj.enableRowDetailView = this.apiService.isMobile()
      this.gridOptionsObj.showFooterRow = true
      this.gridOptionsObj.createFooterRow = true

                // Escuchar cambios en formAltaDesc.files
        this.formAltaDesc.get('files')?.valueChanges.subscribe(async (filesValue: any) => {
          if (filesValue.length > 0) {
            this.loadingSrv.open({ type: 'spin', text: '' })

            this.gridDataImport$.next([])
 

            try {
              let descuentoId = this.formAltaDesc.get('DescuentoId')?.value
              let tableName = this.formAltaDesc.get('tableName')?.value
              await firstValueFrom(this.apiService.importXLSImporteVentaDescuentos(filesValue, this.anio(), this.mes(),this.fecha, descuentoId, tableName))  
            this.formChange$.next('changed');
            this.fileUploadComponent().DeleteFileByExporterror(filesValue)
            } catch (e: any) {
              this.fileUploadComponent().DeleteFileByExporterror(filesValue)
              if (e.error?.data?.list) {
                this.gridDataImport$.next(e.error.data.list)
              }
              this.uploading$.next({ loading: false, event: null })
            }
            this.loadingSrv.close()

          }
        });
      }
    

    tableName():string {
        const value = this.formAltaDesc.get("tableName")?.value
        if (value) {
          return value
        }
        return ''
    }

    DescuentoId():number {
        const value = this.formAltaDesc.get("DescuentoId")?.value
        if (value) {
          return value
        }
        return 0
    }

    uploadChange(event: any) {
        switch (event.type) {
          case 'start':
            this.loadingSrv.open({ type: 'spin', text: '' })
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
            this.loadingSrv.close()
            break;
          case 'success':
            const Response = event.file.response
            this.gridDataImport$.next([])
            this.gridDataImportLen = 0
            this.uploading$.next({ loading: false, event })
            this.loadingSrv.close()
            this.apiService.response(Response)        
            break
          default:
            break;
        }
    
    }
  

    async angularGridReady(angularGrid: any) {
      // this.angularGrid = angularGrid.detail
      // this.gridData = angularGrid.dataView

      // if (this.apiService.isMobile())
      //     this.angularGrid.gridService.hideColumnByIds([])
    }
}