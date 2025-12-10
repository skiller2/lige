import { Component, Output, EventEmitter, computed, input, signal, effect, model,inject } from '@angular/core';
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
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { LoadingService } from '@delon/abc/loading';


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

  private readonly loadingSrv = inject(LoadingService);

  private formChange$ = new BehaviorSubject<string>('');
  tableLoading$ = new BehaviorSubject<boolean>(false);
  columns$ = this.apiService.getCols('/api/ayuda-asistencial/cols/cuotas');
  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  rows: number[] = []
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
  personalId = model<number>(0);
  rowsSelectedCount = model<number>(0);
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
        
      }else{
        this.anio.set(0);
        this.mes.set(0);
      }
      this.formChange$.next('');
    });
  }


  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return this.apiService.getListAyudaAsistencialCuotas(this.anio(), this.mes(), { options: this.listOptions })
        .pipe(
            map(data => { 
               this.dataAngularGrid = data.list;
              return data.list; }),
            doOnSubscribe(() => { }),
            tap({ complete: () => { this.loadingSrv.close() } })
        )
    })
)


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
    this.gridOptions.enableCheckboxSelector = true

  }

  listOptionsChange(options: any): void {
    this.listOptions = options;
    this.formChange$.next('');
  }


  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('importetotal', this.angularGridEdit)
      columnTotal('importe', this.angularGridEdit)


  })

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

  handleSelectedRowsChanged(e: any): void {
    this.rows = e.detail.args.rows;
    const selectedRows = this.angularGridEdit.dataView.getAllSelectedFilteredIds();
    
    this.rowsSelectedCount.set(selectedRows.length);
    
    if (selectedRows.length === 1) {
        // si queda solo uno seleccionado, poner ese PersonalId
        const idx = this.angularGridEdit.dataView.getRowById(selectedRows[0]);
        const item = this.angularGridEdit.dataView.getItemByIdx(idx ?? 0);
        this.personalId.set(item?.PersonalId ?? 0);
    } else {
        // si hay más de uno, dejar el ultimo seleccionado o limpiar si no hay ninguno
        if (selectedRows.length > 1) {
            // tomar el seleccionado en la posicion mas reciente del evento changedSelectedRows
            const lastRowNum = e.detail.args.changedSelectedRows[e.detail.args.changedSelectedRows.length - 1];
            const item = this.angularGridEdit.dataView.getItemByIdx(lastRowNum);
            this.personalId.set(item?.PersonalId ?? 0);
        } else {
            this.personalId.set(0);
        }
    }
}

  reload(): void {
    this.formChange$.next('');
  }
} 