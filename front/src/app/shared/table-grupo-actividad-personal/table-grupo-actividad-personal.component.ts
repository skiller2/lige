import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, GridOption, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, timer } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { FiltroBuilderComponent } from '../../shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { Component, signal, inject } from '@angular/core'
import { GrupoActividadSearchComponent } from '../grupo-actividad-search/grupo-actividad-search.component';
import { EditorPersonaComponent } from '../../shared/editor-persona/editor-persona.component';

@Component({
  selector: 'app-table-grupo-actividad-personal',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent

  ],
  templateUrl: './table-grupo-actividad-personal.component.html',
  styleUrl: './table-grupo-actividad-personal.component.less'
})
export class TableGrupoActividadPersonalComponent {


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listGrupoActividadPersonal$ = new BehaviorSubject('')

  GrupoActividadId = signal("")
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []


  complexityLevelList = [true, false];
  angularGridEditPersonal!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listGrupoActividadPersonal$.next('')
  }

  columnsPersonal$ = this.apiService.getCols('/api/grupo-actividad/colspersonal').pipe(
    switchMap(async (cols) => {return { cols }}),
    map((data) => {
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

          default:
            break;
        }

        return col
      });
      return mapped
    }));

  async ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainerGAP', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true

    const dateToday = new Date();
    this.startFilters = [
     {field:'GrupoActividadPersonalDesde', condition:'AND', operator:'<=', value: dateToday, forced:false},
     {field:'GrupoActividadPersonalHasta', condition:'AND', operator:'>=', value: dateToday, forced:false}]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {


      this.angularGridEditPersonal.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEditPersonal.dataView.getItemMetadata)
      this.angularGridEditPersonal.slickGrid.invalidate();

      const emptyrows = this.angularGridEditPersonal.dataView.getItems().filter(row => (!row.id))


      try {

        if (column.type == FieldType.number || column.type == FieldType.float)
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEditPersonal.dataView.getItemById(row.id)

        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellGrupoActividadPersonal(row))
        row.GrupoActividadId = response.data.GrupoActividadId
        this.angularGridEditPersonal.gridService.updateItemById(row.id, row)


        if(response.data.PreviousDate){
          this.listGrupoActividadPersonal$.next('')
        }

        this.rowLocked = false
      } catch (e: any) {
        //marcar el row en rojo
        if (row.GrupoActividadId) {
          const item = this.angularGridEditPersonal.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEditPersonal.gridService.updateItemById(row.id, item)
        } else {
          // marcar el row en rojo
 
          this.angularGridEditPersonal.slickGrid.setSelectedRows([]);
          this.angularGridEditPersonal.slickGrid.render();
        }
        this.rowLocked = false
      }
    }
  }

  async addNewItem() {

    const newItem1 = this.createNewItem(1);
    this.angularGridEditPersonal.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    this.itemAddActive = true

  }


  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEditPersonal.dataView.getItems();
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
      ApellidoNombrePersona: "",
      ApellidoNombrePersonaOld: "",
      GrupoActividadPersonalDesde: new Date(),
      GrupoActividadPersonalHasta: null

    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEditPersonal = angularGrid.detail


    if (this.angularGridEditPersonal.slickGrid.getEditorLock().isActive()) {

      this.angularGridEditPersonal.slickGrid.getEditorLock().commitCurrentEdit();
    }
    this.angularGridEditPersonal.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEditPersonal)
      columnTotal('CantidadGrupoActividadPersonal', this.angularGridEditPersonal)
    })

    if (this.apiService.isMobile())
      this.angularGridEditPersonal.gridService.hideColumnByIds([])

  }

  
  gridDataPersonal$ = this.listGrupoActividadPersonal$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListGrupoActividadPersonal({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  handleSelectedRowsChanged(e: any): void {

    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEditPersonal.slickGrid.getDataItem(selrow)

    if (row?.GrupoActividadId) {

      this.GrupoActividadId.set(row.GrupoActividadId)

    }

  }


  updateItemMetadata(previousItemMetadata: any) {


    return (rowNumber: number) => {
      const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEditPersonal.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (
        item.GrupoActividadId == 0 ||
        item.GrupoActividadDetalle === "" ||
        item.GrupoActividadPersonalDesde === "" ||
        item.GrupoActividadPersonalHasta === ""
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

    // if (item.GrupoActividadObjetivoHasta && new Date(item.GrupoActividadPersonalHasta) < new Date(new Date().setHours(0, 0, 0, 0))) {
    //   return false;
    // }

    // if (column.id == 'GrupoActividadPersonalDesde' || column.id == 'GrupoActividadPersonalHasta')
    //   return true

    e.stopImmediatePropagation();
    return false;
  }

}

