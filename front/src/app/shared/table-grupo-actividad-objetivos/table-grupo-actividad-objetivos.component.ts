
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, of, switchMap, tap, timer } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { Component, model, signal, inject } from '@angular/core';
import { GrupoActividadSearchComponent } from '../grupo-actividad-search/grupo-actividad-search.component';
import { EditorObjetivoComponent } from '../../shared/editor-objetivo/editor-objetivo.component';

@Component({
  selector: 'app-table-grupo-actividad-objetivos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent

  ],
  templateUrl: './table-grupo-actividad-objetivos.component.html',
  styleUrl: './table-grupo-actividad-objetivos.component.less'
})
export class TableGrupoActividadObjetivosComponent {


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listGrupoActividadObjetivos$ = new BehaviorSubject('')

  GrupoActividadId = signal("")
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []


  complexityLevelList = [true, false];
  angularGridEditObjetivos!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listGrupoActividadObjetivos$.next('')
  }

  columnsObjetivos$ = this.apiService.getCols('/api/grupo-actividad/colsobjetivos').pipe(
    switchMap(async (cols) => {return { cols }}),
    map((data:any) => {
      let mapped = data.cols.map((col: Column) => {
        switch (col.id) {
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

          case 'GrupoObjetivoDetalle':
              col.formatter = Formatters['complexObject'],
                col.exportWithFormatter = true,
                col.editor = {
                  model: CustomInputEditor,
                  collection: [],
                  params: {
                    component: EditorObjetivoComponent,
                  },
                  alwaysSaveOnEnterKey: true,
                },
                col.params = {
                  complexFieldLabel: 'GrupoObjetivoDetalle.fullName',
                }
              break

          default:
            break;
        }

        return col
      });
      return mapped
    }));

  async ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainerGAO', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true

    const dateToday = new Date();
    this.startFilters = [
     {field:'GrupoActividadObjetivoDesde', condition:'AND', operator:'<=', value: dateToday, forced:false},
     {field:'GrupoActividadObjetivoHasta', condition:'AND', operator:'>=', value: dateToday, forced:false}]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {


      this.angularGridEditObjetivos.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEditObjetivos.dataView.getItemMetadata)
      this.angularGridEditObjetivos.slickGrid.invalidate();

      const emptyrows = this.angularGridEditObjetivos.dataView.getItems().filter(row => (!row.id))


      try {

        if (column.type == FieldType.number || column.type == FieldType.float)
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEditObjetivos.dataView.getItemById(row.id)

        if (!row.dbid)
          this.rowLocked = true

        const response:any = await firstValueFrom(this.apiService.onchangecellGrupoActividadObjetivos(row))
        row.GrupoActividadId = response.data.GrupoActividadId
        this.angularGridEditObjetivos.gridService.updateItemById(row.id, row)


        if(response.data.PreviousDate){
          this.listGrupoActividadObjetivos$.next('')
        }

        this.rowLocked = false
      } catch (e: any) {
        //marcar el row en rojo
        if (row.GrupoActividadId) {
          const item = this.angularGridEditObjetivos.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEditObjetivos.gridService.updateItemById(row.id, item)
        } else {
          // marcar el row en rojo
 
          this.angularGridEditObjetivos.slickGrid.setSelectedRows([]);
          this.angularGridEditObjetivos.slickGrid.render();
        }
        this.rowLocked = false
      }
    }
  }

  async addNewItem() {

    const newItem1 = this.createNewItem(1);
    this.angularGridEditObjetivos.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    this.itemAddActive = true

  }


  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEditObjetivos.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    let isfull = 0

    return {
      id: newId,
      GrupoActividadId: 0,
      GrupoActividadDetalle: "",
      GrupoActividadDetalleOld: "",
      GrupoObjetivoDetalle: "",
      GrupoObjetivoDetalleOld: "",
      GrupoActividadObjetivoDesde: new Date(),
      GrupoActividadObjetivoHasta: null

    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEditObjetivos = angularGrid.detail


    if (this.angularGridEditObjetivos.slickGrid.getEditorLock().isActive()) {

      this.angularGridEditObjetivos.slickGrid.getEditorLock().commitCurrentEdit();
    }
    this.angularGridEditObjetivos.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEditObjetivos)
      columnTotal('CantidadGrupoActividadObjetivos', this.angularGridEditObjetivos)
    })

    if (this.apiService.isMobile())
      this.angularGridEditObjetivos.gridService.hideColumnByIds([])

  }

  
  gridDataObjetivos$ = this.listGrupoActividadObjetivos$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListGrupoActividadObjetivos({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  handleSelectedRowsChanged(e: any): void {

    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEditObjetivos.slickGrid.getDataItem(selrow)

    if (row?.GrupoActividadId) {

      this.GrupoActividadId.set(row.GrupoActividadId)

    }

  }


  updateItemMetadata(previousItemMetadata: any) {


    return (rowNumber: number) => {
      const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEditObjetivos.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (
        item.GrupoActividadId == 0 ||
        item.GrupoActividadDetalle === "" ||
        item.GrupoObjetivoDetalle === "" ||
        item.GrupoActividadObjetivoDesde === "" ||
        item.GrupoActividadObjetivoHasta === ""
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

    if (item.GrupoActividadObjetivoHasta)
      return false

    if (column.id == 'GrupoActividadObjetivoDesde' || column.id == 'GrupoActividadObjetivoHasta')
      return true

    e.stopImmediatePropagation();
    return false;
  }

}

