import { ChangeDetectionStrategy, Component, inject, input, model, OnInit, resource, signal } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { AngularGridInstance, AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { Selections } from '../../../shared/schemas/filtro';

// Ítems de la orden que el backend arma con FOR JSON (Producto, Cantidad, Total)
const parseDetalle = (value: any): any[] => {
  if (!value) return [];
  try {
    const items = JSON.parse(value);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const escapeHtml = (texto: any): string => String(texto ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatCantidadTexto = (cantidad: any): string =>
  cantidad !== null && cantidad !== '' && Number.isFinite(Number(cantidad))
    ? Number(cantidad).toLocaleString('es-AR', { maximumFractionDigits: 2 })
    : String(cantidad ?? '');

const formatCantidad = (cantidad: any): string => escapeHtml(formatCantidadTexto(cantidad));

const formatTotal = (total: any): string =>
  Number(total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

@Component({
  selector: 'app-table-orden-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, FiltroBuilderComponent],
  templateUrl: './table-orden-venta.html',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableOrdenVentaComponent implements OnInit {

  // Grid (Angular SlickGrid)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  readonly detailViewRowCount = 9;

  // Exportación a Excel
  excelExportService = new ExcelExportService();

  // Órdenes seleccionadas (selección múltiple)
  ordenesSeleccionadas = model<any[]>([]);

  // Cambia al guardar el detalle: la fila modificada quedó vieja y hay que releer la lista
  refreshGrid = input<number>(0);

  // Por omisión no se muestran las órdenes ya facturadas
  startFilters = signal<Selections[]>([
    { index: 'EstadoOrdenVentaCodigo', condition: 'AND', operator: '<>', value: 'FAC', label: 'Facturado', closeable: true }
  ])
  startFiltersReady = signal(false)
  filtersReady = signal(false)

  // Filtros y orden de la grilla
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null
  })

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  public angularUtilService = inject(AngularUtilService)

  // Columnas configuradas desde el backend (controlador de orden de venta, el mismo de carga asistencia)
  columns = toSignal(
    this.apiService.getCols('/api/orden-venta/cols-ordenes').pipe(
      map((cols) => {
        // Detalle de ítems: un renglón por ítem (cantidad x producto = total); en Excel, el mismo texto con un ítem por línea
        const detalleCol = cols.find((col: Column) => col.id === 'Detalle');
        if (detalleCol) {
          detalleCol.formatter = (_row: number, _cell: number, value: any) => {
            const items = parseDetalle(value);
            if (!items.length) return '';
            return items.map(item =>
              `<div class="det-ov-item">${formatCantidad(item.Cantidad)} x ${escapeHtml(item.Producto)} = ${formatTotal(item.Total)}</div>`
            ).join('');
          };
          detalleCol.exportWithFormatter = true;
          detalleCol.exportCustomFormatter = (_row: number, _cell: number, value: any) =>
            parseDetalle(value)
              .map(item => `${formatCantidadTexto(item.Cantidad)} x ${item.Producto ?? ''} = ${formatTotal(item.Total)}`)
              .join('\n');
        }

        return cols;
      }))
    , { initialValue: [] as Column[] })

  gridData = resource({
    params: () => this.filtersReady()
      ? { options: this.listOptions(), refresh: this.refreshGrid() }
      : undefined,
    loader: async ({ params }) => {
      const response = await firstValueFrom(this.apiService.getListOrdenesVenta(params.options));
      return response.list;
    },
    defaultValue: []
  }).value;

  async ngOnInit(): Promise<void> {
    this.initializeGridOptions();

    const filters = await firstValueFrom(this.searchService.getOrdenVentaFilters());
    this.startFilters.update(currentFilters => [...currentFilters, ...filters]);
    this.startFiltersReady.set(true);
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerOrdenVenta',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );

    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.enableCheckboxSelector = true;
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
//    this.gridOptions.enableVariableRowHeight = true
  }

  listOptionsChange(options: listOptionsT): void {
    this.listOptions.set(options);
    const filtros = Array.isArray(options.filtros) ? options.filtros : [];
    const initialFiltersApplied = this.startFilters().every(startFilter =>
      filtros.some((filtro: any) => filtro.inicial === true && filtro.index === startFilter.index)
    );
    if (!this.filtersReady() && initialFiltersApplied) this.filtersReady.set(true);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('ImporteTotalAFacturar', this.angularGrid);
      columnTotal('TotalFacturado', this.angularGrid);
    });
  }

  async handleSelectedRowsChanged(e: any): Promise<void> {
    const selectedRows = e.detail.args.rows;
    const selectedData = selectedRows.map((r: any) => this.angularGrid.slickGrid.getDataItem(r).NroOrdenVenta)
    this.ordenesSeleccionadas.set(selectedData)
  }
}
