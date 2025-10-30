import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
// icons
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { PauseOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-excepciones-asistencia',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  providers: [AngularUtilService, ExcelExportService, provideNzIconsPatch([PauseOutline])],
  templateUrl: './excepciones-asistencia.html',
  styleUrl: './excepciones-asistencia.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcepcionesAsistenciaComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listExcepcionesAsistencia$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  loadingApr = signal(false)
  loadingRec = signal(false)
  loadingPen = signal(false)
  rowsError = signal<number[]>([])
  rows = signal<number[]>([])

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
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
    this.gridOptions.enableCheckboxSelector = true

    this.selectedDate()

    effect(async () => {
      const anio = this.anio()
      const mes = this.mes()
      localStorage.setItem('mes', String(mes));
      localStorage.setItem('anio', String(anio));
      this.listExcepcionesAsistencia$.next('')
    }, { injector: this.injector });

    this.settingsService.setLayout('collapsed', true)
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
      columnTotal('PersonalArt14SumaFija', this.angularGrid)
      columnTotal('PersonalArt14Horas', this.angularGrid)
      columnTotal('PersonalArt14AdicionalHora', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    this.rows.set(e.detail.args.rows)
  }

  reloadList() {
    this.listExcepcionesAsistencia$.next('')
  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listExcepcionesAsistencia$.next('')
  }

  async aprobarReg() {
    this.loadingApr.set(true)
    this.rowsError.set([])
    const ids = this.angularGrid.dataView.getAllSelectedIds()
    // console.log(ids,this.rows());
    try {
      const res: any = await firstValueFrom(this.apiService.excepcionesAsistenciaAprobar({ ids: ids, rows: this.rows() }))
      this.listExcepcionesAsistencia$.next('')
    } catch (error: any) {
      let rows: any[] = error.error.data
      // console.log('ERROR:',rows)
      this.rowsError.set(rows)
    }
    this.changeBackgroundColor()
    this.loadingApr.set(false)
  }

  async rechazarReg() {
    this.loadingRec.set(true)
    this.rowsError.set([])
    const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
    // console.log(ids,this.rows());
    try {
      await firstValueFrom(this.apiService.excepcionesAsistenciaRechazar({ ids: ids, rows: this.rows() }))
      this.listExcepcionesAsistencia$.next('')
    } catch (error: any) {
      let rows: any[] = error.error.data
      // console.log('ERROR:',rows)
      this.rowsError.set(rows)
    }
    this.changeBackgroundColor()
    this.loadingRec.set(false)
  }

  async pendienteReg() {
    this.loadingPen.set(true)
    const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
    // console.log(ids,this.rows());
    try {
      const res: any = await firstValueFrom(this.apiService.excepcionesAsistenciaPendiente({ ids: ids, rows: this.rows() }))
      this.listExcepcionesAsistencia$.next('')
    } catch (error: any) {
      let rows: any[] = error.error.data
      // console.log('ERROR:',rows)
      this.rowsError.set(rows)
    }
    this.changeBackgroundColor()
    this.loadingPen.set(false)
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

  changeBackgroundColor() {
    this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata);

    const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
    const rowsError = this.rowsError()
    const newSelectedRows = selectedRows.filter(num => !rowsError.includes(num))
    this.angularGrid.slickGrid.setSelectedRows(newSelectedRows);

    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();
  }

  updateItemMetadata(previousItemMetadata: any) {
    const newCssClass = 'element-add-no-complete';

    return (rowNumber: number) => {
      const item = this.angularGrid.dataView.getItem(rowNumber);

      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
          meta = previousItemMetadata(rowNumber);
      }

      if (meta && item) {
        const row = this.rowsError();
        if (row.find((num) => num == rowNumber)) {
            meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        } else {
            meta.cssClasses = ''
        }
      }

      return meta;
    };
  }
}