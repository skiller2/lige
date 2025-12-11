import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-habilitaciones',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
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
  editNovedadNovedadCodigo = signal(0)
  editNovedadObjetivoId = signal(0)
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listHabilitaciones$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  selectedIndex = signal(0)
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  cantRegistros = signal<number>(0)
  isLoading = signal<boolean>(false)

  // childDetalle = viewChild.required<NovedadesFormComponent>('novedadesFormDeta')

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
        .pipe(map(data => { 
          console.log('data: ', data);
          
          return data.list 
        }))
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      // columnTotal('CantidadNovedades', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    console.log("handleSelectedRowsChanged", e)
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id) {
      // this.editNovedadNovedadCodigo.set(row.id)
      // this.editNovedadObjetivoId.set(row.ObjetivoId)
      // Asegurar que el componente de edición se inicialice si ya está visible
      // if (this.selectedIndex() === 2) {
      //   this.childDeta().viewRecord(false)
      // }
    }

  }
  
  listOptionsChange(options: any) {
    this.listOptions = options
    this.listHabilitaciones$.next('')
  }

  reloadListado() {
    this.listHabilitaciones$.next('')
    this.selectedIndex.set(1)
  }

  // goToDetail() {
  //   if (this.editNovedadNovedadCodigo() > 0) {
  //     this.selectedIndex.set(2)
  //     this.childDetalle().viewRecord(true)
  //   }
  // }

}