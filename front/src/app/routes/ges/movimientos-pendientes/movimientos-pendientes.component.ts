import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, Editors, FileType, Formatters, GridOption, OnEventArgs, SlickGrid, SlickGridEventData } from 'angular-slickgrid';
import { CommonModule, NgIf } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
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

@Component({
  selector: 'movimientos-pendientes',
  templateUrl: './movimientos-pendientes.component.html',
  styleUrls: ['./movimientos-pendientes.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
  ],
  providers: [AngularUtilService]

})

export class MovimientosPendientes {
  @ViewChild('liquidacionesForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  gridOptionsMovimientos!: GridOption;
  detailViewRowCount = 12;
  gridDataLen = 0;
  anio = 0;
  mes = 0;
  tableLoading$ = new BehaviorSubject(false);
  listdowload = "";
  excelExportService = new ExcelExportService();
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  /* . . . */


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
    Object.assign(componentOutput.componentRef.instance, { item: dataContext,params:{ PersonalId: dataContext.persona_id, tipocuenta_id:dataContext.tipocuenta_id },   link:'/ges/liquidacion_banco/listado', detail: dataContext.ApellidoNombre })
    cellNode.replaceChildren(componentOutput.domElement)

  }

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {
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
    return cols
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
            console.log("estoy")
            debugger
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