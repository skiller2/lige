import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, resource, computed, input, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, map, switchMap, firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { SettingsService } from '@delon/theme';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-habilitaciones-listado',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  providers: [AngularUtilService],
  templateUrl: './habilitaciones-listado.html',
  styleUrl: './habilitaciones-listado.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesListadoComponent {

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })
  hiddenColumnIds: string[] = [];
  refresh = input<number>(0)
  personalId = model<number>(0)

  private angularUtilService = inject(AngularUtilService);
  private searchService = inject(SearchService);
  private settingsService = inject(SettingsService);
  private apiService = inject(ApiService);

  columns = toSignal(this.apiService.getCols('/api/habilitaciones/listado-cols').pipe(
    map((cols: Column<any>[]) => {
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols.map(col =>
        col.id === 'ApellidoNombre' ? { ...col, asyncPostRender: this.renderApellidoNombreComponent.bind(this) } : col
      )
    })), { initialValue: [] as Column[] })

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

    this.settingsService.setLayout('collapsed', true);
  }

  gridData = resource({
    params: () => ({ options: this.listOptions(), refresh:this.refresh() }),
    loader: async ({ params }) => {
      let response = []
      
      try {
        response = await firstValueFrom(this.searchService.getHabilitacionesListado(params.options).pipe(
          map((data: any) => {
            return data.list
          })
        ))
      } catch (_e) { }

      return response || [];
    },
    defaultValue: []
  });

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

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)

    if (row?.id) {
      this.personalId.set(row.PersonalId)
    } else {
      this.personalId.set(0)
    }

  }

  listOptionsChange(options: any) {
    this.listOptions.set(options);
  }

  refreshGrid(_e: any) {
    this.gridData.reload()
  }

  renderApellidoNombreComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)

    let PersonalId = dataContext.PersonalId
    Object.assign(componentOutput.componentRef.instance, { item: dataContext, link: '/ges/personal/listado', params: { PersonalId: PersonalId }, detail: cellNode.innerText })
    componentOutput.componentRef.instance.detail = dataContext[colDef.field as string]

    cellNode.replaceChildren(componentOutput.domElement)

  }
}
