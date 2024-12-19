import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../../ges/detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ClientesFormComponent } from "../../ges/clientes-form/clientes-form.component"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SucursalSearchComponent } from "../../../shared/sucursal-search/sucursal-search.component"
import { DescripcionProductoSearchComponent } from "../../../shared/descripcion-producto-search/descripcion-producto-search.component"

@Component({
  selector: 'app-precios-productos',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS, 
    CommonModule, 
    FiltroBuilderComponent,
    SucursalSearchComponent,
    DescripcionProductoSearchComponent
  ],
  templateUrl: './precios-productos.component.html',
  styleUrl: './precios-productos.component.less'
})
export class PreciosProductosComponent {

  
  startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listPrecios$ = new BehaviorSubject('')
  editProducto = signal(0)
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  angularGridEdit!: AngularGridInstance;
  gridObjEdit!: SlickGrid;
  gridOptionsEdit!: GridOption;

  detailViewRowCount = 1
  excelExportService = new ExcelExportService()

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listPrecios$.next('')
  }

  columns$ = this.apiService.getCols('/api/precios-productos/cols')

  async ngOnInit(){

    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: false,
        formatter: Formatters['icon'],
        params: { iconCssClass: 'fa fa-trash pointer' },
        maxWidth: 30,
      },
      {
        id: 'id', name: 'id', field: 'id',
        excludeFromHeaderMenu: false,
        type: FieldType.number,
        width: 0, minWidth: 0, maxWidth: 0, cssClass: "reallyHidden", headerCssClass: "reallyHidden"

      },
      {
        id: 'codigo', name: 'Cod Prodcut', field: 'codigo',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        editor: {
          model: Editors['text']
        },
      },
      {
        id: 'nombre', name: 'Nombre de Prod', field: 'nombre',
        sortable: true,
        type: FieldType.string,
        maxWidth: 150,
        minWidth: 150,
        formatter: Formatters['complexObject'],
        editor: {
          model: Editors['text']

          // required: true
        },
      },
      {
        id: 'descripcionTipoProducto', name: 'Tipo de Prod', field: 'descripcionTipoProducto',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        
        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: DescripcionProductoSearchComponent,
          },
          required: true
        },
      },
      {
        id: 'descripcion', name: 'Descrip de Prod', field: 'descripcion',
        sortable: true,
        type: FieldType.string,
        maxWidth: 150,
        minWidth: 150,
        formatter: Formatters['complexObject'],
    
        editor: {
          model: Editors['text']
        },
      },
      {
        id: 'importe', name: 'Importe', field: 'importe',
        sortable: true,
        type: FieldType.float,
        maxWidth: 200,
        // groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        formatter: Formatters['multiple'],
        params: {
          formatters: [Formatters['currency']],
          // groupFormatterPrefix: '<b>Total</b>: ' 
        },
        cssClass: 'text-right',
        editor: {
          model: Editors['float'], decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
      },
      {
        id: 'activo', name: 'Ind Activo Producto', field: 'activo',
        sortable: true,
        type: FieldType.float,
        maxWidth: 200,
        // groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        formatter: Formatters['multiple'],
        params: {
          formatters: [Formatters['currency']],
          // groupFormatterPrefix: '<b>Total</b>: ' 
        },
        cssClass: 'text-right',
        editor: {
          model: Editors['float'], decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
      },
      {
        id: 'desde', name: 'Desde', field: 'desde',
        sortable: true,
        exportWithFormatter: true,
        type: FieldType.date,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        editor: {
          model: Editors['date']
        },
      },
      {
        id: 'SucursalDescripcion', name: 'Sucursal', field: 'SucursalDescripcion',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        
        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: SucursalSearchComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        },
      },

    ];

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true


    this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
      editCommand.execute()
  

      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

      this.angularGridEdit.slickGrid.invalidate();
      this.angularGridEdit.slickGrid.render();


    }


 
  }

  addNewItem() {
    if(!this.itemAddActive){
      const newItem1 = this.createNewItem(1);
      this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
      this.itemAddActive = true
    }else{
      this.messageSrv.error('Termine la carga del registro activo, antes de iniciar otra');
    }
    
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

    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1; // Agrega 1 porque los meses se indexan desde 0 (0 = enero)
    const anio = fechaActual.getFullYear();

    return {
      id: newId,
      isfull: 0,
      fecha: new Date(),
      detalle: ""

    };
  }

  async angularGridReadyEdit(angularGrid: any) {
    //this.cleanerVariables();
    this.angularGridEdit = angularGrid.detail
    this.gridObjEdit = angularGrid.detail.slickGrid;

    setTimeout(() => {
      // if (this.gridDataInsert.length == 0)
      //   this.addNewItem("bottom")

    }, 500);

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  
  }

  gridData$ = this.listPrecios$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListaPrecioProductos({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
      )
    })
  ) 

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)
    if (row?.id)
      this.editProducto.set(row.id)

  }

  // async angularGridReady(angularGrid: any) {
  //   this.angularGridEdit = angularGrid.detail
  //   this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
  //        totalRecords(this.angularGridEdit)
  //        columnTotal('cantidad', this.angularGridEdit)
  //   })
  //   if (this.apiService.isMobile())
  //       this.angularGridEdit.gridService.hideColumnByIds([])
  // }


  async onCellChanged(e: any) {
   
    await firstValueFrom(this.apiService.onchangecellPrecioProducto(e.detail.args.item).pipe(
      tap(res => this.formChange$.next('')
        )
      )
    )

    

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
}
