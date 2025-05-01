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
import { PolizaSeguroDrawerComponent } from '../poliza-seguro-drawer/poliza-seguro-drawer.component';

interface ListOptions {
  filtros: any[];
  extra: any;
  sort: any;
}

interface PolizaSeguro {
  id: number;
  TipoSeguroNombre: string;
  PolizaSeguroNroPoliza: string;
  PolizaSeguroNroEndoso: string;
  PolizaSeguroFechaEndoso: string;
}


@Component({
  selector: 'app-poliza-seguro',
  imports: [ SHARED_IMPORTS, CommonModule,FiltroBuilderComponent, PolizaSeguroDrawerComponent],
  templateUrl: './poliza-seguro.component.html',
  styleUrl: './poliza-seguro.component.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolizaSeguroComponent {
  
  @Output() valueGridEvent = new EventEmitter<PolizaSeguro[]>();
  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  columns$ = this.apiService.getCols('/api/seguros/cols-poliza');
  gridOptions!: GridOption;
  private gridObj!: SlickGrid;
  private dataAngularGrid: PolizaSeguro[] = [];
  private polizaSeguro: PolizaSeguro[] = [];
  private readonly detailViewRowCount = 9;
  private excelExportService = new ExcelExportService();
  private angularGridEdit!: AngularGridInstance;
  visibleDrawer = model<boolean>(false)
  angularGrid!: AngularGridInstance
  PolizaSeguroCod = signal<number>(0)

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
    switchMap(() => this.apiService.getListPolizaSeguro({ options: this.listOptions }).pipe(
      map(data => {
        this.dataAngularGrid = data.list;
        return data.list;
      }),
      doOnSubscribe(() => this.tableLoading$.next(true)),
      tap({ complete: () => this.tableLoading$.next(false) })
    ))
  );

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerPoliza',
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
      this.polizaSeguro = [this.dataAngularGrid[args.row]];
      this.valueGridEvent.emit(this.polizaSeguro);
    });
  }

  listOptionsChange(options: any): void {
    this.listOptions = options;
    this.formChange$.next('');
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.PolizaSeguroCod)
      this.PolizaSeguroCod.set(row.id)

  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-poliza-seguro',
      format: 'xlsx'
    });
  }

  

  ////////// Drawer para nuevo /////////////

  async openDrawerForNew() {
    this.visibleDrawer.set(true)
  }
}
