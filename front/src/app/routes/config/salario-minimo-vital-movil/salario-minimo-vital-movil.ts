import { Component, computed, inject, resource, signal } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { AngularGridInstance, AngularUtilService, Column, Editors, GridOption, EditCommand } from 'angular-slickgrid';
import { firstValueFrom } from 'rxjs';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";

@Component({
  selector: 'app-sueldo-minimo-vital-movil',
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent
  ],
  templateUrl: './salario-minimo-vital-movil.html',
  styleUrl: './salario-minimo-vital-movil.scss',
  providers: [AngularUtilService]
})
export class SalarioMinimoVitalMovil {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  columnDefinitions: Column[] = []

  //listSalarioMinimoVitalMovil$ = new BehaviorSubject('')
  refreshSMVM = signal(0)

  editSalarioMinimoVitalMovilId = signal<number>(0)
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  gridDataInsert: any[] = []
  hasNewItems = signal(false)
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []

  listOptionsChange(options: any) {
    console.log("...........options", options)
    this.listOptions = options
    this.refreshSMVM.update(v => v + 1)
  }

  lastPeriod = signal<Date>(new Date())

  dateChange(val: Date) {
    this.refreshSMVM.update(v => v + 1)
  }

  columns = resource({
    params: () => ({}),
    loader: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await firstValueFrom(this.apiService.getCols('/api/salario-minimo-vital-movil/cols'));
      const list = (response || []).map((col: Column) => {
        switch (col.id) {
          case 'id':
            col.editor = {
              model: Editors['float']
            }
            break;
          case 'SalarioMinimoVitalMovilSMVM':
            col.editor = {
              model: Editors['float']
            }
            break;
          case 'SalarioMinimoVitalMovilDesde':
            // Deshabilitar edición del periodo
            col.editor = undefined;
            // Mostrar solo mes y año (MM/yyyy)
            col.formatter = (_row: number, _cell: number, value: unknown) => {
              if (value == null || value === '') return '';
              const d = new Date(value as string | Date);
              if (isNaN(d.getTime())) return '';
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const y = d.getFullYear();
              return `${m}/${y}`;
            };
            break;
        }
        return col;
      });
      return list;
    }
  })

  columnsData = computed(() => this.columns.value())

  async addNewItem(insertPosition?: 'bottom') {
    const allItems = this.angularGridEdit.dataView.getItems();
    const hasEmptyRow = allItems.some((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull !== 1);
    if (hasEmptyRow) return;

    const newItem1 = this.createNewItem(1)
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  async ngOnInit() {
    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.forceFitColumns = true

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      editCommand.execute()
      
      // Marcar si el registro está completo
      if (row.SalarioMinimoVitalMovilDesde && row.SalarioMinimoVitalMovilSMVM) {
        row.isfull = 1
      } else {
        row.isfull = 2
      }

      // Si es un registro existente (tiene ID) y está completo, actualizarlo inmediatamente
      if (row.SalarioMinimoVitalMovilId && row.isfull === 1) {
        try {
          await firstValueFrom(this.apiService.onchangecellSMVM(row))
          this.refreshSMVM.update(v => v + 1)
        } catch (error) {
          editCommand.undo()
          console.error('Error al actualizar:', error)
          return
        }
      }

      // Nuevo registro completo: guardar al hacer Tab en Importe (sin botón Confirmar)
      const isNewComplete = !row.SalarioMinimoVitalMovilId && row.isfull === 1
      const editedImporte = column?.id === 'SalarioMinimoVitalMovilSMVM'
      if (isNewComplete && editedImporte) {
        try {
          console.log("...........row", row);
          const response = await firstValueFrom(this.apiService.onchangecellSMVM(row))
          const id = response?.data?.SalarioMinimoVitalMovilId
          if (id) {
            row.SalarioMinimoVitalMovilId = id
            row.codigoOld = id
          }
          this.refreshSMVM.update(v => v + 1)
        } catch (error) {
          editCommand.undo()
          console.error('Error al guardar nuevo registro:', error)
          return
        }
      }

      // Si el registro está vacío, eliminarlo
      if (!row.SalarioMinimoVitalMovilDesde && !row.SalarioMinimoVitalMovilSMVM && !row.SalarioMinimoVitalMovilId) {
        this.angularGridEdit.gridService.deleteItem(row)
      } else {
        this.angularGridEdit.gridService.updateItem(row)
      }

      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate()
      this.angularGridEdit.slickGrid.render()

      const allItems = this.angularGridEdit.dataView.getItems()
      this.gridDataInsert = allItems
      const newItems = allItems.filter((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull === 1)
      this.hasNewItems.set(newItems.length > 0)

      // Tras guardar nuevo desde Importe, agregar fila vacía para seguir cargando
      if (isNewComplete && editedImporte) {
        this.addNewItem('bottom')
      }
    }


  }

  async onCellChanged(e: any) {
  }

  grid = resource({
    params: () => ({options: this.listOptions, refresh: this.refreshSMVM() }),
    loader: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const response = await firstValueFrom(this.searchService.getListSMVM(this.listOptions ))
      if (response.list.length > 0){
        // Guardar la fecha de período mayor
        this.lastPeriod.set(response.list[0].SalarioMinimoVitalMovilDesde)
        this.cleanerVariables();
            this.editSalarioMinimoVitalMovilId.set(0)
            const list = (response.list || []).map((item: any) => {
              // Los registros existentes tienen ID y están completos
              if (item.SalarioMinimoVitalMovilId) {
                item.isfull = 1;
                item.codigoOld = item.SalarioMinimoVitalMovilId;
              }
              return item;
            });
            this.gridDataInsert = list;
            const newItems = list.filter((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull === 1);
            this.hasNewItems.set(newItems.length > 0);
            return list;
      }else{
        return [];
      }
    }
  })

  data = computed(() => this.grid.value())


  cleanerVariables() {
    // Limpiar variables si es necesario
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


    const last = new Date(this.lastPeriod());

    const newDate = new Date(
      Date.UTC(
        last.getUTCFullYear(),
        last.getUTCMonth() + 1,
        1,
        12 // ⬅️ MEDIODÍA UTC
      )
    );

    return {
      id: newId,
      isfull: 0,
      SalarioMinimoVitalMovilId: null,
      SalarioMinimoVitalMovilDesde: newDate,
      SalarioMinimoVitalMovilSMVM: null
    };
  }

  updateItemMetadata(previousItemMetadata: any) {
    return (rowNumber: number) => {
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (meta && item && item.isfull) {
        switch (item.isfull) {
          case 2:
            meta.cssClasses = 'element-add-no-complete';
            break;
          case 1:
            meta.cssClasses = 'element-add-complete';
            break;
          default:
            break;
        }
      }
      return meta;
    };
  }

  async angularGridReadyEdit(angularGrid: any) {
    this.cleanerVariables();
    this.angularGridEdit = angularGrid.detail

    setTimeout(() => {
      const allItems = this.angularGridEdit.dataView.getItems();
      if (allItems.length == 0) {
        this.addNewItem("bottom")
      } else {
        // Actualizar hasNewItems basado en los items actuales
        const newItems = allItems.filter((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull === 1);
        this.hasNewItems.set(newItems.length > 0);
      }
    }, 500);

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      //columnTotal('SalarioMinimoVitalMovilSMVM', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)
    if (row?.id) {
      this.editSalarioMinimoVitalMovilId.set(row.id) 
    }
  }

  cleanTable() {
    const allItems = this.angularGridEdit.dataView.getItems();
    const itemsToDelete = allItems.filter((item: any) => item.isfull === 1 && !item.SalarioMinimoVitalMovilId);
    
    itemsToDelete.forEach((item: any) => {
      if (item.id) {
        this.angularGridEdit.gridService.deleteItemById(item.id);
      }
    });

    this.gridDataInsert = [];
  }

  confirmNewItem() {
    const allItems = this.angularGridEdit.dataView.getItems();
    const altas = allItems.filter((f: any) => f.isfull == 1 && !f.SalarioMinimoVitalMovilId);
    
    if (altas.length > 0) {
      // Procesar cada registro completo
      const promises = altas.map(async (item: any) => {
        try {
          const response = await firstValueFrom(this.apiService.onchangecellSMVM(item));
          if (response.data && response.data.SalarioMinimoVitalMovilId) {
            item.SalarioMinimoVitalMovilId = response.data.SalarioMinimoVitalMovilId;
            item.codigoOld = response.data.SalarioMinimoVitalMovilId;
            item.isfull = 1;
            this.angularGridEdit.gridService.updateItem(item);
          }
        } catch (error) {
          console.error('Error al guardar registro:', error);
        }
      });

      Promise.all(promises).then(() => {
        this.hasNewItems.set(false);
        this.refreshSMVM.update(v => v + 1);
        this.cleanTable()
      });
    }
  }

  async deleteItem() {
    try {
      await firstValueFrom(this.apiService.deleteSMVM(this.editSalarioMinimoVitalMovilId()))
      this.refreshSMVM.update(v => v + 1);
    } catch (error) {
      console.error('Error al eliminar registro:', error);
    }
  }

}
