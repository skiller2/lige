import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  LOCALE_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, ContainerService } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  standalone: true,
  imports: [
    SHARED_IMPORTS,
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
  selector: 'categorias-cambio',
  templateUrl: './categorias-cambio.component.html',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    CommonModule,
    PersonalSearchComponent
  ],
  styleUrls: ['./categorias-cambio.component.less'],
  providers: [AngularUtilService,ContainerService]
})
export class CategoriasCambioComponent {
  @ViewChild('cambiocatForm', { static: true }) cambiocatForm: NgForm =
    new NgForm([], []);
  constructor(public apiService: ApiService, private cdr: ChangeDetectorRef, private angularUtilService: AngularUtilService, @Inject(LOCALE_ID) public locale: string, public containerService:ContainerService) { }
  anio = 0
  mes = 0
  selectedTabIndex = 0;
  selectedPersonalId = null;
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  periodo=signal(new Date())

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.anio, mes: this.mes })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }



  columns$ = this.apiService.get('/api/categorias/cols').pipe(map((cols) => {
    /*
    const colmonto:Column = {
      name: "Importe",
      type: "float",
      id: "monto",
      field: "monto",
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
    let mapped = cols.map((col: any) => {
      //      if (col.id == 'monto')
      //        col=colmonto
      return col
    });
    return mapped
  }));
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridOptions:GridOption = {
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
    gridContainerId: 'gridContainerCateg', 
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
    externalResources:[this.excelExportService],
    enableFiltering: true,
    //    autoFitColumnsOnFirstLoad: true,
    enableAsyncPostRender: true, // for the Angular PostRenderer, don't forget to enable it
    asyncPostRenderDelay: 0,    // also make sure to remove any delay to render it
    params: {
      angularUtilService: this.angularUtilService, // provide the service to all at once (Editor, Filter, AsyncPostRender)
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
      return (fil.index != 'PersonalIdJ') ? true : false
    })

    if (Number(this.selectedPersonalId) > 0)
      this.listOptions.filtros.push({ index: 'PersonalIdJ', operador: '=', condition: 'AND', valor: this.selectedPersonalId })
    
    let fecProcesoCambio = formatDate(this.cambiocatForm.form.get('fecProcesoCambio')?.value || new Date(),'yyyy-MM-dd',this.locale)
    
    this.listOptions.extra = { fecProcesoCambio }

    this.formChange$.next('')
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

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {

      const fecProcesoCambio = new Date();
      this.cambiocatForm.form
        .get('fecProcesoCambio')
        ?.setValue(fecProcesoCambio);

      this.formChange$.next('')
    }, 1)
  }

  onChange(result: Date): void {
    this.listOptionsChange(this.listOptions)

    this.periodo.set(result)
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
//    this.excelExportService.exportToExcel({
//      filename: 'cambios-categorias',
//      format: FileType.xlsx
//    });
  }

  async setCambiarCategorias() {
    this.apiService.setCambiarCategorias({ options: this.listOptions }).subscribe(evt => {
      this.formChange$.next('')
      
    });

  }

}
