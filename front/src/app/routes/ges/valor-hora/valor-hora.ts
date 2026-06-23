import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGlobalEditorLock, EditCommand, Editors } from 'angular-slickgrid';
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
import { Component, signal, inject, resource, computed } from '@angular/core';
import { Selections } from '../../../shared/schemas/filtro';
import { CustomFloatEditor } from '../../../shared/custom-float-grid-editor/custom-float-grid-editor.component';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { TipoAsociadoSearchComponent } from '../../../shared/tipo-asociado-search/tipo-asociado-search';

@Component({
  selector: 'app-precios-productos',
  providers: [AngularUtilService],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    FiltroBuilderComponent,
    TipoAsociadoSearchComponent
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
  // listValorHora$ = new BehaviorSubject('')
  editValorHora = signal<{ valorHoraId: string }[]>([])
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  startFilters = signal<Selections[]>([])


  complexityLevelList = [true, false];
  angularGridEdit!: AngularGridInstance;
  gridOptionsEdit!: GridOption;
  detailViewRowCount = 1
  excelExportService = new ExcelExportService()
  rowLocked: boolean = false;

  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo().getFullYear())
  mes = computed(() => this.periodo().getMonth() + 1)
  categoriasAll: any[] = []
  showAumentoModal = false
  aumentoLoading = false
  aumentoTipo = signal<string>('porcentaje')
  aumentoValor: number | undefined = undefined
  aumentoTipoAsociadoId: string | undefined = undefined
  aumentoPeriodo = signal<Date>(new Date())
  recibosGenerados = signal<boolean>(false)

  getCalculatedPeriodDay(): string {
    const periodo = this.aumentoPeriodo();
    if (!periodo) return '';

    const primerDia = new Date(periodo.getFullYear(), periodo.getMonth(), 1);
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return primerDia.toLocaleDateString('es-ES', opciones);
  }

  async abrirAumentoModal() {
    this.aumentoTipo.set('porcentaje');
    this.aumentoValor = undefined;
    this.aumentoTipoAsociadoId = undefined;
    this.aumentoPeriodo.set(this.periodo());
    this.showAumentoModal = true;
  }

  async aplicarAumento() {
    if (this.aumentoValor == undefined || this.aumentoValor === 0) {
      this.messageSrv.warning('Ingrese un valor');
      return;
    }
    if (!this.aumentoPeriodo()) {
      this.messageSrv.warning('Seleccione un período');
      return;
    }
    if (!this.aumentoTipoAsociadoId) {
      this.messageSrv.warning('Seleccione un tipo de categoría');
      return;
    }
    const anio = this.aumentoPeriodo().getFullYear();
    const mes = this.aumentoPeriodo().getMonth() + 1;
    this.aumentoLoading = true;
    try {
      await firstValueFrom(this.apiService.aumentarValorHora({ anio, mes, tipo: this.aumentoTipo(), valor: this.aumentoValor, tipoAsociadoId: this.aumentoTipoAsociadoId }));
      // this.messageSrv.success('Aumento aplicado correctamente');
      this.showAumentoModal = false;
      this.aumentoValor = undefined;
      this.aumentoTipoAsociadoId = undefined;
      this.gridData.reload()
    } catch (e) {
      // error handled by api service
    } finally {
      this.aumentoLoading = false;
    }
  }

  listOptionsChange(options: any) {
    this.listOptions.set(options)
  }

  columns = toSignal(
    this.apiService.getCols('/api/valor-hora/cols').pipe(
      switchMap(async (cols) => {
        const sucursales = await firstValueFrom(this.searchService.getSucursales());
        const tipoasociado = await firstValueFrom(this.searchService.getTipoAsociadoOptions());
        const categorias = await firstValueFrom(this.searchService.getCategoriasPersonal());
        this.categoriasAll = categorias

        return { cols, sucursales, tipoasociado, categorias }
      }),
      map((data) => {
        let mapped = data.cols.map((col: Column) => {

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
                required: true,
                //                disabled: (row) => !row.TipoAsociadoId,

                //                collectionFilterBy: ((item:any, args:any) => {
                //                  console.log('filtro',args.dataContext)
                //                  return item.TipoAsociadoId === args.dataContext.TipoAsociadoId;
                //                }) as any

              }

              col.formatter = (row, cell, value, columnDef, dataContext) => {
                const item = data.categorias.find((c: any) =>
                  c.value === value &&
                  c.TipoAsociadoId === dataContext.ValorLiquidacionTipoAsociadoId
                );

                return item ? item.label : '';
              }

              col.params = {
                collection: data.categorias,
              }

              break;

            case 'ValorLiquidacionHoraNormal':
              col.editor = {
                model: CustomFloatEditor,
                alwaysSaveOnEnterKey: true,
                required: true,
              }

              break

            default:
              break;
          }

          return col
        });
        return mapped
      }))
    , { initialValue: [] as Column[] }
  )

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

        const rowComplete = !!row?.ValorLiquidacionSucursalId && !!row?.ValorLiquidacionTipoAsociadoId && !!row?.ValorLiquidacionCategoriaPersonalId && row?.ValorLiquidacionHoraNormal > 0
          && row?.ValorLiquidacionHoraNormal != undefined && row?.ValorLiquidacionHoraNormal != null

        if (!rowComplete)
          return


        if (!row.dbid)
          this.rowLocked = true

        const anio = this.periodo().getFullYear()
        const mes = this.periodo().getMonth() + 1
        const response = await firstValueFrom(this.apiService.onchangecellvalorHora({ ...row, anio, mes }))
        this.gridData.reload()
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
    this.angularGridEdit.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
  }

  async selectNewItemRow() {
    const newRowIndex = this.angularGridEdit.dataView.getItems().length - 1
    if (newRowIndex < 0) return

    this.angularGridEdit.slickGrid.setSelectedRows([newRowIndex])
    this.angularGridEdit.slickGrid.scrollRowIntoView(newRowIndex, false)
    this.angularGridEdit.slickGrid.setActiveCell(newRowIndex, 0)
  }

  async deleteItem() {
    const anio = this.periodo().getFullYear()
    const mes = this.periodo().getMonth() + 1
    const ids = this.editValorHora().map((item: any) => item.valorHoraId)
    await firstValueFrom(this.apiService.deleteValorHora({ ids, anio, mes }))
    this.editValorHora.set([])
    this.gridData.reload()
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
      ValorLiquidacionHoraNormal: undefined,
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

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {

      const response = await firstValueFrom(this.apiService.getValorHoraData(params.anio, params.mes, { options: params.options })
        .pipe(map(data => {
          this.recibosGenerados.set(!!data?.recibosGenerados)
          const list = data?.list ?? []
          const newId = list.length + 1
          list.push({
            id: newId,
            ValorLiquidacionSucursalId: "",
            ValorLiquidacionTipoAsociadoId: "",
            ValorLiquidacionCategoriaPersonalId: "",
            ValorLiquidacionHoraNormal: undefined,
          })
          return list
        })))
      return response;
    },
    defaultValue: []
  });

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
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta: any = {
        cssClasses: ''
      };


      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }
      if (!item) return meta;


      if (
        (!item.ValorLiquidacionSucursalId ||
          !item.ValorLiquidacionTipoAsociadoId ||
          !item.ValorLiquidacionCategoriaPersonalId ||
          !item.ValorLiquidacionHoraNormal) && (
          item.ValorLiquidacionSucursalId || item.ValorLiquidacionTipoAsociadoId || item.ValorLiquidacionCategoriaPersonalId || item.ValorLiquidacionHoraNormal
        )

      ) {
        meta.cssClasses = 'element-add-no-complete';
      }
      else
        meta.cssClasses = ''

      if (this.recibosGenerados() && item?.ValorLiquidacionDesde) {
        meta.columns = {
          ...(meta.columns || {}),
          ValorLiquidacionHoraNormal: { cssClass: 'cell-disabled' }
        };
      }

      return meta;
    };
  }

  handleOnBeforeEditCell(e: Event) {
    const { item, grid } = (<CustomEvent>e).detail.args;
    const column: Column = (<CustomEvent>e).detail.args.column

    if (column.id === 'ValorLiquidacionDesde') {
      e.stopImmediatePropagation();
      return false;
    }

    if (column.id === 'ValorLiquidacionHoraNormal' && this.recibosGenerados()) {
      e.stopImmediatePropagation();
      return false;
    }

    const lockedColumns = ['SucursalId', 'TipoAsociadoId', 'CategoriaPersonalId'];
    if (item?.ValorLiquidacionDesde && lockedColumns.includes(String(column.id))) {
      e.stopImmediatePropagation();
      return false;
    }

    if (column.id === 'CategoriaPersonalId') {
      const tipoAsociadoId = item?.ValorLiquidacionTipoAsociadoId
      if (!tipoAsociadoId) {
        this.messageSrv.warning('Seleccione primero un Tipo Asociado')
        e.stopImmediatePropagation()
        return false
      }

      column!.editor!.collection = this.categoriasAll.filter((c: any) => c.TipoAsociadoId == tipoAsociadoId)
    }

    return true;
  }

}
