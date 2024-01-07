import {  Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column,  FileType, GridOption, OnEventArgs, SlickGrid } from 'angular-slickgrid';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { appIconFormatter, columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { TemplateRef } from '@angular/core';

import {
  BehaviorSubject,
  Observable,
  Subscription,
  fromEvent,
  debounceTime,
  map,
  switchMap,
  tap,
  firstValueFrom,
} from 'rxjs';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { NzPopconfirmComponent } from 'ng-zorro-antd/popconfirm';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'movimientos-pendientes',
  templateUrl: './movimientos-pendientes.component.html',
  styleUrls: ['./movimientos-pendientes.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
  ],
  providers: [AngularUtilService,CurrencyPipe]

})

export class MovimientosPendientes {
  @ViewChild('nzpc', { static: false }) nzpc!: NzPopconfirmComponent

  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  gridOptionsMovimientos!: GridOption;
  detailViewRowCount = 12;
  gridDataLen = 0;
  anio = 0;
  mes = 0;
  selectedRow = {}
  tableLoading$ = new BehaviorSubject(false);
  listdowload = "";
  excelExportService = new ExcelExportService();
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  columnDefinitions: Column[] = [];
  private currencyPipe = inject(CurrencyPipe)





  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  }

  listOptionsChangeMovimiento(options: any) {
    this.listOptions = options
    this.formChange$.next('')

  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    Object.assign(componentOutput.componentRef.instance, { item: dataContext, params: { PersonalId: dataContext.persona_id, tipocuenta_id: dataContext.tipocuenta_id }, link: '/ges/liquidacion_banco/listado', detail: dataContext.ApellidoNombre })
    cellNode.replaceChildren(componentOutput.domElement)

  }

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {

    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id_delete',
        excludeFromHeaderMenu: true,
        formatter: appIconFormatter, params: { iconCssClass: 'fa fa-delete-o mdi mdi-delete-outline' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        onCellClick: (e: any, args: OnEventArgs) => {
          if (this.nzpc.nzVisible) 
            	this.nzpc.hide()
          this.nzpc.nzTitle = `Está seguro de eliminar el registro con importe ${(this.currencyPipe.transform(args.dataContext.importe))} ?`
          this.nzpc.setOverlayOrigin(new ElementRef(e.target))
          this.nzpc.handleConfirm = async () => {
            this.nzpc.hide()
            await firstValueFrom(this.apiService.setDeleteMovimiento(args.dataContext))
            this.formChange$.next('')
          }
          this.nzpc.show()
        }
      },

    ];

    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
      });


    this.gridOptionsMovimientos = this.apiService.getDefaultGridOptions('.gridContainer3', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsMovimientos.enableRowDetailView = this.apiService.isMobile()

    this.gridOptionsMovimientos.showFooterRow = true
    this.gridOptionsMovimientos.createFooterRow = true


  }



  columnsMovimientos$ = this.apiService.getCols('/api/liquidaciones/banco/movimientospendientes').pipe(map((cols) => {
    const colf: Column = cols[1]
    colf.asyncPostRender = this.renderAngularComponent.bind(this)
    return [...this.columnDefinitions, ...cols];
  }));

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'liquidaciones-listado',
      format: FileType.xlsx
    });
  }

  gridDataMovimiento$ = this.formChange$.pipe(

    debounceTime(500),
    switchMap(() => {
      const periodo = new Date();
      return this.apiService
        .getMovimientosBanco(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptions }
        )
        .pipe(
          map(data => {
            this.anio = periodo.getFullYear();
            this.mes = periodo.getMonth() + 1;
            this.listdowload = "gridDataMovimiento";
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    //console.log('this.angularGrid', this.angularGrid);

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('importe', this.angularGrid)
    })

  }
}