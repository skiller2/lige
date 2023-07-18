import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  filter,
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
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

type listOptionsT = {
  filtros: any[],
  sort: any,
}

@Component({
  standalone: true,
  imports: [
    SharedModule,
  ],
  template: `<a app-down-file title="Comprobante {{ mes }}/{{ anio }}"
    httpUrl="api/impuestos_afip/{{anio}}/{{mes}}/0/{{item.PersonalId}}"
           ><span class="pl-xs" nz-icon nzType="download"></span></a>`
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
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  styleUrls: ['./impuesto-afip.component.less'],
  providers: [AngularUtilService]
})
export class ImpuestoAfipComponent {
  @ViewChild('impuestoForm', { static: true }) impuestoForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, private cdr: ChangeDetectorRef, private angularUtilService: AngularUtilService) { }
  url = '/api/impuestos_afip';
  url_forzado = '/api/impuestos_afip/forzado';
  toggle = false;

  files: NzUploadFile[] = [];
  anio = 0
  mes = 0
  selectedTabIndex = 0;
  selectedPersonalId = null;
  formChange$ = new BehaviorSubject('');
  filesChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);


  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto >0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio:this.anio,mes:this.mes })
      cellNode.append(componentOutput.domElement)
     //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }



  columns$ = this.apiService.getCols('/api/impuestos_afip/cols').pipe(map((cols) => {
    const colmonto:Column = {
      name: "Importe",
      type: "float",
      id: "monto",
      field: "monto",
//      fieldName: "des.PersonalOtroDescuentoImporteVariable",
      sortable: true,
//      formatter: () => '...',
      asyncPostRender: this.renderAngularComponent.bind(this),
      params: {
        component: CustomDescargaComprobanteComponent,
        angularUtilService: this.angularUtilService,
        //complexFieldLabel: 'assignee.name' // for the exportCustomFormatter
      },

    }

    let mapped = cols.map((col: any) => {
      if (col.id == 'monto')
        col=colmonto
      return col
    }); 
    return mapped
  }));
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions = {
    asyncEditorLoading: false,
    autoEdit: false,
    autoCommitEdit: false,
//    presets: { columns: [{ columnId: '', width: 0 }]},
    autoResize: {
      container: '.gridContainer',
        rightPadding: 1,    // defaults to 0
        //bottomPadding: 10,  // defaults to 20
        //minHeight: 550,     // defaults to 180
        //minWidth: 250,      // defaults to 300
        //sidePadding: 10,
        //bottomPadding: 10        
    },
    rowHeight: undefined,
//    headerRowHeight: 45,
//    rowHeight: 45, // increase row height so that the ng-select fits in the cell
//    autoHeight: true,    
    editable: true,
    enableCellMenu: true,
    enableCellNavigation: true,
//    enableAutoResize: true,
    enableColumnPicker: true,
    enableExcelCopyBuffer: true,
    enableExcelExport: true,
    registerExternalResources: [this.excelExportService],

    enableFiltering: true,
//    autoFitColumnsOnFirstLoad: true,
    enableAsyncPostRender: true, // for the Angular PostRenderer, don't forget to enable it
    asyncPostRenderDelay: 0,    // also make sure to remove any delay to render it
    params: {
      angularUtilService: this.angularUtilService // provide the service to all at once (Editor, Filter, AsyncPostRender)
    },

    showCustomFooter: true, // display some metrics in the bottom custom footer
    customFooterOptions: {
      // optionally display some text on the left footer container
      leftFooterText: '',
      hideTotalItemCount: false,
      hideLastUpdateTimestamp: false
    
    },

  };


  listOptions:listOptionsT = {
    filtros:  [],
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
          { anio: periodo.getFullYear(), mes: periodo.getMonth()+1, options:this.listOptions, toggle: this.toggle }
        )
        .pipe(
          map(data => {
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

  ngOnInit() {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
      });
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


  fncFile(rep: any): string {
    console.log('fncFile', rep);

    return 'pepe.pdf';
  }

  //angularGridReady(angularGrid: any) {
  angularGridReady(angularGrid: any) {
    
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    this.gridObj.autosizeColumns();
  }

  exportGrid() { 
    this.excelExportService.exportToExcel({
      filename: 'monotributos-listado',
      format: FileType.xlsx
    });  }
}
