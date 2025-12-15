import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, EventEmitter, output, effect,  } from '@angular/core';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, timer } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { SearchService } from '../../services/search.service';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, GridOption, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { columnTotal, totalRecords } from "../custom-search/custom-search";
import { NzButtonModule } from 'ng-zorro-antd/button';


type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-sedes-drawer',
    imports: [SHARED_IMPORTS, 
      NzUploadModule, 
      NzAutocompleteModule,
      CommonModule,
      NzButtonModule
    ],
    providers: [AngularUtilService],
    templateUrl: './sedes-drawer.component.html',
    styleUrl: './sedes-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class SedesDrawerComponent {

 
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)

  CentroCapacitacionId = input.required<number>()
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)

  CentroCapacitacion = signal(0)

  options: any[] = [];


  isSaving= model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)

  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});
  listSedes$ = new BehaviorSubject('')
  selectedSede = signal(0)
  angularGridEditSedes!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;
  itemAddActive = false

  CentroCapacitacionName = input.required<string>()

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }

  constructor(
    private searchService: SearchService
  ) {
    
   }

  async ngOnInit(): Promise<void> {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true

  
    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {


      this.angularGridEditSedes.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEditSedes.dataView.getItemMetadata)
      this.angularGridEditSedes.slickGrid.invalidate();

      const emptyrows = this.angularGridEditSedes.dataView.getItems().filter(row => (!row.id))


      try {

        if (column.type == FieldType.number || column.type == FieldType.float)
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEditSedes.dataView.getItemById(row.id)

        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellSede(row))
        this.listSedes$.next('')
      

        this.rowLocked = false
      } catch (e: any) {
        //marcar el row en rojo
        if (row.CentroCapacitacionId && row.CentroCapacitacionSedeId) {
          const item = this.angularGridEditSedes.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEditSedes.gridService.updateItemById(row.id, item)
        } else {
          // marcar el row en rojo
 
          this.angularGridEditSedes.slickGrid.setSelectedRows([]);
          this.angularGridEditSedes.slickGrid.render();
        }
        this.rowLocked = false
      }
   }

  }



  gridData$ = this.listSedes$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListSedes({ options: this.listOptions }, this.CentroCapacitacionId())
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEditSedes = angularGrid.detail


    if (this.angularGridEditSedes.slickGrid.getEditorLock().isActive()) {

      this.angularGridEditSedes.slickGrid.getEditorLock().commitCurrentEdit();
    }
    this.angularGridEditSedes.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEditSedes)
      columnTotal('CantidadSedes', this.angularGridEditSedes)
    })

    if (this.apiService.isMobile())
      this.angularGridEditSedes.gridService.hideColumnByIds([])

  }

  
  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args

    e.stopImmediatePropagation();
    return true;
  }

  handleSelectedRowsChanged(e: any): void {

    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEditSedes.slickGrid.getDataItem(selrow)

    if (row?.CentroCapacitacionId) {

      this.CentroCapacitacion.set(row.CentroCapacitacion)
      this.selectedSede.set(row.CentroCapacitacionSedeId)

    }

  }

  columnsSedes$ = this.apiService.getCols('/api/instituciones/colsEdit')

    updateItemMetadata(previousItemMetadata: any) {


      return (rowNumber: number) => {
        const newCssClass = 'element-add-no-complete';
        const item = this.angularGridEditSedes.dataView.getItem(rowNumber);
        let meta = {
          cssClasses: ''
        };
        if (typeof previousItemMetadata === 'object') {
          meta = previousItemMetadata(rowNumber);
        }
        else
          meta.cssClasses = ''
  
        return meta;
      };
    }


    async addNewItem() {

      const newItem1 = this.createNewItem(1);
      this.angularGridEditSedes.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
      this.itemAddActive = true
  
    }


    createNewItem(incrementIdByHowMany = 1) {
      const dataset = this.angularGridEditSedes.dataView.getItems();
      let highestId = 0;
      dataset.forEach((item: any) => {
        if (item.id > highestId) {
          highestId = item.id;
        }
      });
      const newId = highestId + incrementIdByHowMany;
    
      return {
        id: newId,
        CentroCapacitacionId:this.CentroCapacitacionId(),
        CentroCapacitacionSedeId:0,
        CentroCapacitacionSedeDescripcion: "",
      };
    }


    async deleteItem() {

      await firstValueFrom(this.apiService.deleteSede(this.CentroCapacitacionId(),this.selectedSede()))
      this.listSedes$.next('')
    }
  
}