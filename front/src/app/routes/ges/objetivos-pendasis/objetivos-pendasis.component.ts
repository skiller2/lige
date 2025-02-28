import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  LOCALE_ID,
  ViewChild,
  inject,
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
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
    imports: [
        SHARED_IMPORTS,
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
        CommonModule,
        NzAffixModule,
        FiltroBuilderComponent,
    ],
    styleUrls: ['./objetivos-pendasis.component.less'],
    providers: [AngularUtilService]
})
export class ObjetivosPendAsisComponent {
  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private readonly route = inject(ActivatedRoute);


  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public searchService:SearchService) { }
  anio = 0
  mes = 0
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);

  columns$ = this.apiService.getCols('/api/objetivos-pendasis/cols').pipe(map((cols) => {
    cols[3].asyncPostRender= this.renderAngularComponent.bind(this)

    return cols
  }));

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  SelectedTabIndex = 0  
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }

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
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
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
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

  }

  ngAfterContentInit(): void {
    const user: any = this.settingService.getUser()
    const gruposActividadList = user.GrupoActividad

    setTimeout(() => {
      if (gruposActividadList.length > 0)
        this.sharedFiltroBuilder.addFilter('GrupoActividadNumero', 'AND', '=', gruposActividadList.join(';'),false)  //Ej 548
    }, 3000);

  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ObjetivoDescripcion':
        Object.assign(componentOutput.componentRef.instance, { link: '/ges/carga_asistencia', params: {ObjetivoId:dataContext.ObjetivoId}, detail:cellNode.innerText
       })
        
        break;
    
      default:
        break;
    }

    cellNode.replaceChildren(componentOutput.domElement)
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
      this.objpendForm.form
        .get('periodo')
        ?.setValue(new Date(Number(anio), Number(mes) - 1, 1));

    }, 1);
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

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['SucursalDescripcion','GrupoActividadNumero','AsistenciaHoras'])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
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
