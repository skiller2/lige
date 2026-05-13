import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, map, switchMap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { SettingsService } from '@delon/theme';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';

@Component({
  selector: 'app-actas-personal-listado',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  providers: [AngularUtilService],
  templateUrl: './actas-personal-listado.html',
  styleUrl: './actas-personal-listado.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActasPersonalListadoComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listListado$ = new BehaviorSubject('');
  listOptions: listOptionsT = {
    filtros: [], // TODO: Agregar filtros iniciales aquí si es necesario (ej: [{field: 'Estado', operator: '=', value: 'Activo'}])
    sort: null,
  };
  hiddenColumnIds: string[] = [];

  private angularUtilService = inject(AngularUtilService);
  private searchService = inject(SearchService);
  private settingsService = inject(SettingsService);
  private apiService = inject(ApiService);

  columns$ = this.apiService.getCols('/api/actas/cols-personal').pipe(
    map((cols: Column<any>[]) => {
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols
    }));

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridListadoContainer',
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

    // this.settingsService.setLayout('collapsed', true);
    
    // Trigger inicial: dispara la carga de datos al entrar al módulo
    this.listListado$.next('');
  }

  gridData$ = this.listListado$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getActasPersonalListado(this.listOptions);
    })
  );

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail;
    this.angularGrid.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGrid);
    });

    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds);
    }

    if (this.apiService.isMobile()) {
      this.angularGrid.gridService.hideColumnByIds([]);
    }
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.listListado$.next('');
  }

  renderApellidoNombreComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)

    let PersonalId = dataContext.PersonalId
    Object.assign(componentOutput.componentRef.instance, { item: dataContext, link: '/ges/personal/listado', params: { PersonalId: PersonalId }, detail: cellNode.innerText })
    componentOutput.componentRef.instance.detail = dataContext[colDef.field as string]

    cellNode.replaceChildren(componentOutput.domElement)

  }
}
