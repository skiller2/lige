import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExternalResource } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-table-inaes-recibos',
  templateUrl: './table-inaes-recibos.html',
  styleUrls: ['./table-inaes-recibos.less'],
  imports: [SHARED_IMPORTS, CommonModule, NzAffixModule, FiltroBuilderComponent,],
  providers: [AngularUtilService],
  standalone: true
})
export class TableINAESRecibosComponent {

  private angularGrid!: AngularGridInstance;
  private readonly detailViewRowCount = 1;
  private excelExportService = new ExcelExportService();
  private textExportService: ExternalResource | TextExportService = new TextExportService();
  gridOptions!: GridOption;

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  // private searchService = inject(SearchService)
  private notification = inject(NzNotificationService)

  listOptions = signal<listOptionsT>({ filtros: [], sort: null })
  startFilters = signal<Selections[]>([])
  periodo = signal<Date>(new Date())
  loadingExport = signal<boolean>(false)

  hiddenColumnIds: string[] = [];
  //columnsForExport: string[] = [];

  columns = toSignal(this.apiService.getCols('/api/inaes/recibos/cols')
    .pipe(map((cols: Column[]) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols

        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      //    this.columnsForExport = cols
      //        .filter((col: any) => col.excludeFromExport != true)
      //        .map((col: Column) => col.id as string);

      return cols;
    })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), periodo: this.periodo() }),
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.getINAESRecibos({ options: params.options, periodo: params.periodo }))

        return res || []
        // return []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  async ngOnInit() {
    const now = new Date(); //date
    const anio =
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear();
    const mes =
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;
    this.periodo.set(new Date(anio, mes - 1, 1))

    // Grid Options
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridRecibos', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent);
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
    //Habilitando exportación de .CSV
    this.gridOptions.textExportOptions = { exportWithFormatter: true }
    this.gridOptions.externalResources = [this.textExportService as ExternalResource]

  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('total_ingresos', this.angularGrid)
      columnTotal('Excedentes', this.angularGrid)
      columnTotal('RetencionMonotributo', this.angularGrid)
      columnTotal('OtrasRetenciones', this.angularGrid)
    });

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    }
  }

  async exportGrid(): Promise<void> {
    this.loadingExport.set(true)

    //Muestro solo las columnas que se van a exportar
    //    if (this.hiddenColumnIds.length > 0) 
    //      this.angularGrid.gridService.showColumnByIds(this.columnsForExport)

    //Validaciones
    //Campos vacios
    const emptyFields = this.getEmptyFieldsRecibo()


    if (emptyFields.length) {
      let errorMsg = 'Campos Vacíos:\n'
      errorMsg += emptyFields.map(
        (x: any) => `[Fila ${x.row + 1}] ${this.gridData.value()[x.row].ApellidoNombre}: ${x.names.join(", ")}.`
      ).join('\n');
      this.notification.warning('Advertencia', errorMsg);
      this.loadingExport.set(false)
      return
    }


    const columns = this.angularGrid.slickGrid.getColumns();

    // Guardar originales
    const originalNames = new Map(
      columns.map(col => [col.id, col.name])
    );

    for (const col of columns) {
      if (col.params?.exportHeader) {
        col.name = col.params.exportHeader;
      }
    }

    await (this.textExportService as TextExportService).exportToFile({
      delimiter: ';',
      filename: `inaes-recibos-${this.periodo().getFullYear()}-${this.periodo().getMonth() + 1}`,
      format: 'csv'
    });

    // Restaurar nombres originales
    columns.forEach(col => {
      const originalName = originalNames.get(col.id);
      if (originalName) {
        col.name = originalName;
      }
    });

    this.gridData.reload()

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0)
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)

    this.loadingExport.set(false)
  }

  getEmptyFieldsRecibo(): any[] {
    const result: { row: number, names: string[] }[] = [];
    this.angularGrid.dataView.getItems().forEach((item, index) => {
      let names: string[] = []
      this.columns().forEach((column: any) => {
        if (column.excludeFromExport) return //Excluir las columnas que no se van a exportan
        const value = item[column.field];

        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
          names.push(column.name)
        }

      });
      if (names.length > 0)
        result.push({ row: index, names });
    });

    return result;
  }

  dateChange(result: Date): void {
    localStorage.setItem('anio', String(result.getFullYear()));
    localStorage.setItem('mes', String(result.getMonth() + 1));
  }
} 