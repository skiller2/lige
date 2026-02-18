import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  model,
  input,
  effect,
  signal,
  resource,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  firstValueFrom,
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
import { Selections } from 'src/app/shared/schemas/filtro';

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
  refreshCondVenta = model<number>(0)


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

  // Objetivo seleccionado (para compatibilidad con selección única)
  codobj = model<string>('');
  objetivoId = model<number>(0);
  // Fecha desde aplica (para compatibilidad con selección única)
  PeriodoDesdeAplica = model<string>('');

  // Condiciones seleccionadas (para selección múltiple)
  condicionesSeleccionadas = model<any[]>([]);

  // Filtros iniciales
  startFilters = signal<Selections[]>([])

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
  /*private refreshEffect = effect(() => {
    
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
  });*/

  // Columnas de la grilla (configuradas desde backend)

  columns = resource({
    params: () => ({}),
    loader: async () => {
      const response = await this.apiService.getCols('/api/condiciones-venta/cols').pipe(
        map((cols) => {
          // Guardar IDs de columnas que tienen showGridColumn: false
          this.hiddenColumnIds = cols
            .filter((col: any) => col.showGridColumn === false)
            .map((col: Column) => col.id as string);
          return cols;
        })
      );
      return response;
    }
  });

  columnsData = computed(() => this.columns.value())

  // Data source de la grilla
  // Cada vez que formChange$ emite → se vuelve a pedir la data
  gridData = resource({
    params: () => ({ options: this.listOptions, periodo: this.periodo(), refresh: this.refreshCondVenta()}),
    loader: async () => {
      //console.log("voy a refrescar la grilla")
      const response = await firstValueFrom(this.apiService.setListCondicionesVenta(this.listOptions, this.periodo()));
      this.dataAngularGrid = response.list;
      return response.list;
    }
  });

  data = computed(() => this.gridData.value())


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
    this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.rowSelectionOptions = {
            selectActiveRow: false
        }

    // Filtros iniciales: desde <= último día del periodo, hasta >= primer día del periodo
    this.updateStartFiltersFromPeriodo(this.periodo());
  }


  private updateStartFiltersFromPeriodo(periodo: any) {
    const firstDay = new Date(periodo.getFullYear(), periodo.getMonth(), 1)
    const lastDay = new Date(periodo.getFullYear(), periodo.getMonth() + 1, 0)
    this.startFilters.set([
      { index: 'ClienteElementoDependienteContratoFechaDesde', condition: 'AND', operator: '<=', value: lastDay, closeable: true },
      { index: 'ClienteElementoDependienteContratoFechaHasta', condition: 'AND', operator: '>=', value: firstDay, closeable: true }
    ]);
  }

  // Cambio de filtros desde el componente de filtros
  listOptionsChange(options: any): void {
    this.listOptions = options;
    //this.formChange$.next('filters');
    this.refreshCondVenta.update(v => v + 1)
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

  // Limpia la selección de la grilla
  clearSelection(): void {
    if (this.angularGrid?.slickGrid) {
      this.angularGrid.slickGrid.setSelectedRows([]);
    }
    this.condicionesSeleccionadas.set([]);
    this.codobj.set('');
    this.objetivoId.set(0);
    this.PeriodoDesdeAplica.set('');
  }

  // Exporta la grilla a Excel
  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-condiciones-venta',
      format: 'xlsx'
    });
  }

  // Selección de filas en la grilla (ahora soporta múltiples selecciones)
  async handleSelectedRowsChanged(e: any): Promise<void> {
    const selectedRows = e.detail.args.rows;
    const selectedData: any[] = [];

    // Obtener los datos de todas las filas seleccionadas
    selectedRows.forEach((rowIndex: number) => {
      const row = this.angularGrid.slickGrid.getDataItem(rowIndex);
      if (row?.id) {
        selectedData.push({
          codobj: row.codobj,
          PeriodoDesdeAplica: row.PeriodoDesdeAplica,
          ClienteId: row.ClienteId,
          ClienteElementoDependienteId: row.ClienteElementoDependienteDescripcion,
          ObjetivoId: row.ObjetivoId
        });
      }
    });

    // Actualizar las condiciones seleccionadas
    this.condicionesSeleccionadas.set(selectedData);

    // Mantener compatibilidad con selección única (para edición)
    if (selectedData.length === 1) {
      this.objetivoId.set(selectedData[0].ObjetivoId);
      this.codobj.set(selectedData[0].codobj);
      this.PeriodoDesdeAplica.set(selectedData[0].PeriodoDesdeAplica);
    } else {
      this.objetivoId.set(0);
      this.codobj.set('');
      this.PeriodoDesdeAplica.set('');
    }
  }
}
