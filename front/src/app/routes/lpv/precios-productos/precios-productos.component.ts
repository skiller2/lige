import { CommonModule } from '@angular/common';
//import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../../ges/detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ClientesFormComponent } from "../../ges/clientes-form/clientes-form.component"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SucursalSearchComponent } from "../../../shared/sucursal-search/sucursal-search.component"
import { DescripcionProductoSearchComponent } from "../../../shared/descripcion-producto-search/descripcion-producto-search.component"
import { ProductoHistorialDrawerComponent } from '../../../shared//producto-historial-drawer/producto-historial-drawer.component'



import { Component, SimpleChanges, ViewChild, computed, input, model, signal,inject } from '@angular/core';


@Component({
  selector: 'app-precios-productos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS, 
    CommonModule, 
    FiltroBuilderComponent,
    SucursalSearchComponent,
    DescripcionProductoSearchComponent,ProductoHistorialDrawerComponent
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
  visibleHistorial = model<boolean>(false)
  listPrecios$ = new BehaviorSubject('')
  editProducto = signal<{ codigo: string }[]>([]);
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  complexityLevelList = [true,false];
  angularGridEdit!: AngularGridInstance;
  gridObjEdit!: SlickGrid;
  gridOptionsEdit!: GridOption;

  detailViewRowCount = 1
  excelExportService = new ExcelExportService()

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listPrecios$.next('')
  }

  // columns$ = this.apiService.getCols('/api/precios-productos/cols')

  columns$ = this.apiService.getCols('/api/precios-productos/cols').pipe(map((cols: Column<any>[]) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == 'Codigo') {
        col.formatter =  Formatters['complexObject'],
        col.cssClass =  'text-center',
        col.editor =  {
          model: Editors['text']
        }
        
      }
      if (col.id == 'nombre') {
        col.formatter =  Formatters['complexObject'],
        col.editor = {
          model: Editors['text']
        }
        
      }
      if (col.id == 'TipoProductoDescripcion') {

        col.editor =  {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: DescripcionProductoSearchComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        }
      }
      if (col.id == 'descripcion') {
        col.formatter =  Formatters['complexObject'],
    
        col.editor = {
          model: Editors['text']
        }
        
      }
      if (col.id == 'importe') {
        col.formatter = Formatters['multiple'],
        col.params = {
          formatters: [Formatters['currency']],
        },
        col.cssClass = 'text-right',
        col.editor = {
          model: Editors['float'], decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
        
      }
      if (col.id == 'desde') {
       
        col.cssClass = 'text-center',
        col.formatter =  Formatters['complexObject'],
       // formatter: Formatters.dateIso,
        
        col.editor = {
          model: Editors['date'],
        }
        
      }

      if (col.id == 'hasta') {
       
        col.cssClass = 'text-center',
      
        col.formatter =  Formatters['complexObject'],
       // formatter: Formatters.dateIso,
        
        col.editor = {
          model: Editors['date'],
         
        }
        
        
      }

      if (col.id == 'SucursalDescripcion') {
        col.formatter = Formatters['complexObject'],
        col.editor = {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: SucursalSearchComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        }
        
      }
      return col
    });
    return mapped
  }));

  async ngOnInit(){

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true


    this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
      editCommand.execute()
  

      //this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

      this.angularGridEdit.slickGrid.invalidate();
      this.angularGridEdit.slickGrid.render();

    }
 
  }

  async addNewItem() {
    // if(!this.itemAddActive){
      const newItem1 = this.createNewItem(1);
      this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
      this.itemAddActive = true
    // }else{
    //   this.messageSrv.error('Termine la carga del registro activo, antes de iniciar otra');
    // }
    
  }


  async deleteItem(){

    await firstValueFrom(this.apiService.deleteProducto(this.editProducto()))

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

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('CantidadProductos', this.angularGridEdit)
    })
    
    setTimeout(() => {
      // if (this.gridDataInsert.length == 0)
      //   this.addNewItem("bottom")

    }, 500);

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
  
  }

  openDrawerforConsultHistory(): void{

    this.visibleHistorial.set(true)
        
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
    if (row?.codigo){
      this.editProducto.set([row.precioVentaId])
    }
     

  }

  async onCellChanged(e: any) {
   
      await firstValueFrom(
        this.apiService.onchangecellPrecioProducto(e.detail.args.item).pipe(
          tap(res => {
            if (res != "") {
              this.listPrecios$.next('');
            }
          }),
          catchError(err => {
            return of(null);
          })
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
