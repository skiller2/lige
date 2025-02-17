
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


@Component({
  selector: 'app-table-grupo-actividad-grupos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent
    
  ],
  templateUrl: './table-grupo-actividad-grupos.component.html',
  styleUrl: './table-grupo-actividad-grupos.component.less'
})
export class TableGrupoActividadGruposComponent {


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listGrupoActividad$ = new BehaviorSubject('')
  editGrupo = signal<{ GrupoActividadId: string }[]>([])
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[]=[]

  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listGrupoActividad$.next('')
  }
  
  columns$ = this.apiService.getCols('/api/grupo-actividad/cols').pipe(
    switchMap(async (cols) => {
      const sucursales = await firstValueFrom(this.searchService.getSucursales());
      const inactivo = await firstValueFrom(this.searchService.getInactivo());

      return { cols, sucursales, inactivo }
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {

        switch (col.id) {
          
          case 'GrupoActividadDetalle':
            col.cssClass = "text-row-aling";
            break;
          case 'GrupoActividadNumero':
            col.cssClass = "text-row-aling";
            break;
          case 'GrupoActividadInactivo':
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
              collection: data.inactivo,
            }
            
            break;
          case 'SucursalId':
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
              collection: data.sucursales,
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

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true


     let dateToday = new Date();

      this.startFilters = [{field:'GrupoActividadInactivo', condition:'AND', operator:'=', value: '0', forced:false}]

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

        const response = await firstValueFrom(this.apiService.onchangecellGrupoActividadGrupo(row))
        this.listGrupoActividad$.next('')
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
    this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    this.itemAddActive = true

  }

  async deleteItem() {

    await firstValueFrom(this.apiService.deleteGrupoActividadGrupo(this.editGrupo()))
    this.listGrupoActividad$.next('')
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
      GrupoActividadNumero: "",
      GrupoActividadNumeroOld:"",
      GrupoActividadDetalle:"",
      GrupoActividadInactivo: '0',
      GrupoActividadSucursalId: ""

    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('CantidadGrupoActividadGrupos', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])

  }


  openDrawerforConsultHistory(): void {

    //this.visibleHistorial.set(true)

  }

  async onCellChanged(e: any) {
  }

  gridData$ = this.listGrupoActividad$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListGrupoActividadGrupos({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)

    if (row?.GrupoActividadId) {
      this.editGrupo.set([row.GrupoActividadId])
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

  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args;
    /*
    if (column.id != 'columnaoka') {
      e.stopImmediatePropagation();
      return false
    }
*/
    return true;
  }


}

       