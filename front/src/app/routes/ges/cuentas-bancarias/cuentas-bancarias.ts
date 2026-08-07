import { Component, inject, model, signal, resource, computed } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule, Location } from '@angular/common';
import { BehaviorSubject, firstValueFrom, } from 'rxjs';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { AngularGridInstance, AngularUtilService, Column, GridOption } from 'angular-slickgrid';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { BankOutline, } from '@ant-design/icons-angular/icons';
import { PersonalBancoDrawerComponent } from '../personal-banco-drawer/personal-banco-drawer.component';
import { CuentasBancariasImportacionMasivaComponent } from '../cuentas-bancarias-importacion-masiva/cuentas-bancarias-importacion-masiva'
import { CuentasBancariasAltaDrawerComponent } from '../cuentas-bancarias-alta-drawer/cuentas-bancarias-alta-drawer'
import { ActivatedRoute, Router } from '@angular/router';

interface CuentaBancariaRow {
  PersonalId?: number;
  PersonalCUITCUILCUIT?: string | number | null;
}

@Component({
  selector: 'app-cuentas-bancarias',
  templateUrl: './cuentas-bancarias.html',
  styleUrl: './cuentas-bancarias.less',
  providers: [AngularUtilService, provideNzIconsPatch([BankOutline,])],
  imports: [SHARED_IMPORTS, CommonModule, NzIconModule, FiltroBuilderComponent
    , PersonalBancoDrawerComponent, CuentasBancariasImportacionMasivaComponent
    , CuentasBancariasAltaDrawerComponent],
})
export class CuentasBancariasComponent {
  periodo = signal<Date>(new Date())
  tabIndex = signal<number>(0)
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  startFilters = signal<Selections[]>([])
  personalId = signal<number>(0)
  visiblePersonalBanco = model<boolean>(false)
  visibleCuentasBancariasAlta = model<boolean>(false)
  selectedRows = signal<CuentaBancariaRow[]>([])
  hasMultipleRowsSelected = computed(() => this.selectedRows().length > 1)
  cuitSeleccionados = computed(() => [...new Set(
    this.selectedRows()
      .map(row => String(row.PersonalCUITCUILCUIT ?? '').trim())
      .filter(Boolean)
  )])
  cuitIniciales = computed(() => this.cuitSeleccionados().join(';'))
  anio = computed(() => this.periodo() ? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo() ? this.periodo().getMonth() + 1 : 0)

  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private location = inject(Location)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  columns = toSignal(this.apiService.getCols('/api/cuentas-bancarias/cols/'), { initialValue: [] as Column[] })

  // Los startFilters se aplican después del primer render, evita la carga inicial sin filtros
  private filtrosInicializados = false

  gridData = resource({
    params: () => ({ options: this.listOptions(), periodo: this.periodo() }),
    loader: async ({ params }) => {
      if (!params.options.filtros.length && !this.filtrosInicializados)
        return []
      this.filtrosInicializados = true

      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getCuentasBancarias({
          options: params.options,
          periodo: params.periodo
        }));
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },

    defaultValue: []
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.multiSelect = true
    this.gridOptions.selectionOptions = { selectActiveRow: false }
    this.gridOptions.forceFitColumns = true

    const dateToday = new Date();
    this.startFilters.set([
      // { index: 'PersonalBancoDesde', condition: 'AND', operator: '<=', value: dateToday, closeable: true },
      // { index: 'PersonalBancoHasta', condition: 'AND', operator: '>=', value: dateToday, closeable: true },
      { index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true }
    ])

    // TODO: REVISAR SI ESTA BIEN HECHO 
    
    // Entrada desde el cartel de pendientes de la solapa Importación: /listado?IndNuevaCuenta=1
    this.route.queryParams.subscribe(params => {
      if (params['IndNuevaCuenta'] != '1') return

      const aplicados = this.listOptions().filtros
      if (aplicados.some((filtro: any) => filtro.index == 'IndNuevaCuenta')) return

      const filtroPendientes: Selections = { index: 'IndNuevaCuenta', condition: 'AND', operator: '=', value: '1', closeable: true }
      // El filtro-builder re-aplica todo el array cada vez que cambia y no controla duplicados:
      // si ya tiene filtros puestos le mando sólo el nuevo, si todavía no se creó le mando también los iniciales
      this.startFilters.set(aplicados.length ? [filtroPendientes] : [...this.startFilters(), filtroPendientes])

      // Consumo el parámetro y lo borro de la URL, así un F5 o un ingreso posterior arranca sin este filtro.
      // Uso Location y no router.navigate para no re-navegar y que no se re-evalúe la solapa activa.
      this.location.replaceState(this.router.url.split('?')[0])
    })

    // this.settingsService.setLayout('collapsed', true)
  }

  async angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid
    angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(angularGrid, 'PersonalCUITCUILCUIT')
      // columnTotal('ImporteTranferido', angularGrid)

    })
    if (this.apiService.isMobile())
      angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const rowIndexes: number[] = e.detail.args.rows ?? []
    const rows = rowIndexes
      .map(rowIndex => this.angularGrid.dataView.getItemByIdx(rowIndex) as CuentaBancariaRow | undefined)
      .filter((row): row is CuentaBancariaRow => !!row)

    this.selectedRows.set(rows)
    this.personalId.set(rows.length === 1 ? rows[0].PersonalId ?? 0 : 0)
  }

  onAddorUpdate(_e: any) {
    this.gridData.reload()
  }

  openDrawerforPersonalBanco(): void {
    this.visiblePersonalBanco.set(true)
  }

  openDrawerforNewsCuentasBancarias(): void {
    this.visibleCuentasBancariasAlta.set(true)
  }

}