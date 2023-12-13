import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FileType, Formatters, GridOption, SlickGrid, GroupTotalFormatters, Aggregators } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, debounceTime, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"


@Component({
  selector: 'app-telefonia',
  templateUrl: './telefonia.component.html',
  styleUrls: ['./telefonia.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
    NzUploadModule
  ],
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

  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  detailViewRowCount = 9;

  gridDataLen = 0
  gridDataImportLen = 0
  toggle = false

  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }


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
      return this.apiService
        .getTelefonos(
          { anio: this.anio, mes: this.mes, fecha: this.fecha, options: this.listOptions, toggle: this.toggle }
        )
        .pipe(
          map(data => {
            // this.gridDataLen = data.list?.length
            // this.gridObj.getFooterRowColumn(0).innerHTML = 'Registros:  ' + this.gridDataLen.toString()
            //console.log('data:',data);
            return data.list
          }),
        );
    })
  );




  ngOnInit(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
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

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg)=>{
        totalRecords(this.angularGrid)
        columnTotal('importe', this.angularGrid)
    })
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
