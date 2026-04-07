import { Component,ViewChild,inject,input,SimpleChanges,EventEmitter,Output,model} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject,debounceTime,map,switchMap, tap,firstValueFrom } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';


type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  selector: 'app-table-locked',
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
],
providers: [AngularUtilService],
  templateUrl: './table-locked.html',
  styleUrl: './table-locked.scss',
})

export class TableBloqueadasComponent {

  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();

  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, public searchService:SearchService) { }
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  


  columns$ = this.apiService.getCols('/api/procesos-automaticos/colsBloqueadas').pipe(map((cols) => {

    return cols
  }));

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  dataAngularGrid:any

  listOptionsChange(options: any) {
    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {

      return this.apiService
        .getListListaTablasBloqueadas()
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
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

  }


  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
}


  formChanged(_event: any) {
    //this.listOptionsChange(this.listOptions)
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
      filename: 'lista-tablas-bloqueadas',
      format: 'xlsx'
    });
  }

 
}

