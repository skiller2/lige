import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FileType, Formatters, GridOption, SlickGrid } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { SharedModule, listOptionsT } from 'src/app/shared/shared.module';
import { CustomDescargaComprobanteComponent } from '../objetivos-pendasis/objetivos-pendasis.component';

@Component({
  selector: 'app-telefonia',
  templateUrl: './telefonia.component.html',
  styleUrls: ['./telefonia.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
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
  excelExportService = new ExcelExportService()

  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  detailViewRowCount = 9;

  gridDataLen = 0
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


  columns$ = this.apiService.getCols('/api/telefonia/cols').pipe(map((cols) => {
    const colmonto: Column = {
      name: "Importe",
      type: "float",
      id: "monto",
      field: "monto",
      //      fieldName: "des.PersonalOtroDescuentoImporteVariable",
      sortable: true,
      //      formatter: () => '...',
      //asyncPostRender: this.renderAngularComponent.bind(this),
      formatter: Formatters.multiple,
      params: {
        formatters: [Formatters.currency, Formatters.alignRight],
        component: CustomDescargaComprobanteComponent,
        angularUtilService: this.angularUtilService,
        //complexFieldLabel: 'assignee.name' // for the exportCustomFormatter
      },

    }

    let mapped = cols.map((col: any) => {
      if (col.id == 'monto')
        col = colmonto
      return col
    });

    return mapped
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
            this.gridDataLen = data.list?.length
            return data.list
          }),
        );
    })
  );




  ngOnInit(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()


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
      this.onChange(null)
    }, 1);
  }

  onChange(_e: any): void {
    console.log('onChange')
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

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])
  }

}
