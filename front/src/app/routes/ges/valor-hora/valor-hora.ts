import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, timer } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectSearchComponent } from "../../../shared/select-search/select-search.component"
import { Component, signal, inject } from '@angular/core';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { Selections } from '../../../shared/schemas/filtro';
import { CustomFloatEditor } from '../../../shared/custom-float-grid-editor/custom-float-grid-editor.component';


@Component({
  selector: 'app-precios-productos',
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    NzInputNumberModule
  ],
  templateUrl: './valor-hora.html',
  styleUrl: './valor-hora.scss'
})
export class ValorHoraComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  private readonly messageSrv = inject(NzMessageService);
  columnDefinitions: Column[] = []
  itemAddActive = false
  listValorHora$ = new BehaviorSubject('')
  editValorHora = signal<{ valorHoraId: string }[]>([])
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters = signal<Selections[]>([])


  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  periodo = signal<Date>(new Date())
  showAumentoModal = false
  aumentoLoading = false
  aumentoTipo: string = 'porcentaje'
  aumentoValor: number = 0

  aumentoFormatter = (value: number): string => {
    return this.aumentoTipo === 'porcentaje' ? `${value} %` : `$ ${value}`;
  }

  aumentoParser = (value: string): number => {
    return Number(value.replace(/[^0-9.]/g, ''));
  }

  async abrirAumentoModal() {
    this.aumentoTipo = 'porcentaje';
    this.aumentoValor = 0;
    this.showAumentoModal = true;
  }

  async aplicarAumento() {
    if (this.aumentoValor <= 0) {
      this.messageSrv.warning('Ingrese un valor mayor a 0');
      return;
    }
    const anio = this.periodo().getFullYear();
    const mes = this.periodo().getMonth() + 1;
    this.aumentoLoading = true;
    try {
      await firstValueFrom(this.apiService.aumentarValorHora({ anio, mes, tipo: this.aumentoTipo, valor: this.aumentoValor }));
      this.messageSrv.success('Aumento aplicado correctamente');
      this.showAumentoModal = false;
      this.aumentoValor = 0;
      this.listValorHora$.next('');
    } catch (e) {
      // error handled by api service
    } finally {
      this.aumentoLoading = false;
    }
  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listValorHora$.next('')
  }

  refreshList() {
    this.listValorHora$.next('')
  }


  columns$ = this.apiService.getCols('/api/valor-hora/cols').pipe(
    switchMap(async (cols) => {
      const sucursales = await firstValueFrom(this.searchService.getSucursales());
      const tipoasociado = await firstValueFrom(this.searchService.getTipoAsociadoOptions());
      const categorias = await firstValueFrom(this.searchService.getCategoriasPersonal());

      return { cols, sucursales, tipoasociado, categorias }
    }),
    map((data) => {
      let mapped = data.cols.map((col: Column) => {
        console.log(col)
        switch (col.id) {

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

          case 'TipoAsociadoId':
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
              collection: data.tipoasociado,
            }

            break;

          case 'CategoriaPersonalId':
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
              collection: data.categorias,
            }

            break;

          case 'ValorLiquidacionHoraNormal':
            col.editor = {
              model: CustomFloatEditor,
              decimal: 2,
              minValue: 0,
              maxValue: 10000000,
              alwaysSaveOnEnterKey: true,
              required: true
            }
            break

          default:
            break;
        }

        return col
      });
      return mapped
    }));

  async ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true


    let dateToday = new Date();


    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {

      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();

      const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.id))
   
      //Intento grabar si tiene error hago undo

      try {

        if (column.type == 'number' || column.type == 'float')
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)
console.log('row a guardar', row)
          const rowComplete = !!row?.ValorLiquidacionSucursalId && !!row?.ValorLiquidacionTipoAsociadoId && !!row?.ValorLiquidacionCategoriaPersonalId && row?.ValorLiquidacionHoraNormal > 0

        if (!rowComplete)
          return


        if (!row.dbid)
          this.rowLocked = true

        const anio = this.periodo().getFullYear()
        const mes = this.periodo().getMonth() + 1
        const response = await firstValueFrom(this.apiService.onchangecellvalorHora({ ...row, anio, mes }))
        this.listValorHora$.next('')
        this.rowLocked = false
      } catch (e: any) {


        //marcar el row en rojo
        if (row.GrupoActividadNumeroOld) {
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
        this.rowLocked = false
      }
    }
  }

  async addNewItem() {

    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    this.itemAddActive = true

  }

  async deleteItem() {
    const anio = this.periodo().getFullYear()
    const mes = this.periodo().getMonth() + 1
    const ids = this.editValorHora().map((item: any) => item.valorHoraId)
    await firstValueFrom(this.apiService.deleteValorHora({ ids, anio, mes }))
    this.editValorHora.set([])
    this.listValorHora$.next('')
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

    return {
      id: newId,
      ValorLiquidacionSucursalId: "",
      ValorLiquidacionTipoAsociadoId: "",
      ValorLiquidacionCategoriaPersonalId: "",
      ValorLiquidacionHoraNormal: 0,
    };
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('CantidadGrupoActividadGrupos', this.angularGridEdit)
    })

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])

  }


  openDrawerforConsultHistory(): void {

    //this.visibleHistorial.set(true)

  }

  async onCellChanged(e: any) {
  }

  gridData$ = this.listValorHora$.pipe(
    debounceTime(500),
    switchMap(() => {
      const anio = this.periodo().getFullYear()
      const mes = this.periodo().getMonth() + 1
      return this.apiService.getValorHoraData(anio, mes, { options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)

    if (row?.ValorLiquidacionDesde) {
      this.editValorHora.set([{ valorHoraId: row.id }])
    } else {
      this.editValorHora.set([])
    }
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

      if (
        item.ValorLiquidacionSucursalId === "" ||
        item.ValorLiquidacionTipoAsociadoId === "" ||
        item.ValorLiquidacionCategoriaPersonalId === "" ||
        item.ValorLiquidacionHoraNormal === 0

      ) {
        meta.cssClasses = 'element-add-no-complete';
      }
      else
        meta.cssClasses = ''

      return meta;
    };
  }

  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args;
    /*
    if (column.id != 'columnaoka') {
      e.stopImmediatePropagation();
      return false
    }
*/
    return true;
  }

}
