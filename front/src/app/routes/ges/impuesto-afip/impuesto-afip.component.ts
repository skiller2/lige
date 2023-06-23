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
import { FileType, AngularGridInstance, AngularSlickgridComponent, AngularSlickgridModule, AngularUtilService, ContainerService, Formatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { OPTIONS } from '@delon/theme';

type listOptionsT = {
  filtros: any[],
  sort: any,

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
  columns$ = this.apiService.get('/api/impuestos_afip/cols');
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj: any;
  gridOptions = {
    asyncEditorLoading: false,
    autoEdit: false,
    autoCommitEdit: false,

    autoResize: {
      container: '.gridContainer',
        rightPadding: 1,    // defaults to 0
        //bottomPadding: 10,  // defaults to 20
        //minHeight: 550,     // defaults to 180
        //minWidth: 250,      // defaults to 300
        //sidePadding: 10,
        //bottomPadding: 10        
    },

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
    autoFitColumnsOnFirstLoad: true,
    enableAsyncPostRender: true, // for the Angular PostRenderer, don't forget to enable it
    asyncPostRenderDelay: 0,    // also make sure to remove any delay to render it
    params: {
      angularUtilService: this.angularUtilService // provide the service to all at once (Editor, Filter, AsyncPostRender)
    }
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

      let options = structuredClone(this.listOptions)
      if (Number(this.selectedPersonalId)>0)
        options.filtros.push({ index: 'PersonalIdJ', operador: '=', condition: 'AND', valor: this.selectedPersonalId })
      
      return this.apiService
        .getDescuentosMonotributo(
          { anio: periodo.getFullYear(), mes: periodo.getMonth()+1, options, toggle: this.toggle }
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
            if (items) if (this.selectedPersonalId == null) return items;
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

  formChanged(_event: any) {
    this.formChange$.next('');
  }

  ngOnDestroy() {
    this.resizeSubscription$!.unsubscribe();
  }

  getColumns(url: string): any {
    return this.apiService.get(url);
  }

  fncFile(rep: any): string {
    console.log('fncFile', rep);

    return 'pepe.pdf';
  }

  angularGridReady(angularGrid: any) {
//  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;
  }


  exportGrid() { 
    this.excelExportService.exportToExcel({
      filename: 'monotributos-listado',
      format: FileType.xlsx
    });  }
}
