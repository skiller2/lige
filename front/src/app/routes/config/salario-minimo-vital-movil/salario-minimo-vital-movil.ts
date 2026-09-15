import { Component, computed, inject, resource, signal } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { AngularGridInstance, AngularUtilService, Column, Editors, GridOption, EditCommand } from 'angular-slickgrid';
import { firstValueFrom } from 'rxjs';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { CustomFloatEditor } from '../../../shared/custom-float-grid-editor/custom-float-grid-editor.component';

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
          case 'SalarioMinimoVitalMovilCuotas':
            // Sin mínimo: el valor se deja cargar y el error lo devuelve el backend al guardar
            col.editor = {
              model: Editors['integer']
            }
            break;
          case 'SalarioMinimoVitalMovilSuscripcionInicial':
            // Limita el tipeo a números y a dos decimales
            col.editor = {
              model: CustomFloatEditor,
              decimal: 2,
              params: {},
              alwaysSaveOnEnterKey: true
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

  // Campos obligatorios para poder persistir una fila
  private readonly camposRequeridos = [
    'SalarioMinimoVitalMovilDesde',
    'SalarioMinimoVitalMovilSMVM',
    'SalarioMinimoVitalMovilCuotas',
    'SalarioMinimoVitalMovilSuscripcionInicial'
  ]

  // Id de la fila con la celda activa, para detectar cuando el usuario se va de la fila
  private activeRowId: any = null

  // Un 0 es un valor válido, por eso no se evalúa por truthy
  private isRowComplete(row: any): boolean {
    return this.camposRequeridos.every(campo => row?.[campo] !== null && row?.[campo] !== undefined && row?.[campo] !== '')
  }

  // Persiste la fila solo si tiene cambios pendientes y está completa
  private async saveRow(row: any): Promise<boolean> {
    if (!row || !row.isDirty) return false

    if (!this.isRowComplete(row)) {
      row.isfull = 2
      this.angularGridEdit.gridService.updateItem(row)
      this.refreshPendientes()
      return false
    }

    const esNuevo = !row.SalarioMinimoVitalMovilId
    try {
      const response = await firstValueFrom(this.apiService.onchangecellSMVM(row))
      const id = response?.data?.SalarioMinimoVitalMovilId
      if (id) {
        row.SalarioMinimoVitalMovilId = id
        row.codigoOld = id
      }
      row.isDirty = false
      row.hasError = false
      row.isfull = 1
      this.angularGridEdit.gridService.updateItem(row)
      this.refreshPendientes()

      // No se recarga la grilla para no pisar lo que el usuario esté editando en otra fila
      if (esNuevo) {
        this.lastPeriod.set(row.SalarioMinimoVitalMovilDesde)
        this.addNewItem('bottom')
      }
      return true
    } catch (error) {
      // El backend rechazó la fila: queda pendiente y marcada, el mensaje lo muestra la notificación
      row.hasError = true
      this.angularGridEdit.gridService.updateItem(row)
      this.refreshPendientes()
      return false
    }
  }

  // Marca si quedan filas completas sin persistir
  private refreshPendientes() {
    const allItems = this.angularGridEdit.dataView.getItems()
    this.gridDataInsert = allItems
    this.hasNewItems.set(allItems.some((item: any) => item.isDirty && this.isRowComplete(item)))
  }

  async addNewItem(insertPosition?: 'bottom') {
    const allItems = this.angularGridEdit.dataView.getItems();
    const hasEmptyRow = allItems.some((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull !== 1);
    if (hasEmptyRow) return;

    const newItem1 = this.createNewItem(1)
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  async selectNewItemRow() {
    await this.addNewItem()

    const items = this.angularGridEdit.dataView.getItems()
    const emptyRowIndex = items.findIndex((item: any) => !item.SalarioMinimoVitalMovilId && item.SalarioMinimoVitalMovilSMVM == null)

    const targetIndex = emptyRowIndex >= 0 ? emptyRowIndex : 0
    if (items.length === 0) return

    this.angularGridEdit.slickGrid.setSelectedRows([targetIndex]);
    this.angularGridEdit.slickGrid.scrollRowIntoView(targetIndex, false)
    this.angularGridEdit.slickGrid.setActiveCell(targetIndex, 0)
  }

  async ngOnInit() {
    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.forceFitColumns = true

    // No persiste nada: solo marca la fila como pendiente. El guardado ocurre al salir de la fila
    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      editCommand.execute()

      // Marcar si el registro está completo
      row.isfull = this.isRowComplete(row) ? 1 : 2
      row.isDirty = true
      row.hasError = false

      // Si el registro está vacío, eliminarlo
      if (!row.SalarioMinimoVitalMovilDesde && !row.SalarioMinimoVitalMovilSMVM && !row.SalarioMinimoVitalMovilId) {
        this.angularGridEdit.gridService.deleteItem(row)
      } else {
        this.angularGridEdit.gridService.updateItem(row)
      }

      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate()
      this.angularGridEdit.slickGrid.render()

      this.refreshPendientes()
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
              if (item.id) {
                item.SalarioMinimoVitalMovilId = item.id;
                item.isfull = 1;
                item.codigoOld = item.id;
                item.isDirty = false;
              }
              return item;
            });
            this.gridDataInsert = list;
            // Lo recién traído de la base no tiene cambios pendientes
            this.hasNewItems.set(false);
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
      isDirty: false,
      SalarioMinimoVitalMovilId: null,
      SalarioMinimoVitalMovilDesde: newDate,
      SalarioMinimoVitalMovilSMVM: null,
      SalarioMinimoVitalMovilCuotas: null,
      SalarioMinimoVitalMovilSuscripcionInicial: null
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

      if (meta && item && (item.isfull === 2 || item.hasError)) {
        meta.cssClasses = 'element-add-no-complete';
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
        this.refreshPendientes()
      }
    }, 500);

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      //columnTotal('SalarioMinimoVitalMovilSMVM', this.angularGridEdit)
    })

    // El guardado se dispara recién cuando el usuario sale de la fila
    this.angularGridEdit.slickGrid.onActiveCellChanged.subscribe(async (e: any, args: any) => {
      const filaActual = args?.row != null ? this.angularGridEdit.dataView.getItem(args.row) : null
      const idActual = filaActual?.id ?? null

      if (this.activeRowId !== null && this.activeRowId !== idActual) {
        const filaAnterior = this.angularGridEdit.dataView.getItemById(this.activeRowId)
        await this.saveRow(filaAnterior)
      }
      this.activeRowId = idActual
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

  // Red de seguridad: persiste las filas pendientes cuando el usuario no llegó a salir de la fila
  async confirmNewItem() {
    const pendientes = this.angularGridEdit.dataView.getItems()
      .filter((item: any) => item.isDirty && this.isRowComplete(item));

    // Secuencial: la validación de período consecutivo del backend no tolera altas en paralelo
    for (const item of pendientes) {
      await this.saveRow(item);
    }

    this.refreshPendientes();
  }

  async deleteItem() {
    try {
      await firstValueFrom(this.apiService.deleteSMVM(this.editSalarioMinimoVitalMovilId()))
      this.refreshSMVM.update(v => v + 1);
    } catch (error) {}
  }

}
