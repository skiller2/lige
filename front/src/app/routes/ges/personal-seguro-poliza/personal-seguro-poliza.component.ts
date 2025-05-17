import { ChangeDetectionStrategy, Component, EventEmitter, Inject, LOCALE_ID, model, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';

interface ListOptions {
  filtros: any[];
  extra: any;
  sort: any;
}

@Component({
  selector: 'app-personal-seguro-poliza',
  imports: [ SHARED_IMPORTS, CommonModule,FiltroBuilderComponent],
  templateUrl: './personal-seguro-poliza.component.html',
  styleUrl: './personal-seguro-poliza.component.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalSeguroPolizaComponent {
  
  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  columns$ = this.apiService.getCols('/api/seguros/cols-personal-seguro');
  gridOptions!: GridOption;
  private gridObj!: SlickGrid;
  private dataAngularGrid = [];
  private personalSeguro: any[] = [];
  private readonly detailViewRowCount = 9;
  private excelExportService = new ExcelExportService();
  private angularGridEdit!: AngularGridInstance;
  angularGrid!: AngularGridInstance


  private listOptions: ListOptions = {
    filtros: [],
    sort: null,
    extra: null,
  };

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    @Inject(LOCALE_ID) public locale: string,
    public searchService: SearchService
  ) { }

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => this.apiService.getListPolizaPersonalSeguro({ options: this.listOptions }).pipe(
      map(data => {
        this.dataAngularGrid = data.list;
        return data.list;
      }),
      doOnSubscribe(() => this.tableLoading$.next(true)),
      tap({ complete: () => this.tableLoading$.next(false) })
    ))
  );

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerPersonalSeguro',
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

  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

    this.angularGridEdit.slickGrid.onClick.subscribe((_e: any, args: { row: number }) => {
      this.personalSeguro = [this.dataAngularGrid[args.row]];
    });
  }

  listOptionsChange(options: any): void {
    this.listOptions = options;
    this.formChange$.next('');
  }

 
  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-personal-seguro',
      format: 'xlsx'
    });
  }



}
