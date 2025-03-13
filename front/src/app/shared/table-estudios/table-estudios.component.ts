import { Component,Inject,LOCALE_ID,model,Output,EventEmitter } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject,debounceTime,map,switchMap,tap } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../shared/filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { RowDetailViewComponent } from '../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { totalRecords } from '../../shared/custom-search/custom-search';

type ListOptions = {
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
  selector: 'app-table-estudios',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  providers: [AngularUtilService],
  templateUrl: './table-estudios.component.html',
  styleUrls: ['./table-estudios.component.less'],
  standalone: true
})
export class TableEstudiosComponent {
  @Output() valueGridEvent = new EventEmitter<PersonalEstudio[]>();
  RefreshEstudio = model<boolean>(false);

  constructor(
    private settingService: SettingsService,
    public apiService: ApiService,
    private angularUtilService: AngularUtilService,
    @Inject(LOCALE_ID) public locale: string,
    public searchService: SearchService
  ) { }

  private formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);

  columns$ = this.apiService.getCols('/api/estudio/cols');

  private excelExportService = new ExcelExportService();
  private angularGridEdit!: AngularGridInstance;
  private gridObj!: SlickGrid;
  private detailViewRowCount = 9;
  gridOptions!: GridOption;
  private dataAngularGrid: any;
  private personalEstudios: PersonalEstudio[] = [];

  private listOptions: ListOptions = {
    filtros: [],
    sort: null,
    extra: null,
  };

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(250),
    switchMap(() => {
      return this.apiService
        .getListEstudios({ options: this.listOptions })
        .pipe(
          map(data => {
            this.dataAngularGrid = data.list;
            return data.list;
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  );

  ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions(
      '.gridContainer1',
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

  angularGridReady(angularGrid: any) {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

    this.angularGridEdit.slickGrid.onClick.subscribe((_e: any, args: any) => {
      this.personalEstudios = [this.dataAngularGrid[args.row]];
      this.valueGridEvent.emit(this.personalEstudios);
    });
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-estudios',
      format: 'xlsx'
    });
  }
} 