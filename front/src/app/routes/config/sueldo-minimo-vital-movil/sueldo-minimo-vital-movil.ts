import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { AngularGridInstance, AngularUtilService, Column, Editors, GridOption, EditCommand } from 'angular-slickgrid';
import { BehaviorSubject, debounceTime, map, switchMap, firstValueFrom } from 'rxjs';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';

@Component({
  selector: 'app-sueldo-minimo-vital-movil',
  imports: [
    ...SHARED_IMPORTS,
    CommonModule
  ],
  templateUrl: './sueldo-minimo-vital-movil.html',
  styleUrl: './sueldo-minimo-vital-movil.scss',
  providers: [AngularUtilService]
})
export class SueldoMinimoVitalMovil {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  columnDefinitions: Column[] = []
  listSalarioMinimoVitalMovil$ = new BehaviorSubject('')
  editSalarioMinimoVitalMovilId = signal<{ codigo: string }[]>([])
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  periodo = signal(new Date())
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  gridDataInsert: any[] = []
  hasNewItems = signal(false)
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []
  anio = signal(0)
  mes = signal(0)

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listSalarioMinimoVitalMovil$.next('')
  }

  dateChange(val: Date) {
        console.log("cambio de periodo 2", val)

    this.anio.set(val.getFullYear())
    this.mes.set(val.getMonth() + 1)
    console.log("anio", this.anio())
    console.log("mes", this.mes())
    console.log("periodo", this.periodo())
    this.listSalarioMinimoVitalMovil$.next('')
  }

  columns$ = this.apiService.getCols('/api/sueldo-minimo-vital-movil/cols').pipe(
    switchMap(async (cols) => {return { cols}
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {
        console.log(col)
        switch (col.id) {
          case 'id':
            col.editor = {
              model: Editors['float']
            }
            break;
          case 'SalarioMinimoVitalMovilDesde':
            col.editor = {
              model: Editors['date'],
              params: {
                datePickerOptions: {
                  format: 'YYYY-MM', 
                  viewMode: 'months',
                  minViewMode: 'months',
                  locale: 'es',
                }
              }
            }
            break;
          case 'SalarioMinimoVitalMovilSMVM':
            col.editor = {
              model: Editors['float']
            }
            break;
        }
        return col
      });
      return mapped
    }));

  async addNewItem(insertPosition?: 'bottom') {
    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  async ngOnInit() {
    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      editCommand.execute()
      
      // Marcar si el registro está completo
      if (row.SalarioMinimoVitalMovilDesde && row.SalarioMinimoVitalMovilSMVM) {
        row.isfull = 1;
      } else {
        row.isfull = 2;
      }

      // Si es un registro existente (tiene ID) y está completo, actualizarlo inmediatamente
      if (row.SalarioMinimoVitalMovilId && row.isfull === 1) {
        try {
          await firstValueFrom(this.apiService.onchangecellSMVM(row));
          this.listSalarioMinimoVitalMovil$.next('')
        } catch (error) {
          editCommand.undo()
          console.error('Error al actualizar:', error)
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
      this.angularGridEdit.slickGrid.invalidate();
      this.angularGridEdit.slickGrid.render();

      // Actualizar gridDataInsert con los datos actuales de la grilla
      const allItems = this.angularGridEdit.dataView.getItems();
      this.gridDataInsert = allItems;
      const newItems = allItems.filter((item: any) => !item.SalarioMinimoVitalMovilId && item.isfull === 1);
      this.hasNewItems.set(newItems.length > 0);

      // Agregar nueva fila si la última está completa y es nueva
      const dataset = this.angularGridEdit.dataView.getItems();
      const lastrow: any = dataset[dataset.length - 1];
      if (lastrow && (lastrow.SalarioMinimoVitalMovilDesde || lastrow.SalarioMinimoVitalMovilSMVM) && !lastrow.SalarioMinimoVitalMovilId) {
        this.addNewItem("bottom")
      }
    }

    const now = new Date()
    this.anio.set(Number(localStorage.getItem('anio')) > 0 ? Number(localStorage.getItem('anio')) : now.getFullYear());
    this.mes.set(Number(localStorage.getItem('mes')) > 0 ? Number(localStorage.getItem('mes')) : now.getMonth() + 1);
    this.periodo.set(new Date(this.anio(), this.mes() - 1, 1))
    this.dateChange(this.periodo())
  }

  async onCellChanged(e: any) {
  }

  gridData$ = this.listSalarioMinimoVitalMovil$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListSMVM({ options: this.listOptions, anio: this.anio(), mes: this.mes() } )
        .pipe(map(data => {
          this.cleanerVariables();
          const list = (data.list || []).map((item: any) => {
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
        })
        )
    })
  )

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

    return {
      id: newId,
      isfull: 0,
      SalarioMinimoVitalMovilId: null,
      SalarioMinimoVitalMovilDesde: null,
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
      columnTotal('SalarioMinimoVitalMovilSMVM', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)
    if (row?.SalarioMinimoVitalMovilId) {
      this.editSalarioMinimoVitalMovilId.set([row.SalarioMinimoVitalMovilId]) 
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
        this.listSalarioMinimoVitalMovil$.next('')
        this.cleanTable()
      });
    }
  }

}
