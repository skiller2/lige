import { ChangeDetectorRef, Component, ElementRef, Inject, LOCALE_ID, model, signal, ViewChild, viewChild, computed } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { combineLatest } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { TipoDocumentoAltaDrawerComponent } from '../tipo-documento-alta-drawer/tipo-documento-alta-drawer.component'
import { TablePendientesDescargasComponent } from '../table-pendientes-descargas/table-pendientes-descargas.component'
import { TableHistorialDescargasComponent } from '../table-historial-descargas/table-historial-descargas.component'
import { ReporteComponent } from 'src/app/shared/reporte/reporte.component'


type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

export class CustomDescargaComprobanteComponent {
  item: any;
  anio: any
  mes: any
}


@Component({
    selector: 'tipo-documento',
    templateUrl: './tipo-documento.component.html',
    imports: [
        SHARED_IMPORTS, CommonModule, NzAffixModule,
        FiltroBuilderComponent, TipoDocumentoAltaDrawerComponent,
        TablePendientesDescargasComponent, TableHistorialDescargasComponent,
        ReporteComponent
    ],
    styleUrls: ['./tipo-documento.component.less'],
    providers: [AngularUtilService]
})
export class TipoDocumentoComponent {
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;

  constructor(
    private settingService: SettingsService,
    public apiService: ApiService,
    private angularUtilService: AngularUtilService,
    // @Inject(LOCALE_ID) public locale: string,
    public searchService:SearchService
  ) { }
  
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  columnDefinitions: Column[] = [];
  
  columns$ = this.apiService.getCols('/api/tipo-documento/cols').pipe(map((cols) => {
    return cols
  }));

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  // periodo = signal({anio:0, mes:0})
  docId = signal<number>(0)
  visibleAlta = model<boolean>(false)
  visibleEdit = model<boolean>(false)
  visibleDetalle = model<boolean>(false)
  refresh = signal(0)
  
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null
  }

  childHistorialDescargas = viewChild.required<TableHistorialDescargasComponent>('historialDescargas')
  childListaPendientes = viewChild.required<TablePendientesDescargasComponent>('listPendientes')
  childDetalle = viewChild.required<TipoDocumentoAltaDrawerComponent>('detalle')
  childEdit = viewChild.required<TipoDocumentoAltaDrawerComponent>('editor')

  conditional = computed(async () => {
    if (this.refresh()) {
      this.formChanged('')
    }
  });

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getTipoDocumentos(
          this.listOptions
        )
        .pipe(
          map(data => {
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  )

  ngOnInit() {
    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: true,
        // formatter: Formatters.icon,
        params: { iconCssClass: 'fa fa-trash pointer' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        // onCellClick: (e: Event, args: OnEventArgs) => {
        //   console.log(args);
        //   if (confirm('Are you sure?')) {
        //     this.angularGrid.gridService.deleteItemById(args.dataContext.id);
        //   }
        // }
      }
    ]
   
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;
    }, 1);
  }

  formChanged(_event: any) {
    this.listOptionsChange(this.listOptions)
  }

  ngOnDestroy() {
  }

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
 
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'tipo-documento',
      format: FileType.xlsx
    });
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length ==1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const docId = this.angularGrid.dataView.getItemByIdx(rowNum)?.id
      this.docId.set(docId)
    } else {
      this.docId.set(0)
    }
  }

  openDrawerforAlta(): void{
    this.visibleAlta.set(true) 
  }

  openDrawerforEdit(): void{
    this.childEdit().load()
    this.visibleEdit.set(true)
  }

  openDrawerforDetalle(): void{
    this.childDetalle().load()
    this.visibleDetalle.set(true)
  }

  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 2: //HISTORIAL DESCARGAS
        this.childHistorialDescargas().list('')
        break;
      case 3: //LISTA DE PENDIENTES
        this.childListaPendientes().list('')
        break;
      default:
        break;
    }
  }

}
