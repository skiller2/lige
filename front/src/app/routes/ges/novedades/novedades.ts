import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"


@Component({
  selector: 'app-novedades',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  providers: [AngularUtilService],
  templateUrl: './novedades.html',
  styleUrl: './novedades.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  editNovedadId = signal(0)
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listNovedades$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  startFilters: any[] = []

  columns$ = this.apiService.getCols('/api/novedades/cols')


  async ngOnInit() {


    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


  }

  gridData$ = this.listNovedades$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListNovedades({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
        )
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('CantidadNovedades', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id) {
      //this.editObjetivoId.set(row.ObjetivoId)
    }

  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listNovedades$.next('')
  }

}
