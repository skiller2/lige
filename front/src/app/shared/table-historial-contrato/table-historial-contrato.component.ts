import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  LOCALE_ID,
  ViewChild,
  inject,input,SimpleChanges,EventEmitter,Output,
  model
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  fromEvent,
  debounceTime,
  map,
  switchMap,
  tap,
  firstValueFrom,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, OnClickEventArgs } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
    selector: 'app-table-historial-contrato',
    imports: [SHARED_IMPORTS,
        CommonModule,
        NzAffixModule,NzTabsModule
    ],
    providers: [AngularUtilService],
    templateUrl: './table-historial-contrato.component.html',
    styleUrl: './table-historial-contrato.component.less'
})
export class TableHistorialContratoComponent {

  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();

  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public searchService:SearchService) { }
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  


  Contrato$ = this.apiService.getCols('/api/objetivos/colsHistoryContrato').pipe(map((cols) => {
    return cols
  }));

  Domicilio$ = this.apiService.getCols('/api/objetivos/colsHistoryDomicilio').pipe(map((cols) => {
    return cols
  }));

  GrupoActividad$ = this.apiService.getCols('/api/objetivos/colsHistoryGrupoActividad').pipe(map((cols) => {
    return cols
  }));

  ObjetivoId = input(0)
  ClienteId = input(0)
  ClienteElementoDependienteId = input(0)
  excelExportService = new ExcelExportService()
  //gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridOptionsDomicilio!: GridOption
  gridOptionsGrupoActividad!: GridOption
  gridDataLen = 0
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }
  dataAngularGrid:any
  /////
  angularGrid!: AngularGridInstance
  gridObj!: SlickGrid
  gridObjDomicilio!: SlickGrid
  angularGridDomicilio!: AngularGridInstance
  gridObjGrupoActividad!: SlickGrid
  angularGridGrupoActividad!: AngularGridInstance
  

 anio = input<number>();
 mes = input<number>();

  ngOnChanges(changes: SimpleChanges) {
//    if ((changes['RefreshLicencia'] && changes['RefreshLicencia'].currentValue==true ) || changes['anio'] || changes['mes'] )
//      this.formChange$.next("");
  }

  listOptionsChange(options: any) {
    this.listOptions = options;

    this.listOptions.filtros = this.listOptions.filtros.filter((fil: any) => {
      return (fil.index != 'anio' && fil.index != 'mes') ? true : false
    })

    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
      return this.apiService
        .getListCargaContratoHistory({ options: this.listOptions }, this.anio(), this.mes(), this.ObjetivoId(), this.ClienteElementoDependienteId(), this.ClienteId() )
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

  gridDataDomiicilio$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
      return this.apiService
        .getListCargaDomicilioHistory({ options: this.listOptions }, this.anio(), this.mes(), this.ObjetivoId(), this.ClienteElementoDependienteId(), this.ClienteId() )
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


  gridDataGrupoActividad$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
      return this.apiService
        .getListCargaGrupoActividadHistory({ options: this.listOptions }, this.anio(), this.mes(), this.ObjetivoId(), this.ClienteElementoDependienteId(), this.ClienteId() )
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


  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
   
    ///////
    this.gridOptionsDomicilio = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsDomicilio.enableRowDetailView = this.apiService.isMobile()

    this.gridOptionsGrupoActividad = this.apiService.getDefaultGridOptions('.gridContainer3', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsGrupoActividad.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.gridOptionsDomicilio.showFooterRow = true
    this.gridOptionsDomicilio.createFooterRow = true

    this.gridOptionsGrupoActividad.showFooterRow = true
    this.gridOptionsGrupoActividad.createFooterRow = true

    //this.ObjetivoNombre.set('')
  }

  async angularGridReadyDomicilio(angularGrid: any) {
    this.angularGridDomicilio = angularGrid.detail
    this.gridObjDomicilio = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGridDomicilio.gridService.hideColumnByIds([])

    this.angularGridDomicilio.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridDomicilio)
      columnTotal('cantidad', this.angularGridDomicilio)
    })

  }

  async angularGridReadyGrupoActividad(angularGrid: any) {
    this.angularGridGrupoActividad = angularGrid.detail
    this.gridObjGrupoActividad = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGridGrupoActividad.gridService.hideColumnByIds([])

    this.angularGridGrupoActividad.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridGrupoActividad)
      columnTotal('cantidad', this.angularGridGrupoActividad)
    })

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
  

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    //console.log('this.angularGrid', this.angularGrid);

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('cantidad', this.angularGrid)
    })
  
  
  }

  valueRowSelectes(value:number){
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-historial-licencia',
      format: FileType.xlsx
    });
  }

   onTabChanged(selectedIndex: number): void {
    setTimeout(() => {
      switch (selectedIndex) {
        case 0:
          this.gridObj.resizeCanvas();
          this.gridObj.autosizeColumns();
          break;
        case 1:
          this.angularGridDomicilio.slickGrid.resizeCanvas();
          this.angularGridDomicilio.slickGrid.autosizeColumns();
          break;
        case 2:
            this.gridObjGrupoActividad.resizeCanvas();
            this.gridObjGrupoActividad.autosizeColumns();
          break;
      }
      window.dispatchEvent(new Event('resize'));

    }, 100);
  }

 
}
 

