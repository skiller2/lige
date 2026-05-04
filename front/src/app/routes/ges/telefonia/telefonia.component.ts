import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, resource, signal, viewChild, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, map, max } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FormBuilder, FormArray } from '@angular/forms';
import { LoadingService } from '@delon/abc/loading';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { TelefoniaImpuestoDrawerComponent } from '../telefonia-impuesto-drawer/telefonia-impuesto-drawer';
import { applyEach, disabled, FieldTree, form, FormField, hidden, readonly, required, submit, type ValidationError } from '@angular/forms/signals';

export interface ImportacionTelefono {
  files:any[],
  totaldeclarado:string,
}

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
    FileUploadComponent,
    TelefoniaImpuestoDrawerComponent,
    FormField
  ],
  standalone: true,
  providers: [AngularUtilService]
})
export class TelefoniaComponent {
  // @ViewChild('telefonoForm', { static: true }) telefonoForm: NgForm = new NgForm([], []);
  fecha = signal<Date>(new Date())
  periodo = signal<Date|null>(null)
  anio = computed(() => { 
    if (this.periodo()?.getFullYear()) localStorage.setItem('anio', String(this.periodo()?.getFullYear()));
    return this.periodo()?.getFullYear() || 0
  })
  mes = computed(() => { 
    if (this.periodo()) localStorage.setItem('mes', String(this.periodo()!.getMonth()+1));
    return this.periodo()?.getMonth()!+1 || 0
  })

  uploading$ = new BehaviorSubject({ loading: false, event: null });
  excelExportService = new ExcelExportService()
  gridDataImport = signal<any[]>([])
  angularGrid!: AngularGridInstance;
  angularGridImport!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  detailViewRowCount = 9;
  fileUploadComponent = viewChild.required(FileUploadComponent);
  lastErrorsTels: any[] = []
  startFilters = signal<Selections[]>([])
  tabIndex = signal(0)
  visibleImpuesto = signal<boolean>(false)
  ImpuestoInternoTelefoniaImpuesto = signal(0)

  private readonly loadingSrv = inject(LoadingService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly angularUtilService = inject(AngularUtilService);

  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })

  columnsImport = signal([
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
      maxWidth: 150
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
  ])

  columns = toSignal(this.apiService.getCols('/api/telefonia/cols').pipe(map((cols) => {
    return cols
  })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes(), fecha: this.fecha() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        if (params.anio && params.mes) 
          response = await firstValueFrom(this.apiService.getTelefonos({ anio: params.anio, mes: params.mes, fecha: params.fecha, options: params.options, toggle: false }))
      } catch (_e) { }
      this.loadingSrv.close()
      this.ImpuestoInternoTelefoniaImpuesto.set(response?.ImpuestoInternoTelefoniaImpuesto || 0)
      return response.list || [];
    },

    defaultValue: []
  });

  private importacionTelefonoDefault: ImportacionTelefono = {
    files: [],
    totaldeclarado: '',
  }

  readonly importacionTelefono = signal<ImportacionTelefono>(this.importacionTelefonoDefault);
  readonly formImportacionTelefono = form(this.importacionTelefono)

  importacionesAnteriores = resource({
    params: () => ({ anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getImportacionesTelefoniaAnteriores(params.anio, params.mes))
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },
    defaultValue: []
  });

  importEffect = effect(async () => {
    const filesValue = this.importacionTelefono().files
    if (filesValue.length > 0) {
        this.loadingSrv.open({ type: 'spin', text: '' })
        this.lastErrorsTels = []  
        this.gridDataImport.set([])
        const totaldeclarado = Number(this.importacionTelefono().totaldeclarado) || 0

        try {
          await firstValueFrom(this.apiService.importXLSImporteVentaTelefonia(filesValue, this.anio(), this.mes(), this.fecha(), totaldeclarado))
          this.gridData.reload()
          this.fileUploadComponent().DeleteFileByExporterror(filesValue)
        } catch (e: any) {
          this.fileUploadComponent().DeleteFileByExporterror(filesValue)
          if (e.error?.data?.list) {
            this.gridDataImport.set(e.error.data.list)

            this.lastErrorsTels = [...new Set(this.gridDataImport().map(item => String(item.TelefoniaNro).trim()))];

          }
          this.uploading$.next({ loading: false, event: null })
        }
        this.loadingSrv.close()

      }
  })

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

      this.periodo.set(new Date(Number(anio), Number(mes) - 1, 1))

      const fechacorte = new Date()
      fechacorte.setDate(this.periodo()!.getDate() - 1)
      this.fecha.set(fechacorte)
    }, 1);
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'telefonos-listado',
      format: 'xlsx'
    });
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('importesum', this.angularGrid)
      columnTotal('importe', this.angularGrid)
    })
  }

  async angularGridImportReady(angularGrid: any) {
    this.angularGridImport = angularGrid.detail
    this.angularGridImport.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridImport)
    })
  }


  async createFilterTels() {
    if (this.lastErrorsTels.length > 0) {
      const newFilter = { index: 'EfectoAtributoIngresoValor', condition: 'AND', operator: '=', value: this.lastErrorsTels, closeable: true }
      this.startFilters.set([newFilter])
      this.router.navigate(['/ges/telefonia/listado'], { queryParams: {  } })
    }
  }

  reloadGrid() {
    this.gridData.reload()
  }

  openDrawerforImpuesto(): void {
    this.visibleImpuesto.set(true)
  }

  dateChange(result: Date): void {
    if (!result) return

    localStorage.setItem('anio', String(this.anio()));
    localStorage.setItem('mes', String(this.mes()));
  }

}
