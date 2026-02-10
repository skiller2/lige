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
import { ProductoHistorialDrawerComponent } from '../../ges/producto-historial-drawer/producto-historial-drawer.component'
import { Component, model, signal, inject, computed } from '@angular/core';
import { EditorClienteComponent } from '../../../shared/editor-cliente/editor-cliente';
import { ProductosImportacionMasivaComponent } from '../productos-importacion-masiva/productos-importacion-masiva';

@Component({
    selector: 'app-precios-productos',
    providers: [AngularUtilService],
    imports: [
        ...SHARED_IMPORTS,
        CommonModule,
        FiltroBuilderComponent,
        ProductoHistorialDrawerComponent,
        ProductosImportacionMasivaComponent
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
  periodo = signal(new Date())
  anio = computed(() => this.periodo() ? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo() ? this.periodo().getMonth() + 1 : 0)
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters: any[] = []
  selectedRows = signal<number[]>([])
  loadingDel = signal(false)

  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  // gridObjEdit!: SlickGrid;
  gridOptionsEdit!: GridOption;
  hiddenColumnIds: string[] = [];

  tipoProducto = []
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listPrecios$.next('')
  }

  refreshList(){
    this.listPrecios$.next('')
  }

  columns$ = this.apiService.getCols('/api/productos/cols-precios').pipe(
    switchMap(async (cols) => {
      const productos = await firstValueFrom(this.searchService.getProductos());
      return { cols, productos }
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {
        if ((col as any).showGridColumn === false) {
          this.hiddenColumnIds.push(col.id as string)
        }
        switch (col.id) {
          case 'ProductoCodigo':
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
              collection: data.productos,
            }

            break
          case 'Cliente':
            col.editor = {
              model: CustomInputEditor,
              collection: [],
              params: {
                component: EditorClienteComponent,
              },
              alwaysSaveOnEnterKey: true,
              required: true
            }
            col.params = {
              complexFieldLabel: 'Cliente.fullName',
            }

            break
          default:
            break;
        }
        return col
      });
      return mapped
    })
  );

  gridData$ = this.listPrecios$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListaPrecioProductos({ options: this.listOptions, anio:this.anio(), mes:this.mes() })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  );

  async ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.forceFitColumns = true
    this.gridOptionsEdit.enableCheckboxSelector = true

    const dateToday = new Date();

    this.startFilters = [
      { field: 'desde', condition: 'AND', operator: '<=', value: dateToday, forced: false },
      { field: 'hasta', condition: 'AND', operator: '>=', value: dateToday, forced: false }]

    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      //            let undoCommandArr:EditCommand[]=[]
      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();

      //Verifico si hay filas vacias
      // const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.codigo))
      // if (emptyrows.length == 0) {
      //   await this.addNewItem()
      // } else if (emptyrows.length > 1) {
      //   this.angularGridEdit.gridService.deleteItemById(emptyrows[0].id)
      // }

      //Intento grabar si tiene error hago undo
      try {
        // if (column.type == FieldType.number || column.type == FieldType.float)
        //   editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)
        
        if (!row.Cliente.id || !row.ProductoCodigo.length || !row.PeriodoDesdeAplica || !row.Importe)
          return

        if (!row.dbid)
          this.rowLocked = true

        const response = await firstValueFrom(this.apiService.onchangecellPrecioProducto(row))
        
        if (response.data?.action === 'I') {
          this.listPrecios$.next('')
          this.angularGridEdit.slickGrid.setSelectedRows([]);
        }

        this.rowLocked = false
      } catch (e: any) {
        //Si codigoOld != '' volver a colocar el valor anterior, si codigoOld =='' marcar en rojo el registro 

        if (row.idTable) {
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
    // console.log('regs: ',this.angularGridEdit.dataView.getItems());
    
    // }else{
    //   this.messageSrv.error('Termine la carga del registro activo, antes de iniciar otra');
    // }

  }

  async deleteItem() {
    this.loadingDel.set(true)
    const registros = this.angularGridEdit.dataView.getAllSelectedItems().filter(
      (pro:any) => { return pro.idTable? true : false }
    ).map((pro:any)=>{
      return {
        id: pro.id,
        idTable: pro.idTable,
        ProductoCodigo: pro.ProductoCodigo,
        ProductoCodigoOLD: pro.ProductoCodigoOLD,
        ClienteIdOLD: pro.ClienteIdOLD,
        ClienteDenominacion: pro.ClienteDenominacion,
        PeriodoDesdeAplica: pro.PeriodoDesdeAplica,
        PeriodoDesdeAplicaOLD: pro.PeriodoDesdeAplicaOLD,
        Importe: pro.Importe,
        ImporteOLD: pro.ImporteOLD,
        Cliente: pro.Cliente,
        ClienteFacturacionCUIT: pro.Cliente.ClienteFacturacionCUIT,
    }})
    try {
      await firstValueFrom(this.apiService.deleteProductos({list:registros, length:registros.length}))
      this.angularGridEdit.slickGrid.setSelectedRows([]);
      this.listPrecios$.next('')
    } catch (error) {
      
    }
    this.loadingDel.set(false)
  }

  createNewItem(incrementIdByHowMany:number = 1) {
    const dataset = this.angularGridEdit.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId:number = Number(highestId) + incrementIdByHowMany;
    let isfull = 0

    return {
      id: newId.toString(),
      ClienteFacturacionCUIT: null,
      Cliente: {},
      ProductoCodigo: '',
      Importe: null,
      PeriodoDesdeAplica: new Date(this.anio(),this.mes()-1,1,0,0,0,0),
    };
  }

  async angularGridReadyEdit(angularGrid: any) {
    this.angularGridEdit = angularGrid.detail
    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGridEdit.gridService.hideColumnByIds(this.hiddenColumnIds);
    }

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])

  }

  openDrawerforConsultHistory(): void {
    this.visibleHistorial.set(true)
  }

  handleSelectedRowsChanged(e: any): void {
    const rows = e.detail.args.rows
    this.selectedRows.set(rows)
  }

  //Actualiza el CSS de las filas de la grilla
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

      if (!item?.Cliente.id || !item?.ProductoCodigo.length || !item?.PeriodoDesdeAplica || !item?.Importe) {
        meta.cssClasses = 'element-add-no-complete'
      }
      else
        meta.cssClasses = ''

      return meta;
    };
  }
}
