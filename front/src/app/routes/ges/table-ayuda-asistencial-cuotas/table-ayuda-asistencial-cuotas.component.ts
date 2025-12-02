import { Component, Output, EventEmitter, computed, input, signal, effect } from '@angular/core';
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
  selector: 'app-table-ayuda-asistencial-cuotas',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-ayuda-asistencial-cuotas.component.html',
  styleUrls: ['./table-ayuda-asistencial-cuotas.component.less'],
  standalone: true
})
export class TableAyudaAsistencialCuotasComponent {
  @Output() valueGridEvent = new EventEmitter<PersonalEstudio[]>();

  anio = signal<number>(0);
  mes = signal<number>(0);

  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  columns$ = this.apiService.getCols('/api/ayuda-asistencial/cols/cuotas');
  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private readonly detailViewRowCount = 9;
  gridOptions!: GridOption;
  private dataAngularGrid: PersonalEstudio[] = [];
  private personalEstudios: PersonalEstudio[] = [];
  private excelExportService = new ExcelExportService();
  periodo = input<Date>(new Date());
  private listOptions: ListOptions = {
    filtros: [],
    sort: null,
    extra: null,
  };

  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) {
    effect(() => {
      const periodoValue = this.periodo();
      if (periodoValue) {
        this.anio.set(periodoValue.getFullYear());
        this.mes.set(periodoValue.getMonth() + 1);
        this.formChange$.next('');
      }
    });
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => this.apiService.getListAyudaAsistencialCuotas(this.anio(), this.mes(), { options: this.listOptions }).pipe(
      map(data => {
        this.dataAngularGrid = data.list;
        return data.list;
      }),
      doOnSubscribe(() => this.tableLoading$.next(true)),
      tap({ complete: () => this.tableLoading$.next(false) })
    ))
  );

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerCut',
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
    this.listOptions = options;
    this.formChange$.next('');
  }


  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

    this.angularGridEdit.slickGrid.onClick.subscribe((_e: any, args: { row: number }) => {
      this.personalEstudios = [this.dataAngularGrid[args.row]];
      this.valueGridEvent.emit(this.personalEstudios);
    });
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-ayuda-asistencial-cuotas',
      format: 'xlsx'
    });
  }
} 