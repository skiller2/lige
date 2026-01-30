import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  model,
  input,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap
} from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import {
  AngularGridInstance,
  AngularUtilService,
  SlickGrid,
  GridOption,
  Column
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';

@Component({
  selector: 'app-table-condicion-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzAffixModule],
  templateUrl: './table-condicion-venta.component.html',
  styleUrl: './table-condicion-venta.component.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCondicionVentaComponent implements OnInit {

  // Trigger para recargar la grilla
  // Se emite cada vez que hay cambios de filtros o refresh externo
  formChange$ = new BehaviorSubject('refresh');

  // Estado de loading de la tabla
  tableLoading$ = new BehaviorSubject<boolean>(false);

  // signal desde el padre
  // Se usa para forzar el refresh de la grilla
  RefreshCondVenta = model<boolean>(false);

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 11;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

  // Data actual de la grilla
  dataAngularGrid: [] = [];

  // Período seleccionado (input signal)
  periodo = input<Date>();

  // Objetivo seleccionado
  codobj = model<string>('');

  // Fecha desde aplica
  PeriodoDesdeAplica = model<string>('');

  // Filtros iniciales
  startFilters: { field: string; condition: string; operator: string; value: any; forced:boolean}[]=[]

  // Filtros y orden de la grilla
  listOptions: listOptionsT = {
    filtros: [],
    sort: null
  };

  // IDs de columnas ocultas
  hiddenColumnIds: string[] = [];

  constructor(
    private apiService: ApiService,
    public angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }

  // Effect que escucha el refresh desde el padre
  // Cuando RefreshCondVenta pasa a true, limpia filtros y recarga la grilla
  private refreshEffect = effect(() => {
    
    if (this.RefreshCondVenta()) {
      console.log(' Recargando grilla');
      this.listOptions.filtros = [];
      this.RefreshCondVenta.set(false);
      this.formChange$.next('refresh');
    }

    if (this.periodo()) {
      this.listOptions.filtros = [];
      this.updateStartFiltersFromPeriodo(this.periodo()!);
      this.formChange$.next('refresh');
    }
  });

  // Columnas de la grilla (configuradas desde backend)
  columns$ = this.apiService.getCols('/api/condiciones-venta/cols').pipe(
    map((cols) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols;
    })
  );

  // Data source de la grilla
  // Cada vez que formChange$ emite → se vuelve a pedir la data
  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() =>
      this.apiService
        .setListCondicionesVenta(this.listOptions, this.periodo())
        .pipe(
          map(data => {
            this.dataAngularGrid = data.list;
            console.log('dataAngularGrid...', this.dataAngularGrid);
            return data.list;
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    )
  );

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  // Configuración base de la grilla
  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerCondVenta',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );

    // Ajustes responsive
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;

    // Filtros iniciales: desde <= último día del periodo, hasta >= primer día del periodo
    this.updateStartFiltersFromPeriodo(this.periodo());
  }


  private updateStartFiltersFromPeriodo(periodo: any) {
    const firstDay = new Date(periodo.getFullYear(), periodo.getMonth(), 1)
    const lastDay = new Date(periodo.getFullYear(), periodo.getMonth() + 1, 0)
    this.startFilters = [
      { field: 'ClienteElementoDependienteContratoFechaDesde', condition: 'AND', operator: '<=', value: lastDay, forced: false },
      { field: 'ClienteElementoDependienteContratoFechaHasta', condition: 'AND', operator: '>=', value: new Date(), forced: false }
    ]
  }

  // Cambio de filtros desde el componente de filtros
  listOptionsChange(options: any): void {
    this.listOptions = options;
    this.formChange$.next('filters');
  }

  // Evento cuando la grilla está lista
  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    // Actualiza el total de registros
    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds);
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([]);
  }

  // Exporta la grilla a Excel
  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-condiciones-venta',
      format: 'xlsx'
    });
  }

  // Selección de filas en la grilla
  async handleSelectedRowsChanged(e: any): Promise<void> {
    const selrow = e.detail.args.rows[0];
    const row = this.angularGrid.slickGrid.getDataItem(selrow);

    if (row?.id) {
      this.codobj.set(row.codobj);
      this.PeriodoDesdeAplica.set(row.PeriodoDesdeAplica);
    }
  }
}
