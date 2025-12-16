import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { columnTotal, totalRecords } from "src/app/shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-habilitaciones-detalle',
  imports: [SHARED_IMPORTS, CommonModule],
  providers: [AngularUtilService],
  templateUrl: './habilitaciones-detalle.html',
  styleUrl: './habilitaciones-detalle.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesDetalleComponent {

  angularGridDetalle!: AngularGridInstance;
  gridDetalleOptions!: GridOption;
  gridDetalleDataInsert: any[] = [];
  angularGridDoc!: AngularGridInstance;
  gridDocOptions!: GridOption;
  gridDocDataInsert: any[] = [];
  detailViewRowCount = 1;
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  habilitacionesChange$ = new BehaviorSubject('')
  
  selectedIndex = signal(0)
  // isLoading = signal<boolean>(false)
  personalId = input<number>(0)
  personalHabilitacionId = input<number>(0)
  lugarHabilitacionId = input<number>(0)

  // childDetalle = viewChild.required<NovedadesFormComponent>('novedadesFormDeta')

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  private injector = inject(Injector)

  columnsDetalle$ = this.apiService.getCols('/api/habilitaciones/detalle-cols')
  columnsDoc$ = this.apiService.getCols('/api/habilitaciones/doc-cols')

  ngOnInit() {

    this.gridDetalleOptions = this.apiService.getDefaultGridOptions('.gridDetalleContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridDetalleOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridDetalleOptions.showFooterRow = true
    this.gridDetalleOptions.createFooterRow = true

    this.gridDocOptions = this.apiService.getDefaultGridOptions('.gridDocContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridDocOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridDocOptions.showFooterRow = true
    this.gridDocOptions.createFooterRow = true

    this.settingsService.setLayout('collapsed', true)
  }

  gridDetalleData$ = this.habilitacionesChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getDetalleGestionesByHabilitacion(this.personalId(), this.personalHabilitacionId(), this.lugarHabilitacionId())
        .pipe(map(data => { 
          return data.list 
        }))
    })
  )

  gridDocData$ = this.habilitacionesChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getDocsByHabilitacion(this.personalId(), this.personalHabilitacionId(), this.lugarHabilitacionId())
        .pipe(map(data => { 
          return data.list 
        }))
    })
  )

  async angularGridDetalleReady(angularGrid: any) {
    this.angularGridDetalle = angularGrid.detail
    this.angularGridDetalle.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridDetalle)
    })
    if (this.apiService.isMobile())
      this.angularGridDetalle.gridService.hideColumnByIds([])
  }

  async angularGridDocReady(angularGrid: any) {
    this.angularGridDoc = angularGrid.detail
    this.angularGridDoc.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridDoc)
    })
    if (this.apiService.isMobile())
      this.angularGridDoc.gridService.hideColumnByIds([])
  }

  cambios = computed(async () => {
    this.personalId()
    this.personalHabilitacionId()
    this.lugarHabilitacionId()
    this.habilitacionesChange$.next('');
  });

}