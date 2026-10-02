import { Component, inject, input, model, effect, signal, Injector, resource } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, firstValueFrom, timer } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Editors, SlickGlobalEditorLock, EditCommand, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';
import { CustomFloatEditor } from '../../../shared/custom-float-grid-editor/custom-float-grid-editor.component';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-table-importe-venta-vigilancia',
  standalone: true,
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-importe-venta-vigilancia.html',
  styleUrl: './table-importe-venta-vigilancia.less'
})
export class TableImporteVentaVigilanciaComponent {

  anio = input<any>(0)
  mes = input<any>(0)
  rowLocked = signal<boolean>(false);
  objetivoIdSelected = model(0)
  private readonly loadingSrv = inject(LoadingService);
  private injector = inject(Injector)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  dataAngularGrid: any
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  startFilters = signal<Selections[]>([])

  columns = toSignal(this.apiService.getCols('/api/importe-venta-vigilancia/cols').pipe(map((cols) => {

    let mapped = cols.map((col: Column) => {
      if (col.id === 'ImporteHoraB' || col.id === 'ImporteHoraA')
        col.editor = { model: CustomFloatEditor, decimal: 2, params: {}, alwaysSaveOnEnterKey: true }

      if (col.id === 'TotalHoraA' || col.id === 'TotalHoraB')
        col.editor = { model: CustomFloatEditor, decimal: 1, params: {}, alwaysSaveOnEnterKey: true }

      if (col.id === 'Observaciones' || col.id === 'ComprobanteNumero')
        col.editor = { model: Editors['text'], alwaysSaveOnEnterKey: true }

      return col
    });

    return mapped
  })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio:this.anio(), mes:this.mes() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.getListImporteVentaVigilancia(params.options, params.anio, params.mes));
        response = res.list;
      } catch (error) {}
      
      this.loadingSrv.close()
      return response || [];
    },
    defaultValue: []
  });

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerOrd', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.editable = true
    this.gridOptions.autoEdit = true
    this.angularGridEdit
    this.gridOptions.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {

      if (column.id !== 'ImporteHoraB' && column.id !== 'ImporteHoraA' && column.id !== 'TotalHoraA' && column.id !== 'TotalHoraB' && column.id !== 'Observaciones' && column.id !== 'ComprobanteNumero') return

      //this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();
      //Intento grabar si tiene error hago undo
      try {
        if (column.type == 'number' || column.type == 'float') {
          editCommand.serializedValue = Number(editCommand.serializedValue)
          editCommand.prevSerializedValue = Number(editCommand.prevSerializedValue)
        }
        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()

        while (this.rowLocked()) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)

        this.rowLocked.set(true)
        const ret = await firstValueFrom(this.apiService.setValorFacturacion(
          this.anio(),
          this.mes(),
          row.ObjetivoId,
          row.ImporteHoraA,
          row.ImporteHoraB,
          row.TotalHoraA,
          row.TotalHoraB,
          row.Observaciones,
          row.ComprobanteNumero
        ))
        //row.TotalAFacturar = (row.TotalHoras * row.ImporteHora) + row.ImporteFijo

        const updRecord = { ...row, ...ret[0] }
        this.angularGridEdit.gridService.updateItemById(row.id, updRecord)

        this.rowLocked.set(false)
      } catch (e: any) {
         

        if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit())
          editCommand.undo();

        this.rowLocked.set(false)
      }
    }

  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
  }

  ngOnDestroy() {
  }


  angularGridReady(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)

      columnTotal('AsistenciaHorasN', this.angularGridEdit)
      columnTotal('AsistenciaHorasT', this.angularGridEdit)
      columnTotal('TotalHoraA', this.angularGridEdit)
      columnTotal('TotalHoraB', this.angularGridEdit)
      columnTotal('DiferenciaHoras', this.angularGridEdit)

      columnTotal('TotalAFacturar', this.angularGridEdit)


    })

  }

  valueRowSelectes(value: number) {
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-importe-venta-vigilancia',
      format: 'xlsx'
    });
  }

  updateItemMetadata(previousItemMetadata: any) {
    return (rowNumber: number) => {
      // const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (!this.xorNumerico(item.ImporteFijo, item.ImporteHora) || !item.TotalHoras) {
        meta.cssClasses = 'element-add-no-complete';
      } else
        meta.cssClasses = ''

      return meta;
    };
  }

  xorNumerico(a: number, b: number): boolean {
    return (!!a !== !!b);
  }

  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args;
    return column.editable
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridEdit.slickGrid.getDataItem(selrow)
     
    if (row?.id)
      this.objetivoIdSelected.set(row.ObjetivoId)
  }

}


