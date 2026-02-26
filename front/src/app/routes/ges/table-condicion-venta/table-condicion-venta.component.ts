import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  model,
  input,
  effect,
  signal,
  resource,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  BehaviorSubject,
  firstValueFrom,
  map,
  switchMap,
  tap
} from 'rxjs';
import { parsePeriod, periodToText } from '../../../shared/period-utils/period-utils';
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
import { toSignal } from '@angular/core/rxjs-interop';


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

  // Se usa para forzar el refresh de la grilla
  refreshCondVenta = model<number>(0)

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 11;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

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
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  // IDs de columnas ocultas
  hiddenColumnIds: string[] = [];

  private apiService = inject(ApiService)
  public angularUtilService = inject(AngularUtilService)
  public searchService = inject(SearchService)

  // Columnas de la grilla (configuradas desde backend)
  columns = toSignal(
    this.apiService.getCols('/api/condiciones-venta/cols').pipe(
      map((cols) => {
        // Guardar IDs de columnas que tienen showGridColumn: false
        this.hiddenColumnIds = cols
          .filter((col: any) => col.showGridColumn === false)
          .map((col: Column) => col.id as string);

        // Agregar formatter para PeriodoFacturacion
        const periodoFacturacionCol = cols.find((col: Column) => col.id === 'PeriodoFacturacion');
        if (periodoFacturacionCol) {
          periodoFacturacionCol.formatter = (_row: number, _cell: number, value: any) => {
            if (!value) return '';
            const parsed = parsePeriod(value);
            return parsed ? periodToText(parsed) : value;
          };
        }

        return cols;
      }))
    , { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), periodo: this.periodo(), refresh: this.refreshCondVenta() }),
    loader: async () => {
      const response = await firstValueFrom(this.apiService.getListCondicionesVenta(this.listOptions(), this.periodo()));
      return response.list;
    },
    defaultValue:[]
  }).value;

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
    this.gridOptions.selectionOptions = {
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
