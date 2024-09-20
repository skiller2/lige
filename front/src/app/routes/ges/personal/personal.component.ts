import { Component, Injector, viewChild, inject, signal, model, computed } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

@Component({
    selector: 'app-personal',
    standalone: true,
    imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, PersonalSearchComponent],
    templateUrl: './personal.component.html',
    providers: [AngularUtilService, ExcelExportService],
    styleUrl: './personal.component.less',
  })
  
  export class PersonalComponent {
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridDataInsert: any[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService();
    listPersonal$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    personalId = signal(0)

    columns$ = this.apiService.getCols('/api/personal/cols')
    gridData$ = this.listPersonal$.pipe(
      debounceTime(500),
      switchMap(() => {
        return this.searchService.getPersonalList({ options: this.listOptions })
          .pipe(map(data => {
            console.log(data);
            return data
          })
        )
      })
  )

    async ngOnInit(){
      this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      this.gridOptions.enableRowDetailView = false
      this.gridOptions.editable = false
      this.gridOptions.autoEdit = true
      this.gridOptions.enableAutoSizeColumns = true
      this.gridOptions.showFooterRow = true
      this.gridOptions.createFooterRow = true
      // this.gridOptions.enableCheckboxSelector = true
      // this.gridOptions.rowSelectionOptions = {
      //     selectActiveRow: true
      // }

  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    if (this.apiService.isMobile())
        this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    if(e.detail.args.changedSelectedRows.length == 1){
        this.personalId.set(this.angularGrid.dataView.getItemByIdx(e.detail.args.changedSelectedRows[0]).id)
    }else
        this.personalId.set(0)
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.listPersonal$.next('');
}

  getGridData(): void {
    this.listPersonal$.next('');
  }

}