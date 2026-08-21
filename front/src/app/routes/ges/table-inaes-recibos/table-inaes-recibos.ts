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
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { InaesRecibosCsvExportService } from '../../../services/inaes-recibos-export';

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
  private INAESExportService: ExternalResource | InaesRecibosCsvExportService = new InaesRecibosCsvExportService();
  gridOptions!: GridOption;

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private notification = inject(NzNotificationService)

  listOptions = signal<listOptionsT>({ filtros: [], sort: null })
  startFilters = signal<Selections[]>([])
  periodo = signal<Date>(new Date())
  loadingExport = signal<boolean>(false)

  hiddenColumnIds: string[] = [];

  columns = toSignal(this.apiService.getCols('/api/inaes/recibos/cols')
    .pipe(map((cols: Column[]) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols

        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      //    this.columnsForExport = cols
      //        .filter((col: any) => col.excludeFromExport != true)
      //        .map((col: Column) => col.id as string);

      cols
      .filter((col: Column) => ['ApellidoNombre'].includes(String(col.id)))
      .forEach((col: Column) => col.asyncPostRender = this.renderAngularComponent.bind(this))

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
    this.gridOptions.externalResources = [this.INAESExportService as ExternalResource]
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

    await (this.INAESExportService as InaesRecibosCsvExportService).exportToFile({
      delimiter: ';',
      filename: `inaes-recibos-${this.periodo().getFullYear()}-${this.periodo().getMonth() + 1}`,
      format: 'csv',
    });


    //this.gridData.reload()

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
        if (column.name != "CBU") {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
          names.push(column.name)
        }
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

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ApellidoNombre':
        Object.assign(componentOutput.componentRef.instance, {
          link: '/ges/detalle_asistencia/persona', params: { PersonalId: dataContext.PersonalId }, detail: cellNode.innerText
        })
        break;

      default:
        return;
    }

    cellNode.replaceChildren(componentOutput.domElement)
  }
} 