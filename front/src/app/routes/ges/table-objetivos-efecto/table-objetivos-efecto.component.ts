import { Component, Inject, model, Output, EventEmitter, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';

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
    NzAffixModule
  ],
  providers: [AngularUtilService],
  templateUrl: './table-objetivos-efecto.component.html',
  styleUrls: ['./table-objetivos-efecto.component.less'],
  standalone: true
})
export class TableObjetivosEfectoComponent {

  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  columns$ = this.apiService.getCols('/api/efecto/colsObjetivos');
  RefreshPersonalEfecto = input<boolean>(false);
  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private dataAngularGrid: any[] = [];
  private excelExportService = new ExcelExportService();
  private PersonalId: number = 8676;

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }

 gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => this.searchService.getEfectoObjetivos().pipe(
      map(data => {
        this.dataAngularGrid = data;
        return data;
      }),
      doOnSubscribe(() => this.tableLoading$.next(true)),
      tap({ complete: () => this.tableLoading$.next(false) })
    ))
  ); 

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
  }

  listOptionsChange(options: any): void {
    this.formChange$.next('');
  }

  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-objetivos-efecto',
      format: 'xlsx'
    });
  }
} 
