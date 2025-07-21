import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  selector: 'app-facturacion',
  providers: [AngularUtilService],
  imports: [ SHARED_IMPORTS, CommonModule,FiltroBuilderComponent],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacturacionComponent {

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  
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
        .getDocumentos(
          this.listOptions
        )
        .pipe(
          map(data => {
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  )

  ngOnInit() {
 
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


    // this.startFilters.set([{ field: 'fecha', condition: 'AND', operator: '>=', value: fisrtOfMonth, forced: false }])
  }

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      //const docId = this.angularGrid.dataView.getItemByIdx(rowNum)?.id
      //this.docId.set(docId)
    } else {
      //this.docId.set(0)
    }
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('')
  }

}
