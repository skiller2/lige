import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, model, viewChild, computed, resource, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { firstValueFrom, map, timeInterval} from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../..//shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HabilitacionesDetalleComponent } from '../../../routes/ges/habilitaciones-detalle/habilitaciones-detalle';
import { HabilitacionesListadoComponent } from '../../../routes/ges/habilitaciones-listado/habilitaciones-listado';
import { HabilitacionesFormDrawerComponent } from '../../../routes/ges/habilitaciones-form-drawer/habilitaciones-form-drawer';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HabilitacionNecesariaFormModalComponent } from '../../../routes/ges/habilitacion-necesaria-form-modal/habilitacion-necesaria-form-modal';
import { DetallePersonaComponent } from "../../../routes/ges/detalle-persona/detalle-persona.component";
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-habilitaciones',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzButtonModule,
    HabilitacionesDetalleComponent, HabilitacionesListadoComponent, HabilitacionesFormDrawerComponent,
    HabilitacionNecesariaFormModalComponent, DetallePersonaComponent],
  providers: [AngularUtilService],
  templateUrl: './habilitaciones.html',
  styleUrl: './habilitaciones.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesComponent {

  public router = inject(Router);
  public route = inject(ActivatedRoute);

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService()
  listOptions =  signal<listOptionsT>({ filtros: [], sort: null })
  hiddenColumnIds: string[] = [];
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  isLoading = signal<boolean>(false)
  apellidoNombreSelected = signal<string>('')
  detalleSelected = signal<string>('')
  personalIdForDetalle = signal<number>(0)
  personalId = signal<number>(0)
  personalId2 = signal<number>(0)
  personalHabilitacionId = model<number>(0)
  lugarHabilitacionId = signal<number>(0)
  visibleForm = signal<boolean>(false)
  visibleFormEdit = signal<boolean>(false)
  visibleDetalle = signal<boolean>(false)
  tabIndex = signal(0)
  refreshPerList = signal<number>(0)
  disabledRefresh = signal<boolean>(false)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  startFilters = signal<Selections[]>([])

  columns = toSignal(this.apiService.getCols('/api/habilitaciones/cols').pipe(
    map((cols: Column<any>[]) => {
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols.map(col =>
        col.id === 'ApellidoNombre' ? { ...col, asyncPostRender: this.renderApellidoNombreComponent.bind(this) } : col
      )
    })), { initialValue: [] as Column[] })

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.forceFitColumns = true

    this.settingsService.setLayout('collapsed', true)

    this.startFilters.set([
      { index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true },
      { index: 'DiasFaltantesVencimiento', condition: 'AND', operator: '<=', value: '60', closeable: true },
    ])
  }

  ngAfterViewInit(): void {

    this.route.params.subscribe(params => {
      if (params['DiasFaltantesVencimiento'] && params['GestionHabilitacionEstadoCodigo']) {
        this.startFilters.set([
          { index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true },
          { index: 'DiasFaltantesVencimiento', condition: 'AND', operator: '=', value: params['DiasFaltantesVencimiento'], closeable: true },
          { index: 'GestionHabilitacionEstadoCodigo', condition: 'AND', operator: 'LIKE', value: params['GestionHabilitacionEstadoCodigo'], closeable: true },
        ])
      }
      if (params['PersonalId']) {
        this.startFilters.set([
          { index:'PersonalId', condition:'AND', operator:'=', value: params['PersonalId'], closeable: true }
        ])
      }
    })
  }

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      
      try {
        
        response = await firstValueFrom(this.searchService.getHabilitacionesList(params.options).pipe(
          map((data: any) => {
            return data.list
          })
        ))
      } catch (_e) { }

      return response || [];
    },
    defaultValue: []
  });

  // Evento cuando la grilla está lista
  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail

    // Actualiza el total de registros
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds);
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
     

    if (row?.id) {
      this.detalleSelected.set(`${row.ApellidoNombre} | <b>Lugar:</b> ${row.LugarHabilitacionDescripcion} | <b>Desde:</b> ${this.formatDate(row.PersonalHabilitacionDesde)} | <b>Hasta:</b> ${this.formatDate(row.PersonalHabilitacionHasta)} | <b>Estado:</b> ${row.Estado? row.Estado : ''} | <b>NroTramite:</b> ${row.NroTramite? row.NroTramite: ''}`)
      this.apellidoNombreSelected.set(row.ApellidoNombre)
      this.personalId.set(row.PersonalId)
      this.personalHabilitacionId.set(row.PersonalHabilitacionId)
      this.lugarHabilitacionId.set(row.LugarHabilitacionId)
    } else {
      this.apellidoNombreSelected.set('')
      this.personalId.set(0)
      this.personalHabilitacionId.set(0)
      this.lugarHabilitacionId.set(0)
    }

  }

  listOptionsChange(options: any) {
    this.listOptions.set(options)
  }

  onTabsetChange(_event: any) {
    window.dispatchEvent(new Event('resize'));

  }

  async refreshGrid(_e: any) {
    this.disabledRefresh.set(true)
    
    switch (this.tabIndex()) {
      case 0:
        this.gridData.reload()
        this.angularGrid?.slickGrid?.setSelectedRows([])
        this.personalId.set(0)
        this.personalHabilitacionId.set(0)
        this.lugarHabilitacionId.set(0)
        this.detalleSelected.set('')
        this.apellidoNombreSelected.set('')
        break;
      case 2:
        this.refreshPerList.update(n => n + 1)
        break;
    
      default:
        break;
    }
    setTimeout(() => {
      this.disabledRefresh.set(false)
    }, 500);
  }

  openDrawerforForm(): void {
    this.visibleForm.set(true)
  }

  openDrawerforFormEdit(): void {
    this.visibleFormEdit.set(true)
  }

  renderApellidoNombreComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)

    let PersonalId = dataContext.PersonalId
    Object.assign(componentOutput.componentRef.instance, { item: dataContext, link: '/ges/personal/listado', params: { PersonalId: PersonalId }, detail: cellNode.innerText })
    componentOutput.componentRef.instance.detail = dataContext[colDef.field as string]

    cellNode.replaceChildren(componentOutput.domElement)

  }

  formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }
  async updHabilitacionNecesaria() {
    await firstValueFrom(this.apiService.updHabilitacionNecesaria(this.anio(), this.mes()))
  }

  openDrawerforConsultDetalle(): void {
    switch (this.tabIndex()) {
      case 0:
        this.personalIdForDetalle.set(this.personalId())
        break;
      case 2:
        this.personalIdForDetalle.set(this.personalId2())
        break;
    
      default:
        break;
    }
    this.visibleDetalle.set(true)
  }

  closeDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(false)
  }

  consultPersonalIdByTabIndex(): boolean {
    switch (this.tabIndex()) {
      case 0:
        if(this.personalId()){ return false } else { return true }
        break;
      case 2:
        if(this.personalId2()){ return false } else { return true }
        break;
    
      default:
        return true
        break;
    }
  }

  
}