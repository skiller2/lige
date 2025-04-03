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
  debounceTime,
  map,
  switchMap,
  tap,fromEvent,
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

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
    selector: 'app-table-historial-producto',
    imports: [SHARED_IMPORTS,
        CommonModule,
        NzAffixModule,
    ],
    providers: [AngularUtilService],
    templateUrl: './table-historial-producto.component.html',
    styleUrl: './table-historial-producto.component.less'
})
export class TableHistorialProductoComponent {

  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();

  constructor(private settingService: SettingsService, public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public searchService:SearchService) { }
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  


  columns$ = this.apiService.getCols('/api/precios-productos/colsHistory').pipe(map((cols) => {

    return cols
  }));

  editProductoId = input()
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
      return this.searchService.getProductoById(this.editProductoId())
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
    this.gridOptions.enableRowDetailView = false

    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    //this.editProductoId.set('')
   
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
    // this.gridObj = angularGrid.detail.slickGrid;

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
      filename: 'lista-historial-producto',
      format: FileType.xlsx
    });
  }

 
}
 

