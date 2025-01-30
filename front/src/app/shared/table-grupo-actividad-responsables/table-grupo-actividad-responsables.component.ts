
import { CommonModule } from '@angular/common';
//import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../../../app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, map, of, switchMap, tap, timer } from 'rxjs';
import { SearchService } from '../../../app/services/search.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../../shared/custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectSearchComponent } from "../../shared/select-search/select-search.component"
import { Component, model, signal, inject } from '@angular/core';
import { EditorPersonaComponent } from '../../shared/editor-persona/editor-persona.component';
import { GrupoActividadSearchComponent } from '../grupo-actividad-search/grupo-actividad-search.component';


@Component({
  selector: 'app-table-grupo-actividad-responsables',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent

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
  editResponsable = signal("")
  editFechaHasta = signal("")
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: { field: string; condition: string; operator: string; value: string; forced: boolean }[] = []

  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

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

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer3', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true

    let dateToday = new Date();
    let formattedDate = `${dateToday.getDate().toString().padStart(2, '0')}/${(dateToday.getMonth() + 1).toString().padStart(2, '0')}/${dateToday.getFullYear()}`;

    // this.startFilters = [{field:'GrupoActividadInactivo', condition:'AND', operator:'=', value: '0', forced:false}]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {


      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();

      const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.id))
      // if (emptyrows.length == 0) {
      //   await this.addNewItem()
      // } else if (emptyrows.length > 1) {
      //this.angularGridEdit.gridService.deleteItemById(emptyrows[0].id)
      // }
      //Intento grabar si tiene error hago undo

      try {

        if (column.type == FieldType.number || column.type == FieldType.float)
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)


        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellGrupoActividadResponsables(row))
        this.listGrupoActividadResponsables$.next('')
        this.rowLocked = false
      } catch (e: any) {


        //marcar el row en rojo
        if (row.GrupoActividadNumeroOld) {
          const item = this.angularGridEdit.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEdit.gridService.updateItemById(row.id, item)
        } else {
          //marcar el row en rojo

          this.angularGridEdit.slickGrid.setSelectedRows([]);
          this.angularGridEdit.slickGrid.render();
        }
        this.rowLocked = false
      }
    }
  }

  async addNewItem() {

    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
    this.itemAddActive = true

  }

  async deleteItemResponsable() {

    await firstValueFrom(this.apiService.deleteGrupoActividadResponsables(this.editResponsable(), this.editFechaHasta()))
    this.listGrupoActividadResponsables$.next('')
  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEdit.dataView.getItems();
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
      GrupoActividadDetalle: "",
      GrupoActividadJerarquicoComo: "",
      ApellidoNombrePersona: "",
      GrupoActividadSucursalId: "",
      GrupoActividadJerarquicoDesde: new Date(),
      GrupoActividadJerarquicoHasta: null

    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail


if (this.angularGridEdit.slickGrid.getEditorLock().isActive()) {

  this.angularGridEdit.slickGrid.getEditorLock().commitCurrentEdit();
}
    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('CantidadGrupoActividadResponsables', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])

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
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)

    if (row?.GrupoActividadJerarquicoId) {
      this.editResponsable.set(row.GrupoActividadJerarquicoId)
      this.editFechaHasta.set(row.GrupoActividadJerarquicoHasta)
    }

  }


  updateItemMetadata(previousItemMetadata: any) {


    return (rowNumber: number) => {
      const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (
        item.GrupoActividadNumero == 0 ||
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
}

