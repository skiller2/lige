import { Component, ViewChild, resource, inject, signal, computed } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  of,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { DescuentoJSON } from '../../../shared/schemas/ResponseJSON';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import type { Options, Selections } from '../../../shared/schemas/filtro';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { LoadingService } from '@delon/abc/loading';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';

@Component({
  imports: [
    SHARED_IMPORTS,
  ],
  template: `<a app-down-file title="Comprobante {{ mes() }}/{{ anio() }}"
    httpUrl="api/impuestos_afip/{{anio()}}/{{mes()}}/0/{{item.PersonalId}}"
           style="float:right;padding-right: 5px;"><span class="pl-xs" nz-icon nzType="download"></span></a>`
})

export class CustomDescargaComprobanteComponent {
  item: any;
  anio: any
  mes: any
}


@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  imports: [ SHARED_IMPORTS, NzAffixModule,
    FiltroBuilderComponent, NzUploadModule,
    AsyncPipe, DetallePersonaComponent
  ],
  styleUrls: ['./impuesto-afip.component.less'],
  providers: [AngularUtilService]
})
export class ImpuestoAfipComponent {
  url = '/api/impuestos_afip';
  url_forzado = '/api/impuestos_afip/forzado';
  
  files: NzUploadFile[] = [];
  selectedPersonalId = null;
  tableLoading$ = new BehaviorSubject(false);
  detailViewRowCount = 9;
  columnDefinitions: Column[] = []
  gridOptions!: GridOption;
  gridDataLen = 0

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  startFilters: Selections[] = []

  PersonalId = signal<number>(0);
  visibleDetalle = signal<boolean>(false)
  toggle = signal<boolean>(false);
  listOptions = signal<listOptionsT>({ filtros: [], sort: null, })
  periodo = signal<Date|null>(null);
  anio = computed(() => { 
    const f = this.periodo();
    return f ? f.getFullYear() : 0
  })
  mes = computed(() => { 
    const f = this.periodo();
    return f ? f.getMonth()+1 : 0
  })

  readonly router = inject(Router)
  private readonly loadingSrv = inject(LoadingService);
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private settingService = inject(SettingsService)

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.anio, mes: this.mes })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }


  columns$ = this.apiService.getCols('/api/impuestos_afip/cols').pipe(map((cols: Column<any>[]) => {
    let mapped = cols.map((col: any) => {
      if (col.id == 'monto') {
        col.asyncPostRender = this.renderAngularComponent.bind(this)
        col.params = { angularUtilService: this.angularUtilService, component: CustomDescargaComprobanteComponent }
      }
      return col
    });
    return mapped
  }));

  listOptionsChange(options: any) {
    this.listOptions.set(options);
  }

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        if (params.anio && params.mes) 
          response = await firstValueFrom(
            this.apiService.getDescuentosMonotributo({ anio: params.anio, mes: params.mes, options: params.options, toggle: this.toggle })
            .pipe(map((data: any) => { return data.list }))
          )
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },
    defaultValue: []
  });

  listaDescuentos = resource({
    params: () => ({ anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      let response = null
      
      try {
        response = await firstValueFrom(this.apiService.getDescuentoByPeriodo(params.anio, params.mes, 0 )
          .pipe( map((items: any) => {
            return {
              RegistrosConComprobantes: items.RegistrosConComprobantes,
              RegistrosSinComprobantes: items.RegistrosSinComprobantes,
            };
          }))
        )
      } catch (_e) { }

      return response;
    },
    defaultValue: null
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


    const user: any = this.settingService.getUser()
      this.startFilters = [
        { index: 'GrupoActividadNumero', condition: 'AND', operator: '=', value: user.GrupoActividad.map((grupo: any) => grupo.GrupoActividadNumero).join(';') },
        { index: 'PersonalExencionCUIT', condition: 'AND', operator: '=', value: '0' },
        { index: 'monto', condition: 'AND', operator: '=', value: 'null' }
      ]


  }


  ngAfterViewInit(): void {
    // setTimeout(() => {
    //   const now = new Date(); //date
    //   const anio =
    //     Number(localStorage.getItem('anio')) > 0
    //       ? localStorage.getItem('anio')
    //       : now.getFullYear();
    //   const mes =
    //     Number(localStorage.getItem('mes')) > 0
    //       ? localStorage.getItem('mes')
    //       : now.getMonth() + 1;
    //   this.periodo.set(new Date(Number(anio), Number(mes) - 1, 1))
    // }, 1);
  }

  handleChange({ file, fileList }: NzUploadChangeParam): void {
    // const status = file.status;
    // if (status !== 'uploading') {
    //   console.log(file, fileList);
    // }
    // if (status === 'done') {
    //   this.formChange$.next('');
    //   //       this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   //   this.msg.error(`${file.name} file upload failed.`);
    // }

    if (file.status === 'done') {
      this.listaDescuentos.reload();
    }
  }


  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('monto', this.angularGrid)
      columnTotal('montodescuento', this.angularGrid)
    })
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const PersonalId = this.angularGrid.dataView.getItemByIdx(rowNum)?.PersonalId
      this.PersonalId.set(PersonalId)

    } else {
      this.PersonalId.set(0)
    }
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'monotributos-listado',
      format: 'xlsx'
    });
  }

  public forzadoUploadData(cuit: string | null | undefined, montoText: string | null | undefined) {
    return {
      anio: this.anio,
      mes: this.mes,
      cuit,
      monto: this.parseMontoForzado(montoText),
    };
  }

  private parseMontoForzado(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  closeDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(false)
  }

}
