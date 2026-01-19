import { Component, Output, EventEmitter, computed, input, signal, effect, model,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { LoadingService } from '@delon/abc/loading';


interface ListOptions {
  filtros: any[];
  sort: any;
}

@Component({
  selector: 'app-table-objetivo-documentos',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-objetivo-documentos.html',
  styleUrls: ['./table-objetivo-documentos.less'],
  standalone: true
})
export class TableObjetivoDocumentoComponent {
  // @Output() valueGridEvent = new EventEmitter<PersonalEstudio[]>();

  private readonly loadingSrv = inject(LoadingService);

  angularGrid!: AngularGridInstance
  gridOptions!: GridOption
  gridDataInsert: any[] = []
  excelExportService = new ExcelExportService()
  detailViewRowCount = 1
  listOptions: ListOptions = {
    filtros: [],
    sort: null,
  };

  tableLoading$ = new BehaviorSubject<boolean>(false);
  listDocsObjetivo$ = new BehaviorSubject('');
  startFilters = signal<any[]>([])
  ObjetivoId = input<number>(0);
  RefreshObjetivo = model<boolean>(false);
  
  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) {
    // effect(() => {
    //   const ObjetivoId = this.ObjetivoId()
    //   if (ObjetivoId) {
    //     this.listDocsObjetivo$.next('');
    //   }
    // });
  }

  private refreshEffect = effect(() => {
    if (this.RefreshObjetivo()) {
      console.log(' Recargando grilla');
      this.listOptions.filtros = [];

      this.listDocsObjetivo$.next('refresh');
    }
  });


  columns$ = this.apiService.getCols('/api/Objetivos/docs-cols');
  gridData$ = this.listDocsObjetivo$.pipe(
      debounceTime(500),
      switchMap(() => {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return this.searchService.getDocsByObjetivo({ options: this.listOptions, ObjetivoId: this.ObjetivoId() })
          .pipe(map(data => {
            console.log('data.list:', data.list);
            
            return data.list
          }),
          doOnSubscribe(() => { }),
          tap({ complete: () => { this.loadingSrv.close() } })
        )
      })
  ) 

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    // this.gridOptions.forceFitColumns = true
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id){}
      // this.editObjetivoId.set(row.id)

  }

  listOptionsChange(options: any) {
      this.listOptions = options
      this.listDocsObjetivo$.next('')
  }

}