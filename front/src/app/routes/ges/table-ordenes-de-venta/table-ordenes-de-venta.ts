import { Component, inject, input, model, effect, signal, Injector } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, firstValueFrom, timer } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, FieldType, Editors, SlickGlobalEditorLock, EditCommand } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';

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

  RefreshLicencia = model<boolean>(false)
  anio = input<any>(0)
  mes = input<any>(0)
  rowLocked = signal<boolean>(false);
  
  private readonly loadingSrv = inject(LoadingService);
  private injector = inject(Injector)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);


  columns$ = this.apiService.getCols('/api/ordenes-de-venta/cols').pipe(map((cols) => {
    let mapped = cols.map((col: Column) => {
      if (col.id === 'ImporteFijo' || col.id === 'ImporteHora' || col.id === 'TotalHoras') {
        col.editor = {
          model: Editors['float'],
          decimal: 2,
          minValue: 0,
          maxValue: 10000000,
          alwaysSaveOnEnterKey: true,
          //   required: true
        }
      }
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
        .getListOrdenesDeVenta({ options: this.listOptions }, this.anio(), this.mes())
        .pipe(
          map(data => {
            this.dataAngularGrid = data.list
            return data.list
          }),
          doOnSubscribe(() => { this.tableLoading$.next(true) }),
          tap({
            complete: () => {
              this.tableLoading$.next(false);  this.loadingSrv.close() } })
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
      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();
      //Intento grabar si tiene error hago undo
      try {
          if (column.type == FieldType.number || column.type == FieldType.float)
              editCommand.serializedValue = Number(editCommand.serializedValue)

          if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

          if (column.id !== 'ImporteFijo' && column.id !== 'ImporteHora' && column.id !== 'TotalHoras') return
          
          editCommand.execute()
          
          while (this.rowLocked()) await firstValueFrom(timer(100));
          row = this.angularGridEdit.dataView.getItemById(row.id)
          
          if (this.xorNumerico(row.ImporteFijo, row.ImporteHora) || row.TotalHoras ) {
            this.rowLocked.set(true)
            await firstValueFrom(this.apiService.setValorFacturacion(
              row.ObjetivoAsistenciaAnoAno,
              row.ObjetivoAsistenciaAnoMesMes,
              row.ObjetivoId,
              row.ImporteHora,
              row.ImporteFijo, 
              row.TotalHoras
            ))
          } 

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
    })

    this.angularGridEdit.slickGrid.onClick.subscribe((e, args) => {

      // var data = this.dataAngularGrid[args.row]

    });


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
        
        if ( !this.xorNumerico(item.ImporteFijo, item.ImporteHora) || !item.TotalHoras ) {
            meta.cssClasses = 'element-add-no-complete';
        } else
            meta.cssClasses = ''

      return meta;
    };
  }

  xorNumerico(a: number, b: number): boolean {
    return (!!a !== !!b);
  }

}


