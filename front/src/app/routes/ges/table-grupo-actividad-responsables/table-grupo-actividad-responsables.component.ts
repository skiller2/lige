import { CommonModule } from '@angular/common';
//import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Formatters, Editors, GridOption, SlickGrid, OnEventArgs, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, map, of, switchMap, tap, timer } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectSearchComponent } from "../../../shared/select-search/select-search.component"
import { Component, model, signal, inject } from '@angular/core';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { GrupoActividadSearchComponent } from '../../../shared/grupo-actividad-search/grupo-actividad-search.component';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { Selections } from 'src/app/shared/schemas/filtro';


@Component({
  selector: 'app-table-grupo-actividad-responsables',
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent,
    DetallePersonaComponent

  ],
  templateUrl: './table-grupo-actividad-responsables.component.html',
  styleUrl: './table-grupo-actividad-responsables.component.less'
})
export class TableGrupoActividadResponsablesComponent {


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listGrupoActividadResponsables$ = new BehaviorSubject('')
  GrupoActividadJerarquicoId = signal(0)
  GrupoActividadJerarquicoPersonalId = signal(0)
  GrupoActividadId = signal("")
  currPeriodo = signal({ anio: 0, mes: 0 })

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: Selections[] = []
  complexityLevelList = [true, false];
  angularGridEditActividad!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  visibleDrawerPersona = signal(false)

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listGrupoActividadResponsables$.next('')
  }

  columnsResponsable$ = this.apiService.getCols('/api/grupo-actividad/colsresponsables').pipe(
    switchMap(async (cols) => {
      const tipo = await firstValueFrom(this.searchService.getTipo());
      return { cols, tipo }
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {
        switch (col.id) {
          case 'ApellidoNombrePersona':
            col.formatter = Formatters['complexObject'],
              col.exportWithFormatter = true,
              col.editor = {
                model: CustomInputEditor,
                collection: [],
                params: {
                  component: EditorPersonaComponent,
                },
                alwaysSaveOnEnterKey: true,
              },
              col.params = {
                complexFieldLabel: 'ApellidoNombrePersona.fullName',
              }
            break

          case 'GrupoActividadDetalle':
            col.formatter = Formatters['complexObject'],
              col.exportWithFormatter = true,
              col.editor = {
                model: CustomInputEditor,
                collection: [],
                params: {
                  component: GrupoActividadSearchComponent,
                },
                alwaysSaveOnEnterKey: true,
              },
              col.params = {
                complexFieldLabel: 'GrupoActividadDetalle.fullName',
              }
            break

          case 'GrupoActividadJerarquicoComo':
            col.editor = {
              model: CustomInputEditor,
              collection: [],
              params: {
                component: SelectSearchComponent,
              },
              alwaysSaveOnEnterKey: true,
              required: true
            }
            col.params = {
              collection: data.tipo,
            }
            break;

          default:
            break;
        }

        return col
      });
      return mapped
    }));

  async ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainerGAR', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true

    const dateToday = new Date();
    this.currPeriodo.set({ anio: dateToday.getFullYear(), mes: dateToday.getMonth() + 1 })

    this.startFilters = [
      { index: 'GrupoActividadJerarquicoDesde', condition: 'AND', operator: '<=', value: dateToday, closeable: true },
      { index: 'GrupoActividadJerarquicoHasta', condition: 'AND', operator: '>=', value: dateToday, closeable: true }]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      //      if column.id 

      this.angularGridEditActividad.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEditActividad.dataView.getItemMetadata)
      this.angularGridEditActividad.slickGrid.invalidate();

      const emptyrows = this.angularGridEditActividad.dataView.getItems().filter(row => (!row.id))
      // if (emptyrows.length == 0) {
      //   await this.addNewItem()
      // } else if (emptyrows.length > 1) {
      //this.angularGridEdit.gridService.deleteItemById(emptyrows[0].id)
      // }
      //Intento grabar si tiene error hago undo

      try {

        if (column.type == 'number' || column.type == 'float')
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEditActividad.dataView.getItemById(row.id)





        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellGrupoActividadResponsables(row))
        row.GrupoActividadId = response.data.GrupoActividadId
        row.GrupoActividadJerarquicoId = response.data.GrupoActividadJerarquicoId
        row.GrupoActividadDetalleOld = row.GrupoActividadDetalle
        row.ApellidoNombrePersonaOld = row.ApellidoNombrePersona
        row.GrupoActividadJerarquicoComoOld = row.GrupoActividadJerarquicoComo
        this.angularGridEditActividad.gridService.updateItemById(row.id, row)

        if (response.data.PreviousDate) {
          this.listGrupoActividadResponsables$.next('')
        }

        this.rowLocked = false
      } catch (e: any) {

        //marcar el row en rojo
        if (row.GrupoActividadId) {
          const item = this.angularGridEditActividad.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEditActividad.gridService.updateItemById(row.id, item)
        } else {
          // marcar el row en rojo

          this.angularGridEditActividad.slickGrid.setSelectedRows([]);
          this.angularGridEditActividad.slickGrid.render();
        }
        this.rowLocked = false
      }
    }
  }

  async addNewItem() {

    const newItem1 = this.createNewItem(1);
    this.angularGridEditActividad.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    this.itemAddActive = true

  }

  async deleteItemResponsable() {

    await firstValueFrom(this.apiService.deleteGrupoActividadResponsables(this.GrupoActividadJerarquicoId(), this.GrupoActividadId()))
    this.listGrupoActividadResponsables$.next('')
  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEditActividad.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    const currentDate = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    return {
      id: newId,
      GrupoActividadId: 0,
      GrupoActividadDetalle: "",
      GrupoActividadDetalleOld: "",
      GrupoActividadJerarquicoComo: "",
      GrupoActividadJerarquicoComoOld: "",
      ApellidoNombrePersona: "",
      ApellidoNombrePersonaOld: "",
      GrupoActividadSucursalId: "",
      GrupoActividadJerarquicoDesde: firstDay,
      GrupoActividadJerarquicoHasta: null

    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEditActividad = angularGrid.detail


    if (this.angularGridEditActividad.slickGrid.getEditorLock().isActive()) {

      this.angularGridEditActividad.slickGrid.getEditorLock().commitCurrentEdit();
    }
    this.angularGridEditActividad.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEditActividad)
      columnTotal('CantidadGrupoActividadResponsables', this.angularGridEditActividad)
    })

    if (this.apiService.isMobile())
      this.angularGridEditActividad.gridService.hideColumnByIds([])

  }


  openDrawerforConsultHistory(): void {

    //this.visibleHistorial.set(true)

  }

  async onCellChanged(e: any) {
  }

  gridData$ = this.listGrupoActividadResponsables$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListGrupoActividadResponsables({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  handleSelectedRowsChanged(e: any): void {

    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEditActividad.slickGrid.getDataItem(selrow)

    if (row?.GrupoActividadJerarquicoId) {

      this.GrupoActividadJerarquicoId.set(row.GrupoActividadJerarquicoId)
      this.GrupoActividadJerarquicoPersonalId.set(row.GrupoActividadJerarquicoPersonalId)
      this.GrupoActividadId.set(row.GrupoActividadId)

    }

  }


  updateItemMetadata(previousItemMetadata: any) {


    return (rowNumber: number) => {
      const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEditActividad.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (
        !item || item.GrupoActividadNumero == 0 ||
        item.GrupoActividadDetalle === "" ||
        item.GrupoActividadInactivo === "" ||
        item.SucursalId === "" ||
        item.PersonalId === ""
      ) {
        meta.cssClasses = 'element-add-no-complete';
      }
      else
        meta.cssClasses = ''

      return meta;
    };
  }

  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args

    if (item.GrupoActividadId == 0)
      return true

    if (item.GrupoActividadJerarquicoHasta && new Date(item.GrupoActividadJerarquicoHasta) < new Date())
      return false

    if (column.id == 'GrupoActividadJerarquicoDesde' || column.id == 'GrupoActividadJerarquicoHasta')
      return true

    e.stopImmediatePropagation();
    return false;
  }

  openDrawer() {
    if (!this.GrupoActividadJerarquicoId() ) return
    this.visibleDrawerPersona.set(true)

  }

  closeDrawer(): void {
    this.visibleDrawerPersona.set(false);
  }


}

