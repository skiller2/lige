import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-table-personal-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-personal-efecto.component.html',
  styleUrls: ['./table-personal-efecto.component.less'],
  standalone: true
})
export class TablePersonalEfectoComponent {

  refreshGrid = input<number>(0);
  personalIdFilter = input<number>(0);
  efectoSelected = output<any | null>();
  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  filtersReady = signal(false)
  startFilters = signal<Selections[]>([])
  startFiltersReady = signal(false)
  filtroVisible = signal(true)
  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)

  private applyPersonaFilter = effect(() => {
    const id = this.personalIdFilter()
    if (id > 0) {
      this.startFilters.update(filters => [
        ...filters.filter(filter => filter.index !== 'PersonalId'),
        { index: 'PersonalId', condition: 'AND', operator: '=', value: String(id), closeable: true },
      ])
      this.filtroVisible.set(false)
      setTimeout(() => this.filtroVisible.set(true))
    }
  })

  columns = toSignal(this.apiService.getCols('/api/efecto/colsPersonal'), { initialValue: [] as Column[] })

  gridData = resource({
    // Espera a que FiltroBuilder emita los filtros iniciales para evitar el warning duplicado al ingresar.
    params: () => this.filtersReady()
      ? { options: this.listOptions(), refresh: this.refreshGrid() }
      : undefined,
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const response = await firstValueFrom(this.searchService.getEfectoPersonal(params.options))
        return response || []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  async ngOnInit(): Promise<void> {
    this.initializeGridOptions();
    const filters = await firstValueFrom(this.searchService.getEfectoFilters('table-personal-efecto'))
    this.startFilters.update(currentFilters => [
      ...filters,
      ...currentFilters.filter(currentFilter => !filters.some((backendFilter: Selections) => backendFilter.index === currentFilter.index)),
    ])
    this.startFiltersReady.set(true)
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerPersonalEfecto',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
  }

  listOptionsChange(options: any): void {
    this.listOptions.set(options);
    if (!this.filtersReady()) this.filtersReady.set(true);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('StockStock', this.angularGrid)
    });

  }

  handleSelectedRowsChanged(e: any): void {
    const rows: number[] = e.detail.args.rows ?? []
    const item = rows.length === 1 ? this.angularGrid.dataView.getItem(rows[0]) : null
    this.efectoSelected.emit(item ?? null)
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-personal-efecto',
      format: 'xlsx'
    });
  }
} 
