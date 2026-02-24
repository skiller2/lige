import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
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
    selector: 'app-productos-importacion-masiva',
    templateUrl: './productos-importacion-masiva.html',
    styleUrl: './productos-importacion-masiva.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, NzUploadModule, FileUploadComponent],
    providers: [AngularUtilService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductosImportacionMasivaComponent {

  private readonly loadingSrv = inject(LoadingService);

  gridDataLen = 0
  gridDataImportLen = 0
  anio = input<number>(0)
  mes = input<number>(0)
  // formChange$ = new BehaviorSubject('');
  angularGrid!: AngularGridInstance;
  gridOptionsPro!: GridOption;
  gridOptionsObj!: GridOption;
  gridData: any;
  gridObj!: SlickGrid;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  fileUploadComponent = viewChild.required(FileUploadComponent);

  fb = inject(FormBuilder)
  formAltaProd = this.fb.group({
    ProductoCodigo:'', files: [[]]
  })

  uploading$ = new BehaviorSubject({loading:false,event:null});
  gridDataImport$ = new BehaviorSubject([]);

  constructor(
    private apiService: ApiService,
    private searchService: SearchService,
    private angularUtilService : AngularUtilService,
  ) {
  //   effect(async() => { 
  //     const tableName = this.tableName()
  //     this.formAltaProd.get('DescuentoId')?.reset()
  //   })
  }

  $optionsProducto = this.searchService.getProductos();

  columnsPro:any[] = [
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
      id:'RazonSocial', name:'Razón Social', field:'RazonSocial',
      type:'string',
      searchType: "string",
      sortable: true,
      hidden: false,
      searchHidden: false,
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

    // $importacionesAnteriores = this.formChange$.pipe(
    //   debounceTime(500),
    //   switchMap(() => {
    //     return this.apiService
    //       .getImportacionesDescuentosAnteriores(this.anio(), this.mes())
    //       .pipe(
         
    //     )
    //   })
    // )

  ngOnInit(): void {
    this.gridOptionsPro = this.apiService.getDefaultGridOptions('.gridErrorPro', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsPro.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsPro.showFooterRow = true
    this.gridOptionsPro.createFooterRow = true
    this.gridOptionsPro.forceFitColumns = true

    // Escuchar cambios en formAltaProd.files
    this.formAltaProd.get('files')?.valueChanges.subscribe(async (filesValue: any) => {
      if (filesValue.length > 0) {
        this.loadingSrv.open({ type: 'spin', text: '' })

        this.gridDataImport$.next([])

        try {
            let productoCodigo = this.ProductoCodigo()
            
            await firstValueFrom(this.apiService.importXLSImporteVentaProductoPrecios(filesValue, this.anio(), this.mes(), productoCodigo))  
            // this.formChange$.next('changed');
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

    ProductoCodigo():string {
        const value = this.formAltaProd.get("ProductoCodigo")?.value
        if (value && value.length) {
          return value
        }
        return ''
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