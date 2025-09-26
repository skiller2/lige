import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '@delon/abc/loading';
import { SettingsService } from '@delon/theme';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { ProcesosAutomaticosDetalleComponent } from "../procesos-automaticos-detalle/procesos-automaticos-detalle";

@Component({
    selector: 'app-procesos-automaticos',
    templateUrl: './procesos-automaticos.html',
    styleUrl:'./procesos-automaticos.less',
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, ProcesosAutomaticosDetalleComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcesosAutomaticosComponent {
  periodo = signal(new Date());
  anio = computed(() => this.periodo()?.getFullYear());
  mes = computed(() => this.periodo()?.getMonth()+1);
  reload = signal<number>(0);
  logCodigo = signal<number>(0);
  visibleDetalle = model<boolean>(false);
  gridOptions!: GridOption;
  gridData: any;
  startFilters: any[] = [];
  selectedPeriod = { year: 0, month: 0 };
  listOptions: listOptionsT = {
      filtros: [],
      sort: null,
  };

  private apiService = inject(ApiService);
  // private readonly loadingSrv = inject(LoadingService);
  private settingsService = inject(SettingsService);
  private angularGrid!: AngularGridInstance;
  private angularUtilService = inject(AngularUtilService);
  private readonly detailViewRowCount = 1;
  private excelExportService = new ExcelExportService();

  listProcesosAutomaticos$ = new BehaviorSubject('');
  columns$ = this.apiService.getCols('/api/procesos-automaticos/cols');
  gridData$ = this.listProcesosAutomaticos$.pipe(
      debounceTime(500),
      switchMap(() => {
        return this.apiService.getListProcesosAutomaticos(this.listOptions)
        .pipe(map(data => { return data }))
      })
  )

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    // this.gridOptions.fullWidthRows = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.selectedDate()
    // this.settingsService.setLayout('collapsed', true)
  }

  angularGridReady(angularGrid: any) {
  
    this.angularGrid = angularGrid.detail

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      // totalRecords(this.angularGrid)
    })
    
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  selectedDate (){
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
      this.selectedPeriod = { year: anio, month: mes }
  }

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));
  }

  handleSelectedRowsChanged(e: any): void {
      if (e.detail.args.changedSelectedRows.length == 1) {
          const rowNum = e.detail.args.changedSelectedRows[0]
          const row = this.angularGrid.dataView.getItemByIdx(rowNum)
          
          this.logCodigo.set(Number(row?.ProcesoAutomaticoLogCodigo))
      } else {
          this.logCodigo.set(0)
      }
  }

  listProcesosAutomaticos(): void {
    this.listProcesosAutomaticos$.next('');
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.listProcesosAutomaticos()
  }

  openDrawerforDetalle(): void{
    this.visibleDetalle.set(true) 
  }
    
}