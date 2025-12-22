import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "src/app/shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "src/app/shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HabilitacionesDetalleComponent } from 'src/app/routes/ges/habilitaciones-detalle/habilitaciones-detalle';

@Component({
  selector: 'app-habilitaciones',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzButtonModule,
    HabilitacionesDetalleComponent],
  providers: [AngularUtilService],
  templateUrl: './habilitaciones.html',
  styleUrl: './habilitaciones.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService()
  listHabilitaciones$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  selectedIndex = signal(1)
  // periodo = signal<Date>(new Date())
  // anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  // mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  isLoading = signal<boolean>(false)
  personalId = signal<number>(0)
  personalHabilitacionId = signal<number>(0)
  lugarHabilitacionId = signal<number>(0)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)
  startFilters = signal<any[]>([])

  columns$ = this.apiService.getCols('/api/habilitaciones/cols')

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.settingsService.setLayout('collapsed', true)
  }

  gridData$ = this.listHabilitaciones$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getHabilitacionesList(this.listOptions,)
        .pipe(map((data:any) => { 
          return data.list 
        }))
    })
  )

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
    console.log('row: ', row);
    
    if (row?.id) {
      this.personalId.set(row.PersonalId)
      this.personalHabilitacionId.set(row.PersonalHabilitacionId)
      this.lugarHabilitacionId.set(row.PersonalHabilitacionLugarHabilitacionId)
    }

  }
  
  listOptionsChange(options: any) {
    this.listOptions = options
    this.listHabilitaciones$.next('')
  }

  refreshListado() {
    this.listHabilitaciones$.next('')
    this.selectedIndex.set(1)
  }

  goToDetail() {
    // if (this.personalId() && this.personalHabilitacionId() && this.lugarHabilitacionId()) {
      this.selectedIndex.set(2)
    // }
  }

  goToCredentials() {
    // if (this.personalId() && this.personalHabilitacionId() && this.lugarHabilitacionId()) {
      this.selectedIndex.set(3)
    // }
  }

  onTabsetChange(_event: any) { 
    window.dispatchEvent(new Event('resize'));
  }

}