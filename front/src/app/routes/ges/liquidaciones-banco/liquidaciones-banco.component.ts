import { Component, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, FileType,  GridOption, SlickGrid } from 'angular-slickgrid';
import { CommonModule, NgIf } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { MovimientosPendientes } from '../movimientos-pendientes/movimientos-pendientes.component';
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
import { LoadingService } from '@delon/abc/loading';
import { FileUploadComponent } from 'src/app/shared/file-upload/file-upload.component';

@Component({
    selector: 'app-liquidaciones',
    templateUrl: './liquidaciones-banco.component.html',
    styleUrls: ['./liquidaciones-banco.component.less'],
    imports: [
        CommonModule,
        SHARED_IMPORTS,
        NzAffixModule,
        FiltroBuilderComponent,
        MovimientosPendientes,
        FileUploadComponent
    ],
    providers: [AngularUtilService]
})
export class LiquidacionesBancoComponent {
  @ViewChild('liquidacionesForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  private readonly loadingSrv = inject(LoadingService);


  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  toggle = false;
  anio = 0
  mes = 0
  listdowload = "";
  detailViewRowCount = 9;
  gridDataLen = 0
  gridAyudaDataLen = 0
  tableLoading$ = new BehaviorSubject(false);
  filesChange$ = new BehaviorSubject('');
  gridOptions!: GridOption;
  gridOptionsAyuda!: GridOption;
  selectedPeriod = { year: 0, month: 0 };
  fechaDesdeCBU = signal(new Date())
  filesCBU = signal([])
  tabIndex = signal(0)
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  angularGridAyuda!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridObjAyuda!: SlickGrid;

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
      const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext,link:'/ges/liquidaciones/listado',params:{ PersonalId: dataContext.PersonalId, tipocuenta_id:dataContext.tipocuenta_id },detail:dataContext.PersonalApellidoNombre  })
      cellNode.replaceChildren(componentOutput.domElement)
      MovimientosPendientes
  }


  onChange(result: Date): void {
    if (result) {
      this.anio = result.getFullYear();
      this.mes = result.getMonth() + 1;

      localStorage.setItem('mes', String(this.mes));
      localStorage.setItem('anio', String(this.anio));
      this.filesChange$.next('')
    } else {
      this.anio = 0;
      this.mes = 0;
    }

    this.formChange$.next('');
    this.files = [];
  }

  metrics: any
  refreshMetrics(e: any) {

    this.gridOptions.customFooterOptions!.rightFooterText = 'update'
    this.angularGrid.slickGrid.setOptions({ customFooterOptions: { rightFooterText: 'update' } },)

    let _e = e.detail.eventData
    let args = e.detail.args
    if (args && args.current >= 0) {
      setTimeout(() => {
        this.metrics = {
          startTime: new Date(),
          endTime: new Date(),
          //itemCount: args && args.current || 0,
          itemCount: 10,
          //totalItemCount: this.dataset.length || 0
          totalItemCount: 10
        };
      });
    }
  }

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  }

  listOptionsAyuda: listOptionsT = {
    filtros: [],
    sort: null,
  }

  formChange(event: any) {
    this.formChange$.next(event);
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');
  }

  listOptionsChangeAyuda(options: any) {
    this.listOptionsAyuda = options;
    this.formChange$.next('');
  }


  ngAfterViewInit(): void {
    const now = new Date(); //date
    setTimeout(() => {
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? Number(localStorage.getItem('anio'))
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? Number(localStorage.getItem('mes'))
          : now.getMonth() + 1;

      this.liquidacionesForm.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
    }, 1);
  }

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

  async angularGridReadyAyuda(angularGrid: any) {
    this.angularGridAyuda = angularGrid.detail
    this.gridObjAyuda = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGridAyuda.gridService.hideColumnByIds([])

    this.angularGridAyuda.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridAyuda)
      columnTotal('importe', this.angularGridAyuda)
    })

  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.liquidacionesForm.form.get('periodo')?.value
      return this.apiService
        .getLiquidacionesBanco(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptions }
        )
        .pipe(
          map(data => {
            this.anio = periodo.getFullYear();
            this.mes = periodo.getMonth() + 1;
            this.listdowload = "gridData";
            return data.list
          }),
          doOnSubscribe(() => this.loadingSrv.open() ),
          tap({ complete: () => this.loadingSrv.close() })
        )
    })
  )

  gridDataAyuda$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.liquidacionesForm.form.get('periodo')?.value
      return this.apiService
        .getLiquidacionesBancoAyudaAsistencial(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptionsAyuda }
        )
        .pipe(
          map(data => {
            this.anio = periodo.getFullYear();
            this.mes = periodo.getMonth() + 1;
            this.gridDataLen = data.list.length;
            this.listdowload = "gridDataAyuda";

            // let gridDataTotalImporte = 0
            // for (let index = 0; index < data.list.length; index++) {
            //   if(data.list[index].importe)
            //     gridDataTotalImporte += data.list[index].importe
            // }

            // this.gridObjAyuda.getFooterRowColumn('importe').innerHTML = 'Total: ' + gridDataTotalImporte.toFixed(2)
            // this.gridObjAyuda.getFooterRowColumn(0).innerHTML = 'Registros:  ' + this.gridDataLen.toString()

            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )


  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange('');
  }


  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'liquidaciones-listado',
      format: FileType.xlsx
    });
  }



  columns$ = this.apiService.getCols('/api/liquidaciones/banco/cols').pipe(map((cols) => {
    const colf: Column = cols[1]
    colf.asyncPostRender= this.renderAngularComponent.bind(this)

//    colf.formatter = function ( row, cell, value, columnDef, dataContext ) {
//      return '<a routerLink="#/ges/liquidaciones/listado/' + dataContext.PersonalId + '">' + value + '</a>';
//    };

    return cols
  }));

  columnsAyuda$ = this.apiService.getCols('/api/liquidaciones/banco/ayuda/cols').pipe(map((cols) => {
    return cols
  }));


  async liquidacionesAcciones(ev: Event) {

    let value = (ev.target as HTMLInputElement).id;

    switch (value) {
      case "movimientosAutomaticos":

        firstValueFrom(this.apiService.setmovimientosAutomaticos(this.anio, this.mes).pipe(tap(res => this.formChange$.next(''))))
        break;

      default:
        break;
    }

  }

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {
    MovimientosPendientes
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
      });


    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

    this.gridOptionsAyuda = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsAyuda.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.gridOptionsAyuda.showFooterRow = true
    this.gridOptionsAyuda.createFooterRow = true
  }

  async confirmaMovimientosBanco(e: any) {
    try {
      await firstValueFrom(this.apiService.confirmaMovimientosBanco(this.selectedPeriod).pipe(tap(res => this.formChange$.next(''))))
    } catch (e) {

    }
  }

  async eliminaMovimientosBanco(e: any, banco_id: number) {
    try {
      await firstValueFrom(this.apiService.eliminaMovimientosBanco(banco_id).pipe(tap(res => this.formChange$.next(''))))
    } catch (e) {

    }

  }

  /*
  buscarPorPersona(PersonalId: string) {
//    this.asistenciaPer.controls['PersonalId'].setValue(PersonalId);
//    this.router.navigate(['/ges/detalle_asistencia/persona', { state: { PersonalId } }])
    this.router.navigateByUrl('/ges/liquidaciones/listado', { state: { PersonalId } });

  }
  */
  async importCBU(banco_id: number) {
    console.log('files', this.filesCBU())
    try {
      await firstValueFrom(this.apiService.processCBUFile(this.filesCBU(),this.fechaDesdeCBU(),banco_id))
    } catch (e) {

    }
    
  }
}
