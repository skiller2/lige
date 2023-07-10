import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  LOCALE_ID,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { formatDate } from '@angular/common';

type listOptionsT = {
  filtros: any[],
  extra: any,
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
  selector: 'objetivos-pendasis',
  templateUrl: './objetivos-pendasis.component.html',
  standalone: true,
  imports: [
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  styleUrls: ['./objetivos-pendasis.component.less'],
  providers: [AngularUtilService]
})
export class ObjetivosPendAsisComponent {
  @ViewChild('objpendForm', { static: true }) objpendForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string) { }
  anio = 0
  mes = 0
  selectedTabIndex = 0;
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);

  columns$ = this.apiService.get('/api/objetivos-pendasis/cols').pipe(map((cols) => {
    /*
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
*/

    let mapped = cols.filter((col: any) => {
      return !col.hidden
    });

    mapped = mapped.map((col: any) => {
      //      if (col.id == 'monto')
      //        col=colmonto
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

  }

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null
  }

  listOptionsChange(options: any) {
    this.listOptions = options;

    this.listOptions.filtros = this.listOptions.filtros.filter((fil: any) => {
      return (fil.index != 'anio' && fil.index != 'mes') ? true : false
    })

    this.listOptions.filtros.push({ index: 'anio', operador: '=', condition: 'AND', valor: localStorage.getItem('anio') })
    this.listOptions.filtros.push({ index: 'mes', operador: '=', condition: 'AND', valor: localStorage.getItem('mes') })

    this.formChange$.next('')
  }

  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.apiService
        .getObjetivosPendAsis(
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

  ngOnInit() {
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
      this.objpendForm.form
        .get('periodo')
        ?.setValue(new Date(Number(anio), Number(mes) - 1, 1));

    }, 1);
  }
  onChange(result: Date): void {
    if (result) {
      this.anio = result.getFullYear();
      this.mes = result.getMonth() + 1;

      localStorage.setItem('mes', String(this.mes));
      localStorage.setItem('anio', String(this.anio));
    } else {
      this.anio = 0;
      this.mes = 0;
    }

    this.listOptionsChange(this.listOptions)
  }



  formChanged(_event: any) {
    this.listOptionsChange(this.listOptions)
  }

  ngOnDestroy() {
  }

  //angularGridReady(angularGrid: any) {
  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    this.gridObj.autosizeColumns();
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'objetivos-pendasis',
      format: FileType.xlsx
    });
  }

  async setCambiarCategorias() {
    this.apiService.setCambiarCategorias({ options: this.listOptions }).subscribe(evt => {
      this.formChange$.next('')

    });

  }

}
