import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  LOCALE_ID,
  ViewChild,
  inject,input,SimpleChanges,EventEmitter,Output
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,fromEvent,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters, SlickGrid } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}


@Component({
  selector: 'app-table-horas-licencia',
  standalone: true,
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent, 
],
providers: [AngularUtilService],
  templateUrl: './table-horas-licencia.component.html',
  styleUrl: './table-horas-licencia.component.less'
})
export class TableHorasLicenciaComponent {

  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();


  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public searchService:SearchService) { }
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  
  columnDefinitions: Column[] = [];
  columnas: Column[] = [];

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  detailViewRowCount = 9
  gridOptionsEdit!: GridOption;
  gridObjEdit!: SlickGrid;
  gridDataLen = 0
  SelectedTabIndex = 0  
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }
  dataAngularGrid:any



 anio = input<number>();
 mes = input<number>();

  ngOnChanges(changes: SimpleChanges) {
    this.formChange$.next("");
  }


  listOptionsChange(options: any) {
    this.listOptions = options;

    this.listOptions.filtros = this.listOptions.filtros.filter((fil: any) => {
      return (fil.index != 'anio' && fil.index != 'mes') ? true : false
    })

    // this.listOptions.filtros.push({ index: 'anio', operador: '=', condition: 'AND', valor: localStorage.getItem('anio') })
    // this.listOptions.filtros.push({ index: 'mes', operador: '=', condition: 'AND', valor: localStorage.getItem('mes') })

    this.formChange$.next('')
    console.log(this.listOptions)
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
      return this.apiService
        .getListHorasLicencia(
          { options: this.listOptions }, this.anio(), this.mes()
        )
        .pipe(
          map(data => {
            this.dataAngularGrid = data.list
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  )

  ngOnInit() {

    
    this.columnDefinitions = [
  
    {
      id: "id",
      name: "number",
      field: "id",
      params: {
        complexFieldLabel: 'id',
      },
      hidden: true,
    },
    {
      name: "Personal Apellido",
      type: "string",
      id: "PersonalApellido",
      field: "PersonalApellido",
      params: {
        complexFieldLabel: 'PersonalApellido',
      },
      hidden: false,
    },
    {
      name: "Personal Nombre",
      type: "string",
      id: "PersonalNombre",
      field: "PersonalNombre",
      params: {
        complexFieldLabel: 'PersonalNombre',
      },
      hidden: false,
    },
    {
      name: "PersonalLicencia Id",
      type: "number",
      id: "PersonalLicenciaId",
      field: "PersonalLicenciaId",
      params: {
        complexFieldLabel: 'PersonalLicenciaId',
      },
      hidden: true,
    },
    {
      name: "Periodo",
      type: "string",
      id: "PersonalLicenciaAplicaPeriodoAplicaEl",
      field: "PersonalLicenciaAplicaPeriodoAplicaEl",
      params: {
        complexFieldLabel: 'PersonalLicenciaAplicaPeriodoAplicaEl',
      },
      hidden: true,
    },
    {
      name: "PeriodoSucursalId",
      type: "number",
      id: "PersonalLicenciaAplicaPeriodoSucursalId",
      field: "PersonalLicenciaAplicaPeriodoSucursalId",
      params: {
        complexFieldLabel: 'PersonalLicenciaAplicaPeriodoSucursalId',
      },
      hidden: true,
    },
    {
      name: "Personal Licencia SePaga",
      type: "string",
      id: "PersonalLicenciaSePaga",
      field: "PersonalLicenciaSePaga",
      params: {
        complexFieldLabel: 'PersonalLicenciaSePaga',
      },
      hidden: true,
    },
    {
      name: "TipoInasistenciaId",
      type: "string",
      id: "TipoInasistenciaId",
      field: "TipoInasistenciaId",
      params: {
        complexFieldLabel: 'TipoInasistenciaId',
      },
      hidden: true,
    },
    {
      name: "Horas Mensuales",
      id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
      field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
      params: {
        complexFieldLabel: 'PersonalLicenciaAplicaPeriodoHorasMensuales',
      },
      hidden: false,
      editor: {
        model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 10000,
      },
      onCellChange: this.onHoursChange.bind(this),
    },
    {
      name: "Tipo Inasistencia",
      type: "string",
      id: "TipoInasistenciaDescripcion",
      field: "TipoInasistenciaDescripcion",
      params: {
        complexFieldLabel: 'TipoInasistenciaDescripcion',
      },
      hidden: false,
    },
    {
      name: "PersonalLicenciaAplicaPeriodo",
      type: "number",
      id: "PersonalLicenciaAplicaPeriodo",
      field: "PersonalLicenciaAplicaPeriodo",
      params: {
        complexFieldLabel: 'PersonalLicenciaAplicaPeriodo',
      },
      hidden: true,
    },
   
  ];
    
    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
 
  }

  onCellChanged(e: any) {
  }

  onHoursChange(e: Event, args: any) {
    const item = args.dataContext

    this.apiService.setchangehours({ item: item }).subscribe(evt => {
      this.formChange$.next('')
    });
   
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
}


  formChanged(_event: any) {
    this.listOptionsChange(this.listOptions)
  }

  ngOnDestroy() {
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail
    this.gridObjEdit = angularGrid.detail.slickGrid;


    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  }

  valueRowSelectes(value:number){
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-hora',
      format: FileType.xlsx
    });
  }

 
}
 

