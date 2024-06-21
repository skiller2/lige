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
import { FiltroBuilderComponent } from '../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, OnClickEventArgs } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { RowDetailViewComponent } from '../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

interface PersonalLicencia {
  PersonalId: number;
  PersonalLicenciaId: number;
  PersonalApellido: string;
  PersonalNombre: string;
  PersonalLicenciaDesde: Date;
  PersonalLicenciaHasta: Date;
  TipoInasistenciaDescripcion: string; 
  CategoriaPersonalDescripcion: string;
  PersonalLicenciaHorasMensuales: string;
  PersonalLicenciaObservacion: string;

}

@Component({
  selector: 'app-table-abm-licencia',
  standalone: true,
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent, 
],
providers: [AngularUtilService],
  templateUrl: './table-abm-licencia.component.html',
  styleUrl: './table-abm-licencia.component.less'
})
export class TableAbmLicenciaComponent {

  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();


  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public searchService:SearchService) { }
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  


  columns$ = this.apiService.getCols('/api/carga-licencia/cols').pipe(map((cols) => {
    
    //cols[8].asyncPostRender = this.renderAngularComponent.bind(this)
    return cols
  }));

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
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
  dataAngularGrid:any
  personalLicencias: PersonalLicencia[] = [];


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
        .getListCargaLicencia(
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
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
 
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

    this.angularGridEdit = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
    })   

    this.angularGridEdit.slickGrid.onClick.subscribe((e, args)=> {
      this.personalLicencias = []
      var data = this.dataAngularGrid[args.row]
      this.personalLicencias.push(data);
      this.valueGridEvent.emit(this.personalLicencias)
    });
    
   
  }

  valueRowSelectes(value:number){
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-permisocarga',
      format: FileType.xlsx
    });
  }

 
}
 

