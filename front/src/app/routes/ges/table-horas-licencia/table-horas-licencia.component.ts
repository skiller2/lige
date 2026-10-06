import {
  Component,
  ViewChild,
  inject, input, signal, EventEmitter, Output, resource
} from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
  firstValueFrom,
  timer,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, Column, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, Aggregators, GroupTotalFormatters, SlickGrid } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { CommonModule, formatDate } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

interface PersonalLicenciaHoras {
  PersonalId: number;
  PersonalLicenciaId: number;
  PersonalApellido: string;
  PersonalNombre: string;
  PersonalLicenciaDesde: Date;
  PersonalLicenciaHasta: Date;
  TipoInasistenciaDescripcion: string;
  CategoriaPersonalDescripcion: string;
  PersonalLicenciaHorasMensuales: string;
  PersonalLicenciaObservacion: string;
  Total: number;

}


@Component({
    selector: 'app-table-horas-licencia',
    imports: [SHARED_IMPORTS,
        CommonModule,
        NzAffixModule,
        FiltroBuilderComponent,
    ],
    providers: [AngularUtilService],
    templateUrl: './table-horas-licencia.component.html',
    styleUrl: './table-horas-licencia.component.less'
})
export class  TableHorasLicenciaComponent {

  private readonly route = inject(ActivatedRoute);
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private settingService = inject(SettingsService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService)

  @Output() valueGridEvent = new EventEmitter();

  columnDefinitions: Column[] = [];
  columnas: Column[] = [];

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  detailViewRowCount = 9
  gridOptionsEdit!: GridOption;
  gridObjEdit!: SlickGrid;
  gridDataLen = 0
  dataAngularGrid: any
  PersonalLicenciaHoras: PersonalLicenciaHoras[] = [];
  rowLocked: boolean = false;

  anio = input<number>();
  mes = input<number>();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
    extra: null
  });

  columns = toSignal(this.apiService.getCols('/api/carga-licencia/cols').pipe(map((cols) => {
    return cols.map((col: Column) => {
      if (col.id == 'PersonalLicenciaAplicaPeriodoHorasMensuales') {
        col.editor = {
          model: Editors['float'],
          decimal: 2,
          valueStep: 1,
          minValue: 0,
          maxValue: 10000000,
          alwaysSaveOnEnterKey: true,
          required: true

        }
        //col.onCellChange= this.onHoursChange.bind(this)
      }
      return col
    });

  })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes:this.mes() }),
    loader: async ({ params }) => {
      let response:any = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        params.options.extra = { 'todos': (this.route.snapshot.url[1].path == 'todos') }
        const res = await firstValueFrom(this.apiService.getListHorasLicencia(
          {options: params.options}, params.anio, params.mes
        ));
        this.dataAngularGrid = res.list;
        response = res.list;
      } catch (error) {}
      
      this.loadingSrv.close()
      return response || [];
    },
    defaultValue: []
  });

  ngOnInit() {

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsEdit.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsEdit.editable = true
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.showFooterRow = true
    this.gridOptionsEdit.createFooterRow = true


    this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {

      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
      this.angularGridEdit.slickGrid.invalidate();

      const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.id))


      try {

        if (column.type == 'number' || column.type == 'float')
          editCommand.serializedValue = Number(editCommand.serializedValue)

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked) await firstValueFrom(timer(100));
        row = this.angularGridEdit.dataView.getItemById(row.id)


        if (!row.dbid)
          this.rowLocked = true

        const res = await firstValueFrom(this.apiService.setchangehours(row))
         
        row.total = res.data?.total
        row.PersonalLicenciaAplicaPeriodoHorasMensuales = res.data?.PersonalLicenciaAplicaPeriodoHorasMensuales
        this.gridData.reload()
        this.rowLocked = false
      } catch (e: any) {

         
        //marcar el row en rojo
//        if (row.GrupoActividadNumeroOld) {
          const item = this.angularGridEdit.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGridEdit.gridService.updateItemById(row.id, item)
//        } else {
          //marcar el row en rojo

//          this.angularGridEdit.slickGrid.setSelectedRows([]);
//          this.angularGridEdit.slickGrid.render();
//        }
        this.rowLocked = false
      }
    }
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
  }

  ngOnDestroy() {
  }

  async angularGridReadyEdit(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail
    this.gridObjEdit = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
      columnTotal('total', this.angularGridEdit)
    })

  }

  valueRowSelectes(value: number) {
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-hora',
      format: 'xlsx'
    });
  }


  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args;
    if (column.id != 'PersonalLicenciaAplicaPeriodoHorasMensuales') {
      e.stopImmediatePropagation();
      return false
    }

    return true;
  }


  updateItemMetadata(previousItemMetadata: any) {


    return (rowNumber: number) => {
      const newCssClass = 'element-add-no-complete';
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }
    
      if (
        item.GrupoActividadNumero == 0 || 
        item.GrupoActividadDetalle === "" || 
        item.GrupoActividadInactivo === "" || 
        item.SucursalId === "" || 
        item.PersonalId === ""
      ) {
        meta.cssClasses = 'element-add-no-complete';
      }
      else
        meta.cssClasses = ''

      return meta;
    };
  }


}


