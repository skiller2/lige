import { Component, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, ChangeDetectionStrategy, resource, untracked } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { LoadingService } from '@delon/abc/loading';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component";
import { toSignal } from '@angular/core/rxjs-interop';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

type CuentasBancariasImportacion = {
  BancoId:number,
  file: any[]
}
@Component({
  selector: 'app-cuentas-bancarias-importacion-masiva',
  templateUrl: './cuentas-bancarias-importacion-masiva.html',
  styleUrl: './cuentas-bancarias-importacion-masiva.less',
  providers: [AngularUtilService],
  imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, NzUploadModule
    , FileUploadComponent, FormsModule, FormField
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CuentasBancariasImportacionMasivaComponent {
  gridDataLen = 0
  gridDataImportLen = 0
  uploading$ = new BehaviorSubject({ loading: false, event: null });
  gridDataImport$ = new BehaviorSubject([]);
  
  formChange$ = new BehaviorSubject('');
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridData: any;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  fileUploadComponent = viewChild.required(FileUploadComponent);
  periodo = input<Date|null>(null);

  private readonly loadingSrv = inject(LoadingService);
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  private readonly defaultImportacion: CuentasBancariasImportacion = { 
    BancoId:0,
    file: []
  }
  
  readonly importacion = signal<CuentasBancariasImportacion>(this.defaultImportacion);

  readonly formCuentasBancariasImportacion = form(this.importacion, (p) => {
    disabled(p.file, () => (p.BancoId? false : true))
  })

  optionsBanco = toSignal(this.searchService.getBancosOptions(), { initialValue: [] })

  effect1 = effect(async () => {
    const file = this.importacion().file
    if (file.length > 0) {
      const BancoId:number = Number(untracked(() => this.importacion().BancoId))
      if (!BancoId) return
      this.loadingSrv.open({ type: 'spin', text: '' })
      this.gridDataImport$.next([])
      
      try {
        // await firstValueFrom(this.apiService.importXLSImporteCuentasBancarias(file, this.periodo(), BancoId))
        
        this.fileUploadComponent().DeleteFileByExporterror(file)
      } catch (e: any) {
        this.fileUploadComponent().DeleteFileByExporterror(file)
        if (e.error?.data?.list) {
          this.gridDataImport$.next(e.error.data.list)
        }
        this.uploading$.next({ loading: false, event: null })
      }
      this.loadingSrv.close()
    }
  })

  // effect2 = effect(() => {
  //   const currentAnio = this.anio()
  //   const currentMes = this.mes()
  //   if (currentAnio > 0 && currentMes > 0) {
  //     this.formChange$.next('anio-mes-changed')
  //   }
  // })

  columns: any[] = [
    {
      id: 'id', name: 'id', field: 'id',
      type: 'number',
      sortable: true,
      hidden: true,
      searchHidden: true
    },
    {
      id: 'CUIT', name: 'CUIT', field: 'CUIT',
      type: 'number',
      sortable: true,
      hidden: false,
      searchHidden: true,
    },
    {
      id: 'Detalle', name: 'Detalle', field: 'Detalle',
      type: 'string',
      searchType: "string",
      sortable: true,
      hidden: false,
      searchHidden: false,
    },
  ]

  // importacionesAnteriores = resource({
  //   params: () => ({ anio: this.anio(), mes: this.mes() }),
  //   loader: async ({ params }) => {
  //     if (!params.anio || !params.mes) return [];
  //     return await firstValueFrom(this.apiService.getImportacionesDescuentosAnteriores(params.anio, params.mes))
  //   }
  // });

  ngOnInit(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridError', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    // Escuchar cambios en formAltaDesc.files
    // this.formAltaDesc.get('files')?.valueChanges.subscribe(async (filesValue: any) => {
      // if (filesValue.length > 0) {
      //   this.loadingSrv.open({ type: 'spin', text: '' })

      //   this.gridDataImport$.next([])


      //   try {
      //     const descuentoId = this.formAltaDesc.get('DescuentoId')?.value
      //     const tableName = this.formAltaDesc.get('tableName')?.value
      //     const CuentaTipoCodigo = this.formAltaDesc.get('CuentaTipoCodigo')?.value || ''

      //     await firstValueFrom(this.apiService.importXLSImporteVentaDescuentos(filesValue, this.anio(), this.mes(), this.fecha, descuentoId, tableName, CuentaTipoCodigo))
      //     this.formChange$.next('changed');
      //     this.fileUploadComponent().DeleteFileByExporterror(filesValue)
      //   } catch (e: any) {
      //     this.fileUploadComponent().DeleteFileByExporterror(filesValue)
      //     if (e.error?.data?.list) {
      //       this.gridDataImport$.next(e.error.data.list)
      //     }
      //     this.uploading$.next({ loading: false, event: null })
      //   }
      //   this.loadingSrv.close()

      // }
    // });
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
        this.uploading$.next({ loading: false, event })
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
    this.angularGrid = angularGrid.detail
    this.gridData = angularGrid.dataView

    if (this.apiService.isMobile())
        this.angularGrid.gridService.hideColumnByIds([])
  }

  // onDeleteImport(_e: any) {
  //   this.importacionesAnteriores.reload();
  // }
}