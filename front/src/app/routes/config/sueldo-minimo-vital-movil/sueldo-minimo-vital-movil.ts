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
  itemAddActive = false
  listSalarioMinimoVitalMovil$ = new BehaviorSubject('')
  editSalarioMinimoVitalMovilId = signal<{ codigo: string }[]>([])
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  periodo = signal(new Date())
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
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

  async addNewItem() {
    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
    this.itemAddActive = true

  }

  async ngOnInit() {
    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      try {
        editCommand.execute()
        while (this.itemAddActive && !row.SalarioMinimoVitalMovilId) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const updatedRow = this.angularGridEdit.dataView.getItemById(row.id)
        
        if (!updatedRow.SalarioMinimoVitalMovilId) {
          if (!updatedRow.SalarioMinimoVitalMovilDesde || !updatedRow.SalarioMinimoVitalMovilSMVM) {
            return
          }
        }

        const response = await firstValueFrom(this.apiService.onchangecellSMVM(updatedRow))
        
        if (response.data && response.data.SalarioMinimoVitalMovilId) {
          updatedRow.SalarioMinimoVitalMovilId = response.data.SalarioMinimoVitalMovilId
          updatedRow.codigoOld = updatedRow.SalarioMinimoVitalMovilId
        }
        
        this.angularGridEdit.dataView.updateItem(updatedRow.id, updatedRow)
        this.angularGridEdit.slickGrid.updateRow(editCommand.row)
        this.listSalarioMinimoVitalMovil$.next('')
        this.itemAddActive = false
      } catch (e: any) {
        editCommand.undo()
        console.error('Error al guardar:', e)
      }
    }

    
    console.log("cambio de periodo", this.periodo())
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
          return data.list
        })
        )
    })
  )

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
      SalarioMinimoVitalMovilId: null,
      SalarioMinimoVitalMovilDesde: null,
      SalarioMinimoVitalMovilSMVM: null
    };
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

      if (!item.codigoOld) {
        meta.cssClasses = 'element-add-no-complete'
      }
      else
        meta.cssClasses = ''

      return meta;
    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail

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
    if (row?.codigo) {
          this.editSalarioMinimoVitalMovilId.set([row.SalarioMinimoVitalMovilId]) 
    }


  }

}
