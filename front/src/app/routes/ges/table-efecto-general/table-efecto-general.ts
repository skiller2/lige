import { Component, inject, input, output, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { firstValueFrom, map } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-table-efecto-general',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-efecto-general.html',
  standalone: true
})
export class TableEfectoGeneralComponent {

  refreshGrid = input<number>(0);
  efectoSelected = output<any | null>();
  private angularGrid!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  filtersReady = signal(false)
  startFilters = signal<Selections[]>([])
  startFiltersReady = signal(false)

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)

  columns = toSignal(
    this.apiService.getCols('/api/efecto/colsEfectoGeneral').pipe(
      map((cols: Column[]) => cols.map(col => {
        if (col.id === 'ApellidoNombre')
          return { ...col, asyncPostRender: this.renderPersonaComponent.bind(this) }
        if (col.id === 'ClienteElementoDependienteDescripcion')
          return { ...col, asyncPostRender: this.renderObjetivoComponent.bind(this) }
        if (col.id === 'ProveedorRazonSocial')
          return { ...col, asyncPostRender: this.renderProveedorComponent.bind(this) }
        if (col.id === 'DepositoNombre')
          return { ...col, asyncPostRender: this.renderDepositoComponent.bind(this) }
        return col
      }))
    ),
    { initialValue: [] as Column[] }
  )

  gridData = resource({
    // Espera a que FiltroBuilder emita los filtros iniciales para evitar el warning duplicado al ingresar.
    params: () => this.filtersReady()
      ? { options: this.listOptions(), refresh: this.refreshGrid() }
      : undefined,
    loader: async ({ params }) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const response = await firstValueFrom(this.searchService.getEfectoGeneral(params.options ?? { filtros: [], sort: null }))
        return response || []
      } catch (_e) {
        return []
      } finally {
        this.loadingSrv.close()
      }
    },
    defaultValue: []
  })

  async ngOnInit(): Promise<void> {
    this.initializeGridOptions();
    const filters = await firstValueFrom(this.searchService.getEfectoFilters('table-efecto-general'))
    this.startFilters.set(filters)
    this.startFiltersReady.set(true)
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerEfectoGeneral',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
    this.gridOptions.forceFitColumns = true;
  }

  listOptionsChange(options: any): void {
    this.listOptions.set(options);
    if (!this.filtersReady()) this.filtersReady.set(true);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
      columnTotal('StockStock', this.angularGrid)
    });
  }

  handleSelectedRowsChanged(e: any): void {
    const rows: number[] = e.detail.args.rows ?? []
    const item = rows.length === 1 ? this.angularGrid.dataView.getItem(rows[0]) : null
    this.efectoSelected.emit(item ?? null)
  }

  renderPersonaComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column): void {
    const personalId = dataContext.PersonalId
    if (!personalId) return

    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    Object.assign(componentOutput.componentRef.instance, {
      item: dataContext,
      link: '/ges/efecto/personal',
      params: { PersonalId: personalId },
      detail: dataContext[colDef.field as string]
    })
    cellNode.replaceChildren(componentOutput.domElement)
  }

  renderObjetivoComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column): void {
    const objetivoId = dataContext.ObjetivoId
    // Solo las filas que pertenecen a un Objetivo llevan enlace a la solapa Objetivos
    if (!objetivoId) return

    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    Object.assign(componentOutput.componentRef.instance, {
      item: dataContext,
      link: '/ges/efecto/objetivos',
      params: { ObjetivoId: objetivoId },
      detail: dataContext[colDef.field as string]
    })
    cellNode.replaceChildren(componentOutput.domElement)
  }

  renderProveedorComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column): void {
    const proveedorId = dataContext.ProveedorId
    // Solo las filas que pertenecen a un Proveedor llevan enlace a la solapa Proveedores
    if (!proveedorId) return

    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    Object.assign(componentOutput.componentRef.instance, {
      item: dataContext,
      link: '/ges/efecto/proveedores',
      params: { ProveedorId: proveedorId },
      detail: dataContext[colDef.field as string]
    })
    cellNode.replaceChildren(componentOutput.domElement)
  }

  renderDepositoComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column): void {
    const depositoId = dataContext.DepositoId
    // Solo las filas que pertenecen a un Depósito llevan enlace a la solapa Depósitos
    if (!depositoId) return

    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    Object.assign(componentOutput.componentRef.instance, {
      item: dataContext,
      link: '/ges/efecto/deposito',
      params: { DepositoId: depositoId },
      detail: dataContext[colDef.field as string]
    })
    cellNode.replaceChildren(componentOutput.domElement)
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-efecto-general',
      format: 'xlsx'
    });
  }
}
