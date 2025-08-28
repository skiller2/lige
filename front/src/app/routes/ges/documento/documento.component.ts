import { Component, inject, model, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { DocumentoDrawerComponent } from '../documento-drawer/documento-drawer.component'
import { TablePendientesDescargasComponent } from '../table-pendientes-descargas/table-pendientes-descargas.component'
import { TableHistorialDescargasComponent } from '../table-historial-descargas/table-historial-descargas.component'
import { ReporteComponent } from 'src/app/shared/reporte/reporte.component'
import { LoadingService } from '@delon/abc/loading';

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
  selector: 'documento',
  templateUrl: './documento.component.html',
  imports: [
    SHARED_IMPORTS, CommonModule, NzAffixModule,
    FiltroBuilderComponent, DocumentoDrawerComponent,
    TablePendientesDescargasComponent, TableHistorialDescargasComponent,
    ReporteComponent
  ],
  styleUrls: ['./documento.component.less'],
  providers: [AngularUtilService]
})
export class DocumentoComponent {
  startFilters = signal<any[]>([])

  constructor(
    private settingService: SettingsService,
    public apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) { }

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  columnDefinitions: Column[] = [];

  columns$ = this.apiService.getCols('/api/documento/cols').pipe(map((cols) => {
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
  loadingDelete = signal<boolean>(false)
  private readonly loadingSrv = inject(LoadingService);
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null
  }

  childHistorialDescargas = viewChild.required<TableHistorialDescargasComponent>('historialDescargas')
  childListaPendientes = viewChild.required<TablePendientesDescargasComponent>('listPendientes')

  onAddorUpdate(_e: any) {
    this.formChanged('')
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      return this.apiService
        .getDocumentos(
          this.listOptions
        )
        .pipe(
          map(data => {
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => {
            this.tableLoading$.next(false)
            this.loadingSrv.close()
          } })
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


    const fisrtOfMonth = new Date(); //date
    fisrtOfMonth.setDate(1)
    // this.startFilters.set([{ field: 'fecha', condition: 'AND', operator: '>=', value: fisrtOfMonth, forced: false }])
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

  // exportGrid() {
  //   this.excelExportService.exportToExcel({
  //     filename: 'documento',
  //     format: FileType.xlsx
  //   });
  // }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const docId = this.angularGrid.dataView.getItemByIdx(rowNum)?.DocumentoId
      this.docId.set(docId)
    } else {
      this.docId.set(0)
    }
  }

  openDrawerforAlta(): void {
    this.visibleAlta.set(true)
  }

  openDrawerforEdit(): void {
    this.visibleEdit.set(true)
  }

  openDrawerforDetalle(): void {
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

  async deleteDocumento() {
    this.loadingDelete.set(true);

    try {
      const id = this.docId();
      if (id != null) {
        await firstValueFrom(this.apiService.deleteDocumento(id, 'documento'));
        // Emito cambio para refrescar la lista, el grid, etc.
        this.formChange$.next('');
      }
    } catch (error) {
      // Aquí puedes mostrar un mensaje de error con tu toast/snackbar
      console.error('Error borrando documento', error);
    } finally {
      this.loadingDelete.set(false);
    }
  }

}
