import { Component } from '@angular/core';
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

  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  anio = 0
  mes = 0
  detailViewRowCount = 9;
  gridDataLen = 0
  tableLoading$ = new BehaviorSubject(false);
  filesChange$ = new BehaviorSubject('');
  gridOptions!: GridOption;


  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.anio, mes: this.mes })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
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
    this.angularGrid.slickGrid.setOptions({ customFooterOptions: { rightFooterText: 'update'} },)



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

  // formChanged(_event: any) {
  //    this.listOptionsChange(this.listOptions)
  // }

 
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };


  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');

  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getPersonalCategoriaPendiente(
          { options: this.listOptions }
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

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }
  
  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'liquidaciones-listado',
      format: FileType.xlsx
    });
  }

  columns$ = this.apiService.getCols('/api/liquidaciones/cols').pipe(map((cols) => {
    let mapped = cols.map((col: Column) => {
      // if (col.id == 'PersonalAdelantoMonto') {
      //   col.editor = {
      //     model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 10000000, alwaysSaveOnEnterKey: true, required: true
      //   }
      // }
      return col
    });
    return mapped

    
  }));

  async liquidacionesAcciones(ev: Event) {

    let value = (ev.target as HTMLInputElement).id;

    switch (value) {
      case "movimientosAutomaticos":

        this.apiService.setmovimientosAutomaticos().subscribe(evt => {this.formChange$.next('')});
        break;

      case "ingresosPorAsistencia":

        this.apiService.setingresoPorAsistencia().subscribe(evt => {this.formChange$.next('')});
        break;

      case "ingresosPorAsistenciaAdministrativos":

          this.apiService.setingresoPorAsistenciaAdministrativos().subscribe(evt => {this.formChange$.next('') });
         break;

      case "ingresosArt42":

         this.apiService.setingresoArt42().subscribe(evt => {this.formChange$.next('') });
        break;

      case "ingresosCoordinadorDeCuenta":

        this.apiService.setingresosCoordinadorDeCuenta().subscribe(evt => {this.formChange$.next('') });
       break;

      case "descuentoPorDeudaAnterior":

        this.apiService.setdescuentoPorDeudaAnterior().subscribe(evt => {this.formChange$.next('') });
       break;

       case "descuentos":

       this.apiService.setdescuentos().subscribe(evt => {this.formChange$.next('') });
      break;

      case "movimientoAcreditacionEnCuenta":

      this.apiService.setmovimientoAcreditacionEnCuenta().subscribe(evt => {this.formChange$.next('') });
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
