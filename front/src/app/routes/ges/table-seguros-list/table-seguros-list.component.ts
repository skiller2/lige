import {
  Component,
  inject,EventEmitter,Output,
  model, signal, resource
} from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  firstValueFrom,
  debounceTime,
  map,
  switchMap,
  tap,fromEvent,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, OnClickEventArgs } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-table-seguros-list',
  standalone: true,
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent, 
],
providers: [AngularUtilService],
  templateUrl: './table-seguros-list.component.html',
  styleUrl: './table-seguros-list.component.less'
})
export class TableSeguroListComponent {

  private readonly route = inject(ActivatedRoute);

  @Output()valueGridEvent = new EventEmitter();

  private settingService = inject(SettingsService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
    extra: null,
  });
  startFilters = signal<Selections[]>([])

  columns = toSignal(this.apiService.getCols('/api/seguros/cols'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.getListSeguros({ options: params.options }));
        response = res.list;
      } catch (error) {} 
      finally {
        this.loadingSrv.close();
      }
      return response || [];
    },
    defaultValue: []
  });

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
  }

  ngAfterViewInit() {
    const dateToday = new Date();
    this.startFilters.set([
      {index:'PersonalSeguroDesde', condition:'AND', operator:'<=', value: dateToday, closeable: true},
      {index:'PersonalSeguroHasta', condition:'AND', operator:'>=', value: dateToday, closeable: true},
      {index:'SituacionRevistaId', condition:'AND',operator:'=', value: '2;10;11;12', closeable: true}
    ])
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
  }

  ngOnDestroy() {}
  
  angularGridReady(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
    })   

    this.angularGridEdit.slickGrid.onClick.subscribe((e, args)=> {

      // var data = this.dataAngularGrid[args.row]

    });
    
   
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-seguro',
      format: 'xlsx'
    });
  }

 
}