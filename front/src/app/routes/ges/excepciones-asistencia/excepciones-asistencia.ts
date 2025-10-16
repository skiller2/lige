import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-excepciones-asistencia',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  providers: [AngularUtilService],
  templateUrl: './excepciones-asistencia.html',
  styleUrl: './excepciones-asistencia.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcepcionesAsistenciaComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  editExcepcionAsistenciaCodigo = signal(0)
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listExcepcionesAsistencia$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  selectedIndex = signal(0)
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)

//   childAlta = viewChild.required<ExcepcionesAsistenciaFormComponent>('excepAsistFormAlta')
//   childDeta = viewChild.required<ExcepcionesAsistenciaFormComponent>('excepAsistFormDeta')
//   childEdit = viewChild.required<ExcepcionesAsistenciaFormComponent>('excepAsistFormEdit')

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)
  startFilters = signal<any[]>([])

  columns$ = this.apiService.getCols('/api/excepciones-asistencia/cols')
  tableLoading$ = new BehaviorSubject(false);

  // firstFilter = false

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.selectedDate()

    effect(async () => {
      const anio = this.anio()
      const mes = this.mes()
      this.listExcepcionesAsistencia$.next('')
    }, { injector: this.injector });
  }

  gridData$ = this.listExcepcionesAsistencia$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListExcepcionesAsistencia(this.listOptions, this.periodo())
        .pipe(
            map(data => { return data.list }),
            doOnSubscribe(() => this.tableLoading$.next(true)),
            tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    //   columnTotal('CantidadExcepcionAsistenciaes', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    console.log("handleSelectedRowsChanged", e)
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id) {
      this.editExcepcionAsistenciaCodigo.set(row.id)
      // Asegurar que el componente de edición se inicialice si ya está visible
      if (this.selectedIndex() === 2) {
        // this.childEdit().viewRecord(false)
      }
    }

  }

  reloadListado() {
    this.listExcepcionesAsistencia$.next('')
    this.selectedIndex.set(1)
  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listExcepcionesAsistencia$.next('')
  }

  async handleAddOrUpdate(event: any) {
    this.listExcepcionesAsistencia$.next('')
    if (event === 'delete') {
      //this.editExcepcionAsistenciaCodigo.set(0)
      this.selectedIndex.set(1)

    }

  }

  goToEdit() {
    if (this.editExcepcionAsistenciaCodigo() > 0) {
      this.selectedIndex.set(2)
    //   this.childEdit().viewRecord(false)
    }
  }

  goToDetail() {
    if (this.editExcepcionAsistenciaCodigo() > 0) {
      this.selectedIndex.set(3)
    //   this.childDeta().viewRecord(true)
    }
  }

  goToAdd() {
    this.selectedIndex.set(4)
    // this.childAlta().newRecord()
  }

  async deleteExcepcionAsistenciaInput() {

    // await firstValueFrom(this.apiService.deleteExcepcionAsistencia(this.editExcepcionAsistenciaCodigo()))
    this.listExcepcionesAsistencia$.next('')
  }

  selectedDate (){
    const now = new Date(); //date
    const anio =
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear();
    const mes =
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;
    this.periodo.set(new Date(anio, mes, 1))
  }
}