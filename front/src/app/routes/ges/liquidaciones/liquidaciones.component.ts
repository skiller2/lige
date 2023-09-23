import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, Editors, FileType, GridOption, OnEventArgs, SlickGrid, SlickGridEventData } from 'angular-slickgrid';
import { CommonModule, NgIf } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
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

@Component({
  selector: 'app-liquidaciones',
  templateUrl: './liquidaciones.component.html',
  styleUrls: ['./liquidaciones.component.less'],
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
export class LiquidacionesComponent {
  @ViewChild('liquidacionesForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  toggle = false;
  detailViewRowCount = 9;
  gridDataLen = 0
  tableLoading$ = new BehaviorSubject(false);
  filesChange$ = new BehaviorSubject('');
  gridOptions!: GridOption;
  selectedPeriod = { year: 0, month: 0 };


  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
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
  };

  formChange(event: any) {
    this.formChange$.next(event);
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
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

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.liquidacionesForm.form.get('periodo')?.value
      return this.apiService
        .getLiquidaciones(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptions }
        )
        .pipe(
          map(data => {
            this.gridDataLen = data.list.length
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

  columns$ = this.apiService.getCols('/api/liquidaciones/cols').pipe(map((cols) => {

    return cols
  }));

  async liquidacionesAcciones(ev: Event) {

    let value = (ev.target as HTMLInputElement).id;

    switch (value) {
      case "movimientosAutomaticos":

        firstValueFrom(this.apiService.setmovimientosAutomaticos(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "ingresosPorAsistencia":

        firstValueFrom(this.apiService.setingresoPorAsistencia(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next('')))) //.subscribe(evt => {this.formChange$.next('')});
        break;

      case "ingresosPorAsistenciaAdministrativos":

        firstValueFrom(this.apiService.setingresoPorAsistenciaAdministrativos(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "ingresosArt42":

        firstValueFrom(this.apiService.setingresoArt42(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "ingresosCoordinadorDeCuenta":

        firstValueFrom(this.apiService.setingresosCoordinadorDeCuenta(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "descuentoPorDeudaAnterior":

        firstValueFrom(this.apiService.setdescuentoPorDeudaAnterior(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "descuentos":

        firstValueFrom(this.apiService.setdescuentos(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      case "movimientoAcreditacionEnCuenta":

        firstValueFrom(this.apiService.setmovimientoAcreditacionEnCuenta(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
        break;

      default:
        break;

    }

  }

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
      });


    this.gridOptions = this.apiService.getDefaultGridOptions(this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
  }


}
