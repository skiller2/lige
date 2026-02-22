import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, model, input, Inject, inject, EventEmitter,Output, ViewChild, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, debounceTime,switchMap,tap,map } from 'rxjs';
import { ApiService,doOnSubscribe } from 'src/app/services/api.service';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, OnClickEventArgs } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { NzAffixModule } from 'ng-zorro-antd/affix';


  


  type listOptionsT = {
    filtros: any[],
    extra: any,
    sort: any,
  }
  
  @Component({
      selector: 'app-curso-historial-drawer ',
      imports: [...SHARED_IMPORTS,
          CommonModule,
          NzAffixModule,
      ],
      providers: [AngularUtilService],
      templateUrl: './curso-historial-drawer.component.html',
      styleUrl: './curso-historial-drawer.component.less'
  })
  export class CursoHistorialDrawerComponent {

  CursoHabilitacionId = input(0)
  CentroCapacitacionSedeId = input(0)
  CursoHabilitacionDescripcion = input<string>('')

  visibleHistorial = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  
    @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
      new NgForm([], []);
    private readonly route = inject(ActivatedRoute);
  
    @Output()valueGridEvent = new EventEmitter();
  
    constructor(public apiService: ApiService, private angularUtilService: AngularUtilService, public searchService:SearchService) { }
    formChange$ = new BehaviorSubject('');
    tableLoading$ = new BehaviorSubject(false);
    
  
  
    columns$ = this.apiService.getCols('/api/curso/colsHistory').pipe(map((cols) => {
  
      return cols
    }));
  

    excelExportService = new ExcelExportService()
    angularGridEdit!: AngularGridInstance;
    gridObj!: SlickGrid;
    detailViewRowCount = 9
    gridOptions!: GridOption
    gridDataLen = 0  
    listOptions: listOptionsT = {
      filtros: [],
      sort: null,
      extra: null,
    }
    dataAngularGrid:any
  
  
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
        //this.searchService.getCUITfromPersonalId
        this.listOptions.extra = { 'todos': (this.route.snapshot.url[1].path=='todos')}
        return this.apiService
          .getListCursosHistory(
            { options: this.listOptions }, this.anio(), this.mes(), this.CursoHabilitacionId(),this.CentroCapacitacionSedeId()
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
      this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer3', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
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
        columnTotal('total', this.angularGridEdit)
      })   
    
    }
  
    valueRowSelectes(value:number){
      this.dataAngularGrid
    }
  
    exportGrid() {
      this.excelExportService.exportToExcel({
        filename: 'lista-historial-cursos',
        format: 'xlsx'
      });
    }
  }  