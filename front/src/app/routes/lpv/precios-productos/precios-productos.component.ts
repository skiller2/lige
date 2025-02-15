import { CommonModule } from '@angular/common';
//import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../../app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../../../../app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, map, of, switchMap, tap, timer } from 'rxjs';
import { SearchService } from '../../../../app/services/search.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectSearchComponent } from "../../../shared/select-search/select-search.component"
import { ProductoHistorialDrawerComponent } from '../../../shared//producto-historial-drawer/producto-historial-drawer.component'
import { Component, model, signal, inject } from '@angular/core';


@Component({
  selector: 'app-precios-productos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent,
    ProductoHistorialDrawerComponent
  ],
  templateUrl: './precios-productos.component.html',
  styleUrl: './precios-productos.component.less'
})
export class PreciosProductosComponent {


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  visibleHistorial = model<boolean>(false)
  listPrecios$ = new BehaviorSubject('')
  editProducto = signal<{ codigo: string }[]>([])
  precioVentaId = signal<{ codigo: string }[]>([])
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []

  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  // gridObjEdit!: SlickGrid;
  gridOptionsEdit!: GridOption;

  tipoProducto = []
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listPrecios$.next('')
  }



  columns$ = this.apiService.getCols('/api/precios-productos/cols').pipe(
    switchMap(async (cols) => {
      const tipoProducto = await firstValueFrom(this.searchService.getTipoProducto());  // [{value:'C',label:'Custodia'},{value:'V',label:'Vigilancia'}
      const sucursales = await firstValueFrom(this.searchService.getSucursales());
      return { cols, tipoProducto, sucursales }
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {
        switch (col.id) {
          case 'TipoProductoId':
            col.editor = {
              model: CustomInputEditor,
              params: {
                component: SelectSearchComponent,
              },
              alwaysSaveOnEnterKey: true,
              required: true
            }
            col.params = {
              collection: data.tipoProducto,
            }

            break
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

    const dateToday = new Date();

    this.startFilters = [
      { field: 'desde', condition: 'AND', operator: '<=', value: dateToday, forced: false },
      { field: 'hasta', condition: 'AND', operator: '>=', value: dateToday, forced: false }]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      //            let undoCommandArr:EditCommand[]=[]
      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();

      const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.codigo))

      if (emptyrows.length == 0) {
        await this.addNewItem()
      } else if (emptyrows.length > 1) {
        this.angularGridEdit.gridService.deleteItemById(emptyrows[0].id)
      }
      //Intento grabar si tiene error hago undo

      try {

        if (column.type == FieldType.number || column.type == FieldType.float)
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)
        const producto = row
        console.log('producto', producto);


        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellPrecioProducto(row))
        this.listPrecios$.next('')
        this.rowLocked = false
      } catch (e: any) {
        //Si codigoOld != '' volver a colocar el valor anterior, si codigoOld =='' marcar en rojo el registro 

        console.log('error', e)

        if (row.codigoOld) {
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

        //this.updateTotals(editCommand.editor.args.column.id, this.angularGridEdit)

        this.rowLocked = false
      }
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





  async deleteItem() {

    await firstValueFrom(this.apiService.deleteProducto(this.precioVentaId()))
    this.listPrecios$.next('')
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
    //this.gridObjEdit = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('CantidadProductos', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])

  }

  // async angularGridReadyEdit(angularGrid: any) {
  //   this.angularGridEdit = angularGrid.detail
  //   this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
  //     totalRecords(this.angularGridEdit)
  //     columnTotal('CantidadProductos', this.angularGridEdit)
  //   })

  //   if (this.apiService.isMobile())
  //       this.angularGridEdit.gridService.hideColumnByIds([])
  // }

  openDrawerforConsultHistory(): void {

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
    if (row?.codigo) {
      this.editProducto.set([row.codigo])
      this.precioVentaId.set([row.precioVentaId])
    }


  }

  async onCellChanged(e: any) {
    // await firstValueFrom(
    //   this.apiService.onchangecellPrecioProducto(e.detail.args.item).pipe(
    //     tap(res => {
    //       if (res != "") {
    //         this.listPrecios$.next('');
    //       }
    //     }),
    //     catchError(err => {
    //       //Si codigoOld != '' volver a colocar el valor anterior, si codigoOld =='' marcar en rojo el registro 
    //       console.log('resultado',err)
    //       return of(null);
    //     })
    //   )
    // )
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
}
