import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { FiltroBuilderComponent } from "src/app/shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "src/app/shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HabilitacionesDetalleComponent } from 'src/app/routes/ges/habilitaciones-detalle/habilitaciones-detalle';
import { HabilitacionesFormDrawerComponent } from 'src/app/routes/ges/habilitaciones-form-drawer/habilitaciones-form-drawer';
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HabilitacionNecesariaFormModalComponent } from 'src/app/routes/ges/habilitacion-necesaria-form-modal/habilitacion-necesaria-form-modal';

@Component({
  selector: 'app-habilitaciones',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, NzButtonModule,
    HabilitacionesDetalleComponent, HabilitacionesFormDrawerComponent,
    HabilitacionNecesariaFormModalComponent],
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
  listHabilitaciones$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  selectedIndex = signal(1)
  periodo = signal<Date>(new Date())
  // anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  // mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  isLoading = signal<boolean>(false)
  apellidoNombreSelected = signal<string>('')
  detalleSelected = signal<string>('')
  personalId = signal<number>(0)
  personalHabilitacionId = signal<number>(0)
  lugarHabilitacionId = signal<number>(0)
  visibleForm = signal<boolean>(false)
  visibleFormEdit = signal<boolean>(false)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)
  startFilters = signal<any[]>([])

  columns$ = this.apiService.getCols('/api/habilitaciones/cols').pipe(
    map((cols: Column<any>[]) => {
      return cols.map(col =>
        col.id === 'ApellidoNombre' ? { ...col, asyncPostRender: this.renderApellidoNombreComponent.bind(this) } : col
      )
    }))

  async ngOnInit() {

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.forceFitColumns = true

    this.settingsService.setLayout('collapsed', true)

    this.startFilters.set([
      { field: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', forced: false },
      // { field: 'PersonalHabilitacionDesde', condition: 'AND', operator: '<=', value: this.periodo(), forced: false },
      // { field: 'PersonalHabilitacionHasta', condition: 'AND', operator: '>=', value: this.periodo(), forced: false },
      { field: 'DiasFaltantesVencimiento', condition: 'AND', operator: '<=', value: '30', forced: false },
    ])
  }

  gridData$ = this.listHabilitaciones$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getHabilitacionesList(this.listOptions,)
        .pipe(map((data: any) => {
          return data.list
        }))
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    console.log('row: ', row);

    if (row?.id) {
      this.detalleSelected.set(`Apellido Nombre: ${row.ApellidoNombre} - Lugar Habilitación: ${row.LugarHabilitacionDescripcion}\n
        Habilitacion Desde: ${this.formatDate(row.PersonalHabilitacionDesde)} - Habilitacion Hasta: ${this.formatDate(row.PersonalHabilitacionHasta)}\n
        Estado: ${row.Estado? row.Estado : ''} - NroTramite: ${row.NroTramite? row.NroTramite: ''}`)
      this.apellidoNombreSelected.set(row.ApellidoNombre)
      this.personalId.set(row.PersonalId)
      this.personalHabilitacionId.set(row.PersonalHabilitacionId)
      this.lugarHabilitacionId.set(row.LugarHabilitacionId)
    }

  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listHabilitaciones$.next('')
  }

  refreshListado() {
    this.listHabilitaciones$.next('')
    this.selectedIndex.set(1)
  }

  goToDetail() {
    if (this.personalId() && this.personalHabilitacionId() && this.lugarHabilitacionId()) {
      this.selectedIndex.set(2)
    }
  }

  goToCredentials() {
    // if (this.personalId() && this.personalHabilitacionId() && this.lugarHabilitacionId()) {
    this.selectedIndex.set(3)
    // }
  }

  onTabsetChange(_event: any) {
    window.dispatchEvent(new Event('resize'));
  }

  refreshGrid(_e: any) {
    this.listHabilitaciones$.next('');
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
    const anio = this.periodo() ? this.periodo().getFullYear():0
    const mes = this.periodo() ? this.periodo().getMonth() + 1 : 0
    await firstValueFrom(this.apiService.updHabilitacionNecesaria(anio, mes))
  }

  
}