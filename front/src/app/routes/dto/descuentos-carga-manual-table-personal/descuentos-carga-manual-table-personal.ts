import { ChangeDetectionStrategy, Component, inject, input,signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Formatters, FieldType, Editors } from 'angular-slickgrid';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { NgForm } from '@angular/forms';
import { CustomFloatEditor } from 'src/app/shared/custom-float-grid-editor/custom-float-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';

@Component({
  selector: 'app-descuentos-carga-manual-table-personal',
  imports: [ SHARED_IMPORTS, CommonModule,],
  templateUrl: './descuentos-carga-manual-table-personal.html',
  styleUrl: './descuentos-carga-manual-table-personal.less',
  providers: [AngularUtilService]
})
export class DescuentosCargaManualTablePersonalComponent implements OnInit {

  @ViewChild('descuentosCargaManualTablePersonalForm' , { static: true }) descuentosCargaManualTablePersonalForm: NgForm = new NgForm([], []) 
  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  angularGridEdit!: AngularGridInstance;
  private gridObjEdit!: SlickGrid;
  gridOptionsEdit!: GridOption;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  private readonly detailViewRowCount = 9;
  gridDataInsert = [];
  anio = input<number>(0)
  mes = input<number>(0)
  pDescuentoId = input<number>(0)
  private angularUtilService = inject(AngularUtilService);
  private apiService = inject(ApiService);

  columns$ = this.apiService.getCols('/api/gestion-descuentos/cols/carga-manual-personal').pipe(map((cols) => {
    console.log('cols', cols)

    let mapped = cols.map((col: Column) => {
      if (col.id === 'ApellidoNombre') {
        col.formatter = Formatters['complexObject'],
        col.params = {
          complexFieldLabel: 'ApellidoNombre.fullName',
        },
        col.editor = {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: EditorPersonaComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        }
      }

    if (col.id === 'CantidadCuotas') {
      col.type = FieldType.float,
      col.maxWidth = 250,
      col.editor = {
        model: Editors['text'],
        required: true
      }
    }
    if (col.id === 'ImporteTotal') {
      col.formatter = Formatters['multiple'],
      col.params = {
        formatters: [Formatters['currency']],
        // groupFormatterPrefix: '<b>Total</b>: ' 
      },
      col.cssClass = 'text-right',
      col.editor = {
        model: Editors['float'], decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        required: true
        }
    }
    if (col.id === 'Detalle') {
      col.type = FieldType.string,
      col.maxWidth = 250,
      col.editor = {
        model: Editors['text'],
        required: true
      }
    }
    if (col.id === 'mensaje') {
      col.type = FieldType.string;
      delete col.editor;
    }
        return col
      });
      
      return mapped
    }));


    async ngOnInit() {
  
      this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainercargaManual', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      this.gridOptionsEdit.enableRowDetailView = false
      this.gridOptionsEdit.autoEdit = true
      this.gridOptionsEdit.editable = true 
  
  
      this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
        editCommand.execute()
        // Determina si la fila está completa o incompleta
        if (
          row.ApellidoNombre &&
          row.CantidadCuotas &&
          row.ImporteTotal &&
          row.Detalle
        ) {
          row.isfull = 1; // completa
        } else {
          row.isfull = 2; // incompleta
        }

        // Si todos los campos relevantes están vacíos, elimina la fila; si no, actualiza
        if (
          !row.ApellidoNombre &&
          !row.CantidadCuotas &&
          !row.ImporteTotal &&
          !row.Detalle
        ) {
          this.angularGridEdit.gridService.deleteItem(row);
        } else {
          this.angularGridEdit.gridService.updateItem(row);
        }
  
        this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
        this.angularGridEdit.slickGrid.invalidate();
        this.angularGridEdit.slickGrid.render();
  
        const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
        if (lastrow && (lastrow.ApellidoNombre || lastrow.CantidadCuotas || lastrow.ImporteTotal || lastrow.Detalle))  {
          this.addNewItem("bottom")
        }
      }
  
  
    }

  angularGridReady(angularGrid: any): void {
    this.cleanerVariables();
    this.angularGridEdit = angularGrid.detail
    this.gridObjEdit = angularGrid.detail.slickGrid;

    setTimeout(() => {
      if (this.gridDataInsert.length == 0)
        this.addNewItem("bottom")

    }, 500);

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  }

  addNewItem(insertPosition?: 'bottom') {
    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEdit.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany


    return {
      id: newId,
      isfull: 0,
      periodo: this.anio() + "/" + this.mes(),
      fecha: new Date(),
      DescuentoId: this.pDescuentoId()
    };
  }

  cleanerVariables() {
   
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
      if(item.mensaje){
        meta.cssClasses = 'element-add-no-complete';
      }
      return meta;
    };
  }

  confirmNewItem() {
    
    const altas = this.gridDataInsert.filter((f: any) => f.isfull == 1)
    const valuePeriodo = this.mes() + "/" + this.anio();
    if (altas.length > 0) {
      this.apiService.addDescuentoCargaManualPersonal({ gridDataInsert: altas }, valuePeriodo).subscribe((_res: any) => {
        const list = _res.data.list;

        //  Primero agregar mensajes
        list
          .filter((item: any) => item.isfull == 2 && item.errorMessage)
          .forEach((item: any) => {
            const gridItem = this.angularGridEdit.dataView.getItemById(item.id);
            if (gridItem) {
              gridItem.mensaje = item.errorMessage;
              this.angularGridEdit.dataView.updateItem(item.id, gridItem);
            }
          });
        
        // eliminar los que tienen isfull == 1
        list
          .filter((item: any) => item.isfull == 1)
          .forEach((item: any) => {
            this.angularGridEdit.gridService.deleteItemById(item.id);
            const index = this.gridDataInsert.findIndex((f: any) => f.id === item.id);
            if (index !== -1) {
              this.gridDataInsert.splice(index, 1);
            }
          });
        
        // Limpiar si corresponde
        if (this.gridDataInsert.length > 0 && this.gridDataInsert.every((f: any) => f.isfull == 1)) {
          this.formChange$.next('');
          this.cleanTable();
        }
        
        // Refrescar grid
        this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata);
        this.angularGridEdit.slickGrid.invalidate();
        this.angularGridEdit.slickGrid.render();
      });
    }
  }


  cleanTable() {

    const ids = this.gridDataInsert.filter((f: any) => f.isfull == 1);

    this.gridDataInsert.forEach(objeto => {
      ids.push(objeto["id"]); 
    });

    ids.pop();

    for (let index = 0; index <= ids.length; index++) {

      this.angularGridEdit.gridService.deleteItemById(ids[index]["id"]);

    }

    this.gridDataInsert = [];

  }

  
}
