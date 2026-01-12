import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';

// icons
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { PauseOutline } from '@ant-design/icons-angular/icons';
import { DetallePersonaComponent } from "../detalle-persona/detalle-persona.component";

@Component({
  selector: 'app-excepciones-asistencia',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, DetallePersonaComponent],
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
  anio = computed(() => this.periodo() ? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo() ? this.periodo().getMonth() + 1 : 0)
  loadingApr = signal(false)
  loadingRec = signal(false)
  loadingPen = signal(false)
  rowsError = signal<number[]>([])
  rows = signal<number[]>([])
  personalId = signal(0)
  visibleDetalle = model<boolean>(false)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)
  startFilters = signal<any[]>([])
  hiddenColumnIds: string[] = [];

  columns$ = this.apiService.getCols('/api/excepciones-asistencia/cols').pipe(map((cols: Column<any>[]) => {
    this.hiddenColumnIds = [];
    return cols.map(col => (
      (col as any).showGridColumn === false && this.hiddenColumnIds.push(col.id as string),
      col.id === 'ObjetivoDescripcion' ? { ...col, asyncPostRender: this.renderAngularComponent.bind(this) } : col
    ));
  }));

  tableLoading$ = new BehaviorSubject(false);

  // firstFilter = false

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true

    this.gridOptions.rowSelectionOptions = {
      selectActiveRow: false
    }

    this.startFilters.set([
      { field: 'PersonalArt14Autorizado', condition: 'AND', operator: '=', value: 'P', forced: false },
    ])

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

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    this.rows.set(e.detail.args.rows)
    const selectedRows = this.angularGrid.dataView.getAllSelectedFilteredIds();

    if (selectedRows.length === 1) {
      // si queda solo uno seleccionado, poner ese PersonalId
      const idx = this.angularGrid.dataView.getRowById(selectedRows[0]);
      const item = this.angularGrid.dataView.getItemByIdx(idx ?? 0);
      this.personalId.set(item?.PersonalId ?? 0);
    } else {
      // si hay más de uno, dejar el ultimo seleccionado o limpiar si no hay ninguno
      if (selectedRows.length > 1) {
        // tomar el seleccionado en la posicion mas reciente del evento changedSelectedRows
        const lastRowNum = e.detail.args.changedSelectedRows[e.detail.args.changedSelectedRows.length - 1];
        const item = this.angularGrid.dataView.getItemByIdx(lastRowNum);
        this.personalId.set(item?.PersonalId ?? 0);
      } else {
        this.personalId.set(0);
      }
    }
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
    // const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
    const reg = this.angularGrid.dataView.getAllSelectedItems().map((obj:any) => {
        return {
          PersonalArt14Id: obj.PersonalArt14Id,
          PersonalId: obj.PersonalId,
          ObjetivoId: obj.ObjetivoId,
          Art14ConceptoId: obj.PersonalArt14ConceptoId,
          Art14FormaArt14: obj.PersonalArt14FormaArt14
        }
      })
    try {
      const res: any = await firstValueFrom(this.apiService.excepcionesAsistenciaAprobar({ ids: reg, rows: this.rows() }))
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

  selectedDate() {
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

  closeDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(false)
  }

  openDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(true)
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ObjetivoDescripcion':
        Object.assign(componentOutput.componentRef.instance, { link: '/ges/carga_asistencia', params: { ObjetivoId: dataContext.ObjetivoId }, detail: cellNode.innerText })

        break;

      default:
        break;
    }

    cellNode.replaceChildren(componentOutput.domElement)
  }
}