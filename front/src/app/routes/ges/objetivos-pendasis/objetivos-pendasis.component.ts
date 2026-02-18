import {
  Component,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AsyncPipe } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { Selections } from 'src/app/shared/schemas/filtro';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  imports: [
    SHARED_IMPORTS
  ],
  template: `<a app-down-file title="Comprobante {{ mes }}/{{ anio }}"
    httpUrl="api/impuestos_afip/{{anio}}/{{mes}}/0/{{item.PersonalId}}"
           ><span class="pl-xs" nz-icon nzType="download"></span></a>`
})
export class CustomDescargaComprobanteComponent {
  item: any;
  anio: any
  mes: any
}


@Component({
  selector: 'objetivos-pendasis',
  templateUrl: './objetivos-pendasis.component.html',
  imports: [
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    AsyncPipe
],
  styleUrls: ['./objetivos-pendasis.component.less'],
  providers: [AngularUtilService]
})
export class ObjetivosPendAsisComponent {
  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  private readonly route = inject(ActivatedRoute);


  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, public searchService: SearchService) { }
  anio = 0
  mes = 0
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);

  columns$ = this.apiService.getCols('/api/objetivos-pendasis/cols').pipe(map((cols) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == 'ObjetivoDescripcion') {
        col.asyncPostRender = this.renderAngularComponent.bind(this)
      }
      return col
    });
    return mapped
  }));

  excelExportService = new ExcelExportService()
  angularGridOPA!: AngularGridInstance;
  angularGridOPAT!: AngularGridInstance;
  detailViewRowCount = 9
  gridOptionsOPA!: GridOption
  gridOptionsOPAT!: GridOption
  gridDataLen = 0
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }
  startfilters = signal<Selections[]>([])

  listOptionsChange(options: any) {
    this.listOptions = options;

    this.listOptions.filtros = this.listOptions.filtros.filter((fil: any) => {
      return (fil.index != 'anio' && fil.index != 'mes') ? true : false
    })

    this.listOptions.filtros.push({ index: 'anio', operador: '=', condition: 'AND', valor: localStorage.getItem('anio') })
    this.listOptions.filtros.push({ index: 'mes', operador: '=', condition: 'AND', valor: localStorage.getItem('mes') })

    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path == 'todos') }
      return this.apiService
        .getObjetivosPendAsis(
          { options: this.listOptions }
        )
        .pipe(
          map(data => {
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  )

  ngOnInit() {
    this.gridOptionsOPA = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsOPA.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsOPA.showFooterRow = true
    this.gridOptionsOPA.createFooterRow = true

    this.gridOptionsOPAT = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsOPAT.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsOPAT.showFooterRow = true
    this.gridOptionsOPAT.createFooterRow = true


    const user: any = this.settingService.getUser()

    this.startfilters.set([{
      index: 'GrupoActividadNumero',
      condition: 'AND',
      operator: '=',
      value: user.GrupoActividad.map((grupo: any) => grupo.GrupoActividadNumero).join(';'),
      closeable: true
    }])

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
      this.objpendForm.form
        .get('periodo')
        ?.setValue(new Date(Number(anio), Number(mes) - 1, 1));

    }, 1);
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ObjetivoDescripcion':
        Object.assign(componentOutput.componentRef.instance, {
          link: '/ges/carga_asistencia', params: { ObjetivoId: dataContext.ObjetivoId }, detail: cellNode.innerText
        })

        break;

      default:
        break;
    }

    cellNode.replaceChildren(componentOutput.domElement)
  }



  ngAfterViewInit(): void {
    this.route.queryParams.subscribe(params => {

      if (params['anio'] && params['mes']){
        localStorage.setItem('mes', params['mes']);
        localStorage.setItem('anio', params['anio']);
      }

      if (params['GrupoActividadId'] == 0) {
        this.startfilters.set([])
      }
    })
  }

  onChange(result: Date): void {
    if (result) {
      this.anio = result.getFullYear();
      this.mes = result.getMonth() + 1;

      localStorage.setItem('mes', String(this.mes));
      localStorage.setItem('anio', String(this.anio));
    } else {
      this.anio = 0;
      this.mes = 0;
    }

    this.listOptionsChange(this.listOptions)
  }



  formChanged(_event: any) {
    this.listOptionsChange(this.listOptions)
  }

  ngOnDestroy() {
  }

  angularGridReadyOPA(angularGrid: any) {

    this.angularGridOPA = angularGrid.detail

    if (this.apiService.isMobile())
      this.angularGridOPA.gridService.hideColumnByIds(['SucursalDescripcion', 'GrupoActividadNumero', 'AsistenciaHoras'])

    this.angularGridOPA.dataView.onRowsChanged.subscribe((e: any, arg: any) => {
      totalRecords(this.angularGridOPA)
    })
  }

  angularGridReadyOPAT(angularGrid: any) {

    this.angularGridOPAT = angularGrid.detail

    if (this.apiService.isMobile())
      this.angularGridOPAT.gridService.hideColumnByIds(['SucursalDescripcion', 'GrupoActividadNumero', 'AsistenciaHoras'])

    this.angularGridOPAT.dataView.onRowsChanged.subscribe((e: any, arg: any) => {
      totalRecords(this.angularGridOPAT)
    })
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'objetivos-pendasis',
      format: FileType.xlsx
    });
  }

  async setCambiarCategorias() {
    this.apiService.setCambiarCategorias({ options: this.listOptions }).subscribe(evt => {
      this.formChange$.next('')

    });

  }

}
