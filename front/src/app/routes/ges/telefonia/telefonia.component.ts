import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FileType, Formatters, GridOption, SlickGrid, GroupTotalFormatters, Aggregators } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FormBuilder, FormArray } from '@angular/forms';
import { LoadingService } from '@delon/abc/loading';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"


@Component({
    selector: 'app-telefonia',
    templateUrl: './telefonia.component.html',
    styleUrls: ['./telefonia.component.less'],
    imports: [
        CommonModule,
        SHARED_IMPORTS,
        NzAffixModule,
        FiltroBuilderComponent,
        NzUploadModule,
        FileUploadComponent
    ],
    standalone: true,
    providers: [AngularUtilService]
})
export class TelefoniaComponent {
  @ViewChild('telefonoForm', { static: true }) telefonoForm: NgForm = new NgForm([], []);
  anio: number = 0
  mes: number = 0
  fecha: Date = new Date()
  periodo: Date = new Date()
  files: NzUploadFile[] = [];
  formChange$ = new BehaviorSubject('');
  filesChange$ = new BehaviorSubject('');
  uploading$ = new BehaviorSubject({loading:false,event:null});
  excelExportService = new ExcelExportService()
  gridDataImport = signal([])
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  detailViewRowCount = 9;
  fileUploadComponent = viewChild.required(FileUploadComponent);

  gridDataLen = 0
  gridDataImportLen = 0
  toggle = false

  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  private readonly loadingSrv = inject(LoadingService);


  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };


  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');

  }

  columnsImport = [
    {
      id: "id",
      name: "id",
      field: "id",
      fieldName: "id.TelefoniaId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Teléfono Número",
      type: "number",
      id: "TelefoniaNro",
      field: "TelefoniaNro",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Detalle",
      type: "string",
      id: "Detalle",
      field: "Detalle",
      searchType: "string",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },


  ]

  gridDataImport$ = new BehaviorSubject([]);


  columns$ = this.apiService.getCols('/api/telefonia/cols').pipe(map((cols) => {

    return cols
  }));

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      //const periodo = this.telefonoForm.form.get('periodo')?.value
      this.angularGrid.dataView.setItems([])
      return this.apiService
        .getTelefonos(
          { anio: this.anio, mes: this.mes, fecha: this.fecha, options: this.listOptions, toggle: this.toggle }
        )
    })
  );

  fb = inject(FormBuilder)
  ngForm = this.fb.group({ files: [] })

  ngOnInit(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    
    // Escuchar cambios en ngForm.files
    this.ngForm.get('files')?.valueChanges.subscribe(async (filesValue: any) => {
      if (filesValue.length > 0) {
        this.loadingSrv.open({ type: 'spin', text: '' })

        this.gridDataImport.set([])

        try {
          await firstValueFrom(this.apiService.importXLSImporteVentaTelefonia(filesValue, this.anio, this.mes,this.fecha))
        this.formChange$.next('changed');
        this.fileUploadComponent().DeleteFileByExporterror(filesValue)
        } catch (e: any) {
          this.fileUploadComponent().DeleteFileByExporterror(filesValue)
          if (e.error?.data?.list) {
            this.gridDataImport.set(e.error.data.list)
          }
          this.uploading$.next({ loading: false, event: null })
        }
        this.loadingSrv.close()

      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;

      this.periodo = (new Date(Number(anio), Number(mes) - 1, 1))

      const fechacorte = new Date()
      fechacorte.setDate(this.periodo.getDate() - 1)
      this.fecha = fechacorte
      this.onChange(null)
    }, 1);
  }

  $importacionesAnteriores = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getImportacionesTelefoniaAnteriores(
          this.anio, this.mes
        )
        .pipe(
        //map(data => {return data}),
        //doOnSubscribe(() => this.tableLoading$.next(true)),
        //tap({ complete: () => this.tableLoading$.next(false) })
      )
    })
  )

  onChange(_e: any): void {
    this.anio = this.periodo.getFullYear();
    this.mes = this.periodo.getMonth() + 1;
    localStorage.setItem('mes', String(this.mes));
    localStorage.setItem('anio', String(this.anio));

    this.filesChange$.next('')
    this.formChange$.next('');
    this.files = [];
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'telefonos-listado',
      format: FileType.xlsx
    });
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    //console.log('angularGridReady');
    
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])
    
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
        totalRecords(this.angularGrid)
        columnTotal('importe', this.angularGrid)
    })
  }


  reloadGrid() {
    this.filesChange$.next('')
    this.formChange$.next('changed')
  }

}
