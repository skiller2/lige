import { Component, Inject, Output, EventEmitter, computed, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';


interface ListOptions {
  filtros: any[];
  extra: any;
  sort: any;
}


@Component({
  selector: 'app-table-condicion-venta',
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzAffixModule],
  templateUrl: './table-condicion-venta.component.html',
  styleUrl: './table-condicion-venta.component.less',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCondicionVentaComponent implements OnInit {


  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  RefreshCondVenta = input<boolean>(false);
  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 11;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  private dataAngularGrid: [] = [];

  private listOptions: ListOptions = {
    filtros: [],
    sort: null,
    extra: null,
  };

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }


  columns$ = this.apiService.getCols('/api/condiciones-venta/cols');

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => this.apiService.setListCondicionesVenta({ options: this.listOptions }).pipe(
      map(data => {
        this.dataAngularGrid = data.list;
        return data.list;
      }),
      doOnSubscribe(() => this.tableLoading$.next(true)),
      tap({ complete: () => this.tableLoading$.next(false) })
    ))
  );

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  cambios = computed(async () => {
    this.RefreshCondVenta() 
    this.formChange$.next('');
    
  });


  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerCondVenta',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
  }

  listOptionsChange(options: any): void {
    this.listOptions = options;
    this.formChange$.next('');
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-condiciones-venta',
      format: 'xlsx'
    });
  }



}
