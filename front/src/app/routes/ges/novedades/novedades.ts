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
import { NovedadesFormComponent } from '../novedades-form/novedades-form';
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-novedades',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NovedadesFormComponent],
  providers: [AngularUtilService],
  templateUrl: './novedades.html',
  styleUrl: './novedades.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  editNovedadNovedadCodigo = signal(0)
  editNovedadObjetivoId = signal(0)
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listNovedades$ = new BehaviorSubject('')
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

  childAlta = viewChild.required<NovedadesFormComponent>('novedadesFormAlta')
  childDeta = viewChild.required<NovedadesFormComponent>('novedadesFormDeta')
  childEdit = viewChild.required<NovedadesFormComponent>('novedadesFormEdit')

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)
  startFilters = signal<any[]>([])

  columns$ = this.apiService.getCols('/api/novedades/cols')

  // firstFilter = false

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    const filter = await firstValueFrom(this.searchService.getNovedadesFilters())
    this.startFilters.set(filter)

    this.selectedDate()

    effect(async () => {
      const anio = this.anio()
      const mes = this.mes()
      localStorage.setItem('anio',String(anio))
      localStorage.setItem('mes',String(mes))
      this.listNovedades$.next('')
    }, { injector: this.injector });

    this.settingsService.setLayout('collapsed', true)
  }

  gridData$ = this.listNovedades$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListNovedades(this.listOptions, this.periodo())
        .pipe(map(data => { 
          this.cantRegistros.set(data.total)
          return data.list 
        }))
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('CantidadNovedades', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    console.log("handleSelectedRowsChanged", e)
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id) {
      this.editNovedadNovedadCodigo.set(row.id)
      this.editNovedadObjetivoId.set(row.ObjetivoId)
      // Asegurar que el componente de edición se inicialice si ya está visible
      if (this.selectedIndex() === 2) {
        this.childEdit().viewRecord(false)
      }
    }

  }

  reloadListado() {
    this.listNovedades$.next('')
    this.selectedIndex.set(1)
  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listNovedades$.next('')
  }

  async handleAddOrUpdate(event: any) {
    this.listNovedades$.next('')
    if (event === 'delete') {
      //this.editNovedadNovedadCodigo.set(0)
      this.selectedIndex.set(1)

    }

  }

  goToEdit() {
    if (this.editNovedadNovedadCodigo() > 0) {
      this.selectedIndex.set(2)
      this.childEdit().viewRecord(false)
    }
  }

  goToDetail() {
    if (this.editNovedadNovedadCodigo() > 0) {
      this.selectedIndex.set(3)
      this.childDeta().viewRecord(true)
    }
  }

  goToAdd() {
    this.selectedIndex.set(4)
    this.childAlta().newRecord()
  }

  async deleteNovedadInput() {

    await firstValueFrom(this.apiService.deleteNovedad(this.editNovedadNovedadCodigo(), this.editNovedadObjetivoId()))
    this.listNovedades$.next('')
  }

  async generarInforme() {
    this.isLoading.set(true)
    await firstValueFrom(this.apiService.generaInformesNovedades(this.listOptions, this.periodo()))
    this.isLoading.set(false)
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
    this.periodo.set(new Date(anio, mes - 1, 1))
  }
}
