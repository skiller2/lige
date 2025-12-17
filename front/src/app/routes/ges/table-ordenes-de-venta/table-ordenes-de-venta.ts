import { Component, inject, input, model, effect, signal, Injector } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, firstValueFrom, timer } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, FieldType, Editors, SlickGlobalEditorLock, EditCommand, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';
import { CustomFloatEditor } from 'src/app/shared/custom-float-grid-editor/custom-float-grid-editor.component';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  selector: 'app-table-ordenes-de-venta',
  standalone: true,
  imports: [SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-ordenes-de-venta.html',
  styleUrl: './table-ordenes-de-venta.less'
})
export class TableOrdenesDeVentaComponent {

  anio = input<any>(0)
  mes = input<any>(0)
  reloadForm = model<any>(false)
  rowLocked = signal<boolean>(false);
  objetivoIdSelected = model(0)
  private readonly loadingSrv = inject(LoadingService);
  private injector = inject(Injector)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  

  formChange$ = new BehaviorSubject('');
  
  columns$ = this.apiService.getCols('/api/importe-venta-vigilancia/cols').pipe(map((cols) => {
    
    let mapped = cols.map((col: Column) => {
      if (col.id === 'ImporteHoraB' || col.id === 'ImporteHoraA') 
        col.editor= { model: CustomFloatEditor, decimal: 2,params:{},alwaysSaveOnEnterKey: true }

      if (col.id === 'TotalHoraA' || col.id === 'TotalHoraB') 
        col.editor = { model: CustomFloatEditor, decimal: 1, params: {}, alwaysSaveOnEnterKey: true }

      if (col.id === 'Observaciones') 
        col.editor = { model: Editors['text'], alwaysSaveOnEnterKey: true }
      return col
    });
    
    return mapped
  }));

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }
  dataAngularGrid: any
  startFilters: any[] = []

  listOptionsChange(options: any) {
    this.listOptions = options
    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      this.loadingSrv.open({ type: 'spin', text: '' })

      return this.apiService
        .getListOrdenesDeVenta(this.listOptions, this.anio(), this.mes())
        .pipe(
          map(data => {
            this.dataAngularGrid = data.list
            return data.list
          }),
          doOnSubscribe(() => { }),
          tap({
            complete: () => {
               this.loadingSrv.close()
            }
          })
        );
    })
  )

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerOrd', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.editable = true
    this.gridOptions.autoEdit = true
    this.angularGridEdit
    this.gridOptions.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {

        if (column.id !== 'ImporteHoraB' && column.id !== 'ImporteHoraA' && column.id !== 'TotalHoraA' && column.id !== 'TotalHoraB' && column.id !== 'Observaciones') return

      //this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();
      //Intento grabar si tiene error hago undo
      try {
        if (column.type == FieldType.number || column.type == FieldType.float) {
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
          row.Observaciones
        ))
        //row.TotalAFacturar = (row.TotalHoras * row.ImporteHora) + row.ImporteFijo

        const updRecord = {...row,...ret[0]}
        this.angularGridEdit.gridService.updateItemById(row.id, updRecord)

        this.rowLocked.set(false)
      } catch (e: any) {
        // console.log('Error :' , e);

        if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit())
          editCommand.undo();

        this.rowLocked.set(false)
      }
    }

    // Effect para detectar cambios en la fecha y recargar datos
    effect(async () => {
      if (this.anio() && this.mes()) {
        this.formChange$.next('')
      }
      if (this.reloadForm()) {
        this.reloadForm.set(false)
        this.formChange$.next('')
       
      }
    }, { injector: this.injector });

    this.startFilters = [{}]
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
  }

  formChanged(_event: any) {
    this.listOptionsChange(this.listOptions)
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
      filename: 'lista-ordenes-de-venta',
      format: FileType.xlsx
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
    console.log("row", row)
    if (row?.id)
      this.objetivoIdSelected.set(row.ObjetivoId)
  }

}


