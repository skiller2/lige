
import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { AccesoBotFormComponent } from "../accesso-bot-form/acceso-bot-form.component"



@Component({
  selector: 'app-acceso-bot',
  standalone: true,
  templateUrl: './acceso-bot.component.html',
  styleUrl: './acceso-bot.component.less',
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS, 
    CommonModule, 
    PersonalSearchComponent, 
    DetallePersonaComponent,
    FiltroBuilderComponent,
    AccesoBotFormComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoBotComponent {

  public router = inject(Router);
  public route = inject(ActivatedRoute);

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  editPersonaId  = 0;
  edit = signal(false)
  addNew = false
  excelExportService = new ExcelExportService()
  list$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  
  formChange$ = new BehaviorSubject('');
  startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private settingService = inject(SettingsService)

    columns$ = this.apiService.getCols('/api/acceso-bot/cols')

    gridData$ = this.list$.pipe(
        debounceTime(500),
        switchMap(() => {
          return this.searchService.getListAccessBot({ options: this.listOptions })
            .pipe(map(data => {
              return data.list
            })
          )
        })
    )

    async ngOnInit(){

      this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

      this.gridOptions.enableRowDetailView = this.apiService.isMobile()
      this.gridOptions.showFooterRow = true
      this.gridOptions.createFooterRow = true
  }

    async angularGridReady(angularGrid: any) {
      this.angularGrid = angularGrid.detail
      this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
           totalRecords(this.angularGrid)
           columnTotal('Cantidad', this.angularGrid)
      })
      if (this.apiService.isMobile())
          this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id)
      this.editPersonaId = row.id

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['addNew']) {
      this.list$.next('');
    }
  }

  getGridData(): void {
    this.list$.next('');
    this.edit.set(false) 
  
  }

  listOptionsChange(options: any) {
      this.listOptions = options;
      this.list$.next('');
  }

  setEdit(value: boolean): void {
      this.edit.set(value) 
  }

}