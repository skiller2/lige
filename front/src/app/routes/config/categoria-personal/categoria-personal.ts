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
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-categoria-personal',
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent
  ],
  templateUrl: './categoria-personal.html',
  // styleUrl: './categoria-personal.scss',
  providers: [AngularUtilService]
})
export class CategoriaPersonalComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService)

  refreshGrid = signal(0)

  editCategoriaPersonalId = signal<number>(0)
	editTipoAsociadoId = signal<number>(0)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  gridDataInsert: any[] = []
  hasNewItems = signal(false)
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  startFilters = signal<Selections[]>([])

  columns = resource({
    params: () => ({}),
    loader: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await firstValueFrom(this.apiService.getCols('/api/categoria-personal/cols'));
      const list = (response || []).map((col: Column) => {
        switch (col.id) {
          case 'id':
            // Deshabilitar edición
            col.editor = undefined;
            break;
            
        	case 'TipoAsociadoId':
            col.editor = {
              model: Editors['integer']
            }
            break;
          case 'CategoriaPersonalDescripcion':
            col.editor = {
              model: Editors['text']
            }
            break;
          case 'CategoriaPersonalInactivo':
            col.editor = {
              model: Editors['integer']
            }
            break;
        }
        return col;
      });
      return list;
    }
  })

  columnsGrid = computed(() => this.columns.value())

  // Campos obligatorios para poder persistir una fila
  private readonly camposRequeridos = [
    'CategoriaPersonalDescripcion',
		'CategoriaPersonalInactivo'
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
      this.angularGrid.gridService.updateItem(row)
      this.repintarGrilla()
      this.refreshPendientes()
      return false
    }

    const esNuevo = !row.TipoAsociadoId
    try {
      const response = await firstValueFrom(this.apiService.onchangecellCP(row))
      const id = response?.data?.TipoAsociadoId
      if (id) {
        row.TipoAsociadoId = id
        row.codigoOld = id
      }
      row.isDirty = false
      row.hasError = false
      row.isfull = 1
      this.angularGrid.gridService.updateItem(row)
      this.repintarGrilla()
      this.refreshPendientes()

      // No se recarga la grilla para no pisar lo que el usuario esté editando en otra fila
      if (esNuevo) {
        this.addNewItem('bottom')
      }
      return true
    } catch (error) {
      // El backend rechazó la fila: queda pendiente y marcada, el mensaje lo muestra la notificación
      row.hasError = true
      this.angularGrid.gridService.updateItem(row)
      this.repintarGrilla()
      this.refreshPendientes()
      return false
    }
  }

  private repintarGrilla() {
    this.angularGrid.slickGrid.invalidate()
    this.angularGrid.slickGrid.render()
  }

  // Marca si quedan filas completas sin persistir
  private refreshPendientes() {
    const allItems = this.angularGrid.dataView.getItems()
    this.gridDataInsert = allItems
    this.hasNewItems.set(allItems.some((item: any) => item.isDirty && this.isRowComplete(item)))
  }

  async addNewItem(insertPosition?: 'bottom') {
    const allItems = this.angularGrid.dataView.getItems();
    const hasEmptyRow = allItems.some((item: any) => !item.TipoAsociadoId && item.isfull !== 1);
    if (hasEmptyRow) return;

    const newItem1 = this.createNewItem(1)
    this.angularGrid.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  async selectNewItemRow() {
    await this.addNewItem()

    const items = this.angularGrid.dataView.getItems()
    const emptyRowIndex = items.findIndex((item: any) => !item.TipoAsociadoId && item.TipoAsociadoDescripcion == null)

    const targetIndex = emptyRowIndex >= 0 ? emptyRowIndex : 0
    if (items.length === 0) return

    this.angularGrid.slickGrid.setSelectedRows([targetIndex]);
    this.angularGrid.slickGrid.scrollRowIntoView(targetIndex, false)
    this.angularGrid.slickGrid.setActiveCell(targetIndex, 0)
  }

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.editable = true
    this.gridOptions.autoEdit = true
    this.gridOptions.forceFitColumns = true

    // No persiste nada: solo marca la fila como pendiente. El guardado ocurre al salir de la fila
    this.gridOptions.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      editCommand.execute()

      // Marcar si el registro está completo
      row.isfull = this.isRowComplete(row) ? 1 : 2
      row.isDirty = true
      row.hasError = false

      // Si el registro está vacío, eliminarlo
      if (!row.TipoAsociadoDescripcion) {
        this.angularGrid.gridService.deleteItem(row)
      } else {
        this.angularGrid.gridService.updateItem(row)
      }

      this.repintarGrilla()
      this.refreshPendientes()
    }


  }

  async onCellChanged(e: any) {
  }

  grid = resource({
    params: () => ({options: this.listOptions(), refresh: this.refreshGrid() }),
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      let list:any = []
      await new Promise(resolve => setTimeout(resolve, 500))
      const response = await firstValueFrom(this.searchService.getListCP(params.options))
      if (response.list.length > 0){
        this.cleanerVariables();
            this.editCategoriaPersonalId.set(0)
						this.editTipoAsociadoId.set(0)
            list = (response.list || []).map((item: any) => {
              // Los registros existentes tienen ID y están completos
              if (item.id) {
                item.TipoAsociadoId = item.id;
                item.isfull = 1;
                item.codigoOld = item.id;
                item.isDirty = false;
              }
              return item;
            });
            this.gridDataInsert = list;
            // Lo recién traído de la base no tiene cambios pendientes
            this.hasNewItems.set(false);
      }
      this.loadingSrv.close()
      return list
    }
  })

  data = computed(() => this.grid.value())


  cleanerVariables() {
    // Limpiar variables si es necesario
  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGrid.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;

    return {
      id: newId,
      isfull: 0,
      isDirty: false,
      TipoAsociadoId: null,
      TipoAsociadoDescripcion: null,
      TipoAsociadoAsigna: 'R',
      TipoAsociadoTieneAsistencia: 'S',
      Categorias: ''
    };
  }

  updateItemMetadata(previousItemMetadata: any) {
    return (rowNumber: number) => {
      const item = this.angularGrid.dataView.getItem(rowNumber);
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

  async angularGridReady(angularGrid: any) {
    this.cleanerVariables();
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata)

    setTimeout(() => {
      const allItems = this.angularGrid.dataView.getItems();
      if (allItems.length == 0) {
        this.addNewItem("bottom")
      } else {
        this.refreshPendientes()
      }
    }, 500);

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      //columnTotal('TipoAsociadoDescripcion', this.angularGrid)
    })

    // El guardado se dispara recién cuando el usuario sale de la fila
    this.angularGrid.slickGrid.onActiveCellChanged.subscribe(async (e: any, args: any) => {
      const filaActual = args?.row != null ? this.angularGrid.dataView.getItem(args.row) : null
      const idActual = filaActual?.id ?? null

      if (this.activeRowId !== null && this.activeRowId !== idActual) {
        const filaAnterior = this.angularGrid.dataView.getItemById(this.activeRowId)
        await this.saveRow(filaAnterior)
      }
      this.activeRowId = idActual
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id) {
			const [tipoAsociadoId, categoriaPersonalId] = row.id.split('-')
      this.editCategoriaPersonalId.set(categoriaPersonalId)
      this.editTipoAsociadoId.set(tipoAsociadoId)
    }
  }

  cleanTable() {
    const allItems = this.angularGrid.dataView.getItems();
    const itemsToDelete = allItems.filter((item: any) => item.isfull === 1 && !item.SalarioMinimoVitalMovilId);
    
    itemsToDelete.forEach((item: any) => {
      if (item.id) {
        this.angularGrid.gridService.deleteItemById(item.id);
      }
    });

    this.gridDataInsert = [];
  }

  // Red de seguridad: persiste las filas pendientes cuando el usuario no llegó a salir de la fila
  async confirmNewItem() {
    const pendientes = this.angularGrid.dataView.getItems()
      .filter((item: any) => item.isDirty && this.isRowComplete(item));

    // Secuencial: la validación de período consecutivo del backend no tolera altas en paralelo
    for (const item of pendientes) {
      await this.saveRow(item);
    }

    this.refreshPendientes();
  }

  async deleteItem() {
    try {
      await firstValueFrom(this.apiService.deleteCP(this.editCategoriaPersonalId(), this.editTipoAsociadoId()))
      this.refreshGrid.update(v => v + 1);
    } catch (error) {}
  }

}