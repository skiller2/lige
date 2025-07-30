import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { FacturacionFormComponent } from '../facturacion-form/facturacion-form';
import { LoadingService } from '@delon/abc/loading';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  selector: 'app-facturacion',
  providers: [AngularUtilService],
  imports: [ SHARED_IMPORTS, CommonModule,FiltroBuilderComponent,FacturacionFormComponent],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacturacionComponent {

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance
  gridOptions!: GridOption
  formChange$ = new BehaviorSubject('')
  tableLoading$ = new BehaviorSubject(false)
  gridObj!: SlickGrid
  detailViewRowCount = 1
  private readonly loadingSrv = inject(LoadingService)
  startFilters = signal<any[]>([])
  isDetail = signal(false)

  rowSelected = signal<any[]>([])
  
  // Computed signal que verifica si todos los objetos seleccionados tienen el mismo ClienteFacturacionCUIT
  canEdit = computed(() => {
    const selectedRows = this.rowSelected();
  
    if (!selectedRows || selectedRows.length === 0) {
      return false;
    }
    
    // Obtengo el primer ClienteFacturacionCUIT, ComprobanteNro y ComprobanteTipoCodigo como referencia
    const firstCUIT = selectedRows[0]?.ClienteFacturacionCUIT;
    const firstComprobanteNro = selectedRows[0]?.ComprobanteNro ?? null;
    const firstComprobanteTipoCodigo = selectedRows[0]?.ComprobanteTipoCodigo ?? null;

    if (!firstCUIT) {
      return false;
    }

    // Verifico que todos los objetos tengan el mismo ClienteFacturacionCUIT, ComprobanteNro y ComprobanteTipoCodigo (estos dos últimos pueden ser null)
    return selectedRows.every(row =>
      row?.ClienteFacturacionCUIT === firstCUIT &&
      (row?.ComprobanteNro ?? null) === firstComprobanteNro &&
      (row?.ComprobanteTipoCodigo ?? null) === firstComprobanteTipoCodigo
    );
  });
  
  private angularUtilService = inject(AngularUtilService)
  private apiService = inject(ApiService)

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null
  }


  columns$ = this.apiService.getCols('/api/facturacion/cols').pipe(map((cols) => {
    console.log("cols ", cols)
    return cols
  }));
  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getFacturacion(
          this.listOptions
        )
        .pipe(
          map(data => {
            return data.list
          }),
          doOnSubscribe(() => this.loadingSrv.open()),
          tap({ complete: () => this.loadingSrv.close() })
        );
    })
  )

  ngOnInit() {
 
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.rowSelectionOptions = {
      selectActiveRow: false
  }
  this.gridOptions.cellHighlightCssClass = 'changed'
  this.gridOptions.enableCellNavigation = true

  this.startFilters.set([{ field: 'ComprobanteNro', condition: 'AND', operator: '=', value: null, forced: false },
    { field: 'ComprobanteTipoCodigo', condition: 'AND', operator: '=', value: null, forced: false }
  ])
  }

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('PrecioUnitario', this.angularGrid)
      columnTotal('Cantidad', this.angularGrid)
      columnTotal('ImporteTotal', this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

  }

  handleSelectedRowsChanged(e: any): void {

    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const rowinfo = this.angularGrid.dataView.getItemByIdx(rowNum)
     
      
      const prevSelection = this.rowSelected() || []
      this.rowSelected.set([...prevSelection, rowinfo])
    
    }
    else if (e.detail.args.changedUnselectedRows.length == 1) {
      const rowNum = e.detail.args.changedUnselectedRows[0]
      const rowinfo = this.angularGrid.dataView.getItemByIdx(rowNum)
      const prevSelection = this.rowSelected() || []
      this.rowSelected.set(prevSelection.filter(item => item.id !== rowinfo.id))

    }
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('')
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'listado-facturacion',
      format: FileType.xlsx
    });
  }

}
