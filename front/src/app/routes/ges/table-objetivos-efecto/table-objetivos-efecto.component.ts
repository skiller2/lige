import { Component, EventEmitter, computed, input, signal, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listOptionsT, SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, firstValueFrom } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords, columnTotal } from '../../../shared/custom-search/custom-search';
import { toSignal } from '@angular/core/rxjs-interop';

interface ListOptions {
  filtros: any[];
  extra: any;
  sort: any;
}

interface PersonalEstudio {
  PersonalId: number;
  PersonalEstudioId: number;
  PersonalApellido: string;
  PersonalNombre: string;
  TipoEstudioDescripcion: string;
  EstadoEstudioDescripcion: string;
  PersonalEstudioObservacion: string;
}

@Component({
  selector: 'app-table-objetivos-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-objetivos-efecto.component.html',
  styleUrls: ['./table-objetivos-efecto.component.less'],
  standalone: true
})
export class TableObjetivosEfectoComponent {

  refreshGrid = input<number>(0);
  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private excelExportService = new ExcelExportService();
  private PersonalId: number = 8676;
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  })

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }

  columns = toSignal(this.apiService.getCols('/api/efecto/colsObjetivos'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({options: this.listOptions(), refresh: this.refreshGrid()}),
    loader: async ({ params }) => {
      return await firstValueFrom(this.searchService.getEfectoObjetivos(params.options))
    },
    defaultValue: []
  })

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainerObjetivosEfecto',
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
  }

  listOptionsChange(options: any): void {
    this.listOptions.set(options);
  }

  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
      columnTotal('StockStock', this.angularGridEdit);
    });

  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-objetivos-efecto',
      format: 'xlsx'
    });
  }
} 
