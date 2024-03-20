import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  of,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Options } from 'src/app/shared/schemas/filtro';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, FieldType, GridOption, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { CommonModule, NgIf } from '@angular/common';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';

@Component({
  standalone: true,
  imports: [
    SHARED_IMPORTS,

  ],

  template: `<a app-down-file title="Comprobante {{ mes }}/{{ anio }}"
    httpUrl="api/impuestos_afip/{{anio}}/{{mes}}/0/{{item.PersonalId}}"
           style="float:right;padding-right: 5px;"><span class="pl-xs" nz-icon nzType="download"></span></a>`
})

export class CustomDescargaComprobanteComponent {
  item: any;
  anio: any
  mes: any
}


@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
    NzUploadModule
  ],
  styleUrls: ['./impuesto-afip.component.less'],
  providers: [AngularUtilService]
})
export class ImpuestoAfipComponent {
  @ViewChild('impuestoForm', { static: true }) impuestoForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService,private settingService: SettingsService) { }
  url = '/api/impuestos_afip';
  url_forzado = '/api/impuestos_afip/forzado';
  toggle = false;
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  
  files: NzUploadFile[] = [];
  anio = 0
  mes = 0
  selectedPersonalId = null;
  formChange$ = new BehaviorSubject('');
  filesChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  detailViewRowCount = 9;
  columnDefinitions: Column[] = []
  gridOptions!: GridOption;
  gridDataLen = 0

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.anio, mes: this.mes })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }


  columns$ = this.apiService.getCols('/api/impuestos_afip/cols').pipe(map((cols) => {
    const colmonto: Column = {
      name: "Importe",
      type: "float",
      id: "monto",
      field: "monto",
      //      fieldName: "des.PersonalOtroDescuentoImporteVariable",
      sortable: true,
      //      formatter: () => '...',
      asyncPostRender: this.renderAngularComponent.bind(this),
      formatter : Formatters.multiple,
      params: {
        formatters: [Formatters.currency],
        thousandSeparator: '.',
        decimalSeparator: ',',
        component: CustomDescargaComprobanteComponent,
        angularUtilService: this.angularUtilService,
        //complexFieldLabel: 'assignee.name' // for the exportCustomFormatter
      },
      cssClass: 'text-right',

    }

    let mapped = cols.map((col: any) => {
      if (col.id == 'monto'){
        //console.log('Pase'); 
        col = colmonto
      }
      return col
    });
    console.log('mapped',mapped); 
    return mapped
  }));
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;





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
      const periodo = this.impuestoForm.form.get('periodo')?.value
      return this.apiService
        .getDescuentosMonotributo(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptions, toggle: this.toggle }
        )
        .pipe(
          map(data => {
            // this.gridDataLen = data.list.length 

            // let gridDataTotalImporte = 0
            // for (let index = 0; index < data.list.length; index++) {
            //   if(data.list[index].importe)
            //     gridDataTotalImporte += data.list[index].importe
            // }
            // this.gridObj.getFooterRowColumn('monto').innerHTML = 'Total: '+ gridDataTotalImporte.toFixed(2)
            // this.gridObj.getFooterRowColumn(1).innerHTML = 'Registros:  ' + this.gridDataLen.toString()
            // console.log(gridDataTotalImporte);
            // console.log(this.gridDataLen);
            
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  );

  listaDescuentos$ = this.filesChange$.pipe(
    debounceTime(1000),
    switchMap(() => {
      return this.apiService
        .getDescuentoByPeriodo(
          this.anio,
          this.mes,
          0
        )
        .pipe(
          map(items => {
            return {
              RegistrosConComprobantes: items.RegistrosConComprobantes,
              RegistrosSinComprobantes: items.RegistrosSinComprobantes,
            };
          }),
          //doOnSubscribe(() => this.tableLoading$.next(true)),
          //tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
  );

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
//        this.angularGrid.slickGrid.invalidate();
//        this.angularGrid.slickGrid.reRenderColumns(true)
//        this.angularGrid.slickGrid.render()
      });

   
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
  }

  ngAfterContentInit(): void {
    const user: any = this.settingService.getUser()
    const gruposActividadList = user.GrupoActividad

    setTimeout(() => {
      if (gruposActividadList.length > 0)
        this.sharedFiltroBuilder.addFilter('GrupoActividadNumero', 'AND', '=', gruposActividadList.join(';'))  //Ej 548
    }, 3000);

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
      this.impuestoForm.form
        .get('periodo')
        ?.setValue(new Date(Number(anio), Number(mes) - 1, 1));

      this.filesChange$.next('')
    }, 1);
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

  handleChange({ file, fileList }: NzUploadChangeParam): void {
    // const status = file.status;
    // if (status !== 'uploading') {
    //   console.log(file, fileList);
    // }
    // if (status === 'done') {
    //   this.formChange$.next('');
    //   //       this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   //   this.msg.error(`${file.name} file upload failed.`);
    // }

    if (file.status === 'done') {
      this.filesChange$.next('');
    }
  }

  // formChanged(_event: any) {
  //   this.listOptions.filtros=this.listOptions.filtros.filter((fil: any) => {
  //     return (fil.index!='PersonalIdJ')? true : false
  //   })

  //   if (Number(this.selectedPersonalId)>0)
  //     this.listOptions.filtros.push({ index: 'PersonalIdJ', operador: '=', condition: 'AND', valor: this.selectedPersonalId })


  //   this.formChange$.next('');
  // }

  ngOnDestroy() {
    this.resizeSubscription$!.unsubscribe();
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    //console.log('this.angularGrid',this.angularGrid); 

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])
      this.angularGrid.dataView.onRowsChanged.subscribe((e, arg)=>{
        totalRecords(this.angularGrid)
        columnTotal('monto', this.angularGrid)
    })
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'monotributos-listado',
      format: FileType.xlsx
    });
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

}
