import { Component, ViewChild, Injector, inject, TemplateRef, ChangeDetectorRef, model,signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, SlickGrid, OnEventArgs } from 'angular-slickgrid';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { NzModalService, NzModalModule } from "ng-zorro-antd/modal";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { EditorTipoMovimientoComponent } from '../../../shared/editor-tipomovimiento/editor-tipomovimiento.component';
import { EditorTipoCuentaComponent } from '../../../shared/editor-tipocuenta/editor-tipocuenta.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { NzSelectModule } from 'ng-zorro-antd/select';








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
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { EditorObjetivoComponent } from '../../../shared/editor-objetivo/editor-objetivo.component';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { LoadingService } from '@delon/abc/loading';
import { ClienteSearchComponent } from 'src/app/shared/cliente-search/cliente-search.component';
import { SearchService } from 'src/app/services/search.service';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

@Component({
    selector: 'app-liquidaciones',
    templateUrl: './liquidaciones.component.html',
    styleUrls: ['./liquidaciones.component.less'],
    imports: [
        NzSelectModule,
        NzModalModule,
        CommonModule,
        SHARED_IMPORTS,
        NzAffixModule,
        FiltroBuilderComponent,
        NzUploadModule,
        ObjetivoSearchComponent,
        ClienteSearchComponent,
        PersonalSearchComponent
    ],
    providers: [AngularUtilService]
})

export class LiquidacionesComponent {
  @ViewChild('liquidacionesForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], [])
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent

  public apiService = inject(ApiService);
  public router = inject(Router);
  public route = inject(ActivatedRoute);
  public searchService = inject(SearchService);
  private angularUtilService = inject(AngularUtilService);
  private notification = inject(NzNotificationService);
  private readonly loadingSrv = inject(LoadingService);


  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  columnDefinitions: Column[] = [];
  toggle = false;
  detailViewRowCount = 9;
  gridDataLen = 0
  anio = 0
  mes = 0
  fechaRecibo = model(new Date())
  saveLoading$ = new BehaviorSubject(false);
  filesChange$ = new BehaviorSubject('');
  gridOptions!: GridOption;
  gridOptionsEdit!: GridOption;
  gridOptionsImport!: GridOption;
  selectedPeriod = { year: 0, month: 0 };
  gridDataInsert = [];
  uploading$ = new BehaviorSubject({ loading: false, event: null });
  selectedCuentalId = '';
  selectedMovimientoId = '';
  gridDataImportLen = 0
  NotificationIdForDelete = 0;
  PersonalIdForReceip = 0;
  PersonalIdUnique = [];
  PersonalNameForReceip = "";

  isVisible = false;
  isWithDuplicado = false;
  selectedOption = model("T");
  ObjetivoIdWithSearch = model(0);
  ClienteIdWithSearch = model(0);
  SucursalIdWithSearch = model(0);
  PersonalIdWithSearch = model(0);



  $selectedCuentalIdChange = new BehaviorSubject('');
  $isCuentaDataLoading = new BehaviorSubject(false);
  $selectedMovimientoIdChange = new BehaviorSubject('');
  $isMovimientoDataLoading = new BehaviorSubject(false);

  gridDataImport$ = new BehaviorSubject([]);

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridObjEdit!: SlickGrid;
  $optionsCuenta = this.apiService.getTipoCuenta();
  $optionsSucursales = this.searchService.getSucursales();

  $optionsMovimiento = this.apiService.getTipoMovimiento("I");
  $importacionesAnteriores = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.liquidacionesForm.form.get('periodo')?.value
      return this.apiService
        .getImportacionesAnteriores(
          periodo.getFullYear(), periodo.getMonth() + 1
        )
        .pipe(
        //map(data => {return data}),
        //doOnSubscribe(() => this.tableLoading$.next(true)),
        //tap({ complete: () => this.tableLoading$.next(false) })
      )
    })
  )

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ApellidoNombre':
        Object.assign(componentOutput.componentRef.instance, {
          link: '/ges/detalle_asistencia/persona', params: { PersonalId: dataContext.persona_id }, detail: cellNode.innerText
        })

        break;
      case 'ClienteElementoDependienteDescripcion':
        Object.assign(componentOutput.componentRef.instance, { link: '/ges/detalle_asistencia/objetivo', params: { ObjetivoId: dataContext.objetivo_id }, detail: cellNode.innerText })

        break;

      default:
        break;
    }

    cellNode.replaceChildren(componentOutput.domElement)
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

    const PersonalId = Number(this.route.snapshot.paramMap.get('PersonalId'))
    const tipocuenta_id: string = String(this.route.snapshot.paramMap.get('tipocuenta_id'))

    setTimeout(() => {
      if (PersonalId > 0) {
        this.sharedFiltroBuilder.addFilter('ApellidoNombre', 'AND', '=', String(PersonalId),false)
        this.sharedFiltroBuilder.addFilter('tipocuenta_id', 'AND', '=', tipocuenta_id,false)
      }
    }, 1000)
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;
    //console.log('this.angularGrid', this.angularGrid);
    this.angularGrid.gridService.hideColumnByIds(['PersonalCUITCUILCUIT','horas','periodo','CategoriaPersonalDescripcion'])

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('importe', this.angularGrid)
    })
  }

  async angularGridReadyEdit(angularGrid: any) {
    this.cleanerVariables();
    this.angularGridEdit = angularGrid.detail
    this.gridObjEdit = angularGrid.detail.slickGrid;

    setTimeout(() => {
      if (this.gridDataInsert.length == 0)
        this.addNewItem("bottom")

    }, 500);

    if (this.apiService.isMobile())
      this.angularGridEdit.gridService.hideColumnByIds([])
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
          map((data:any) => {
            this.anio = periodo.getFullYear();
            this.mes = periodo.getMonth() + 1;
            // this.gridDataLen = data?.list?.length
            // this.gridDataLen = data.list?.length
            // this.gridObj.getFooterRowColumn(0).innerHTML = 'Registros:  ' + this.gridDataLen.toString()
            this.cleanerVariables();
            this.PersonalIdUnique = data?.list
            return data?.list
          }),
          doOnSubscribe(() => this.loadingSrv.open()),
          tap({ complete: () => this.loadingSrv.close() })
        )
    })
  )

  cleanerVariables() {
    this.PersonalIdForReceip = 0
    this.PersonalNameForReceip = ""
  }

  handleSelectedRowsChanged1(e: any) {
    if (Array.isArray(e.detail.args.rows)) {

      let rowValue = e.detail.args.rows
      this.PersonalIdUnique
      this.PersonalIdForReceip = this.PersonalIdUnique[rowValue]["persona_id"]
      this.PersonalNameForReceip = this.PersonalIdUnique[rowValue]["ApellidoNombre"]
    }
  }


  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange('');
  }

  columnsImport = [
    {
      id: "id",
      name: "id",
      field: "id",
      fieldName: "id.liquidaciones",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Nombre Apellido",
      type: "string",
      id: "NombreApellido",
      field: "NombreApellido",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Cuit",
      type: "number",
      id: "cuit",
      field: "cuit",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Detalle",
      type: "string",
      id: "Detalle",
      field: "Detalle",
      searchType: "string",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },


  ]


  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'liquidaciones-listado',
      format: FileType.xlsx
    });
  }

  columns$ = this.apiService.getCols('/api/liquidaciones/cols').pipe(map((cols: Column<any>[]) => {
    cols[6].asyncPostRender = this.renderAngularComponent.bind(this)
    cols[8].asyncPostRender = this.renderAngularComponent.bind(this)

    return cols
  }));
  

  async liquidacionesAcciones(value: string) {
    switch (value) {
      case "movimientosAutomaticos":

        firstValueFrom(this.apiService.setmovimientosAutomaticos(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "Asistencia":

        firstValueFrom(this.apiService.setingresoPorAsistencia(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next('')))) //.subscribe(evt => {this.formChange$.next('')});
        break;
      case "CompensaGeneCoor":
        firstValueFrom(this.apiService.setCompensaGeneralCoordinador(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next('')))) //.subscribe(evt => {this.formChange$.next('')});
        break;

      case "Custodia":

        firstValueFrom(this.apiService.setingresoPorCustodia(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next('')))) //.subscribe(evt => {this.formChange$.next('')});
        break;

      case "Licencias":

        firstValueFrom(this.apiService.setingresoPorAsistenciaAdministrativosArt42(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;


      case "ingresosCoordinadorDeCuenta":

        firstValueFrom(this.apiService.setingresosCoordinadorDeCuenta(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "descuentoPorDeudaAnterior":

        firstValueFrom(this.apiService.setdescuentoPorDeudaAnterior(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "descuentos":

        firstValueFrom(this.apiService.setdescuentos(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "movimientoAcreditacionEnCuenta":

        firstValueFrom(this.apiService.setmovimientoAcreditacionEnCuenta(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "generarRecibos":

        firstValueFrom(this.apiService.generaRecibos(this.selectedPeriod.year, this.selectedPeriod.month, this.fechaRecibo()).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      case "generarReciboUnico":

        firstValueFrom(this.apiService.generaReciboUnico(this.selectedPeriod.year, this.selectedPeriod.month, this.PersonalIdForReceip).pipe(tap((_res: any) => this.formChange$.next(''))))
        break;

      default:
        break;

    }

  }

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  async ngOnInit() {
    this.fechaRecibo.set(new Date())
    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: false,
        formatter: Formatters['icon'],
        params: { iconCssClass: 'fa fa-trash pointer' },
        maxWidth: 30,
      },
      {
        id: 'isfull', name: 'isfull', field: 'isfull',
        excludeFromHeaderMenu: false,
        type: FieldType.number,
        width: 0, minWidth: 0, maxWidth: 0, cssClass: "reallyHidden", headerCssClass: "reallyHidden"

      },
      {
        id: 'des_movimiento', name: 'Tipo Movimiento', field: 'des_movimiento',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        params: {
          complexFieldLabel: 'des_movimiento.fullName',
        },
        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: EditorTipoMovimientoComponent,
          },
          alwaysSaveOnEnterKey: true,

          // required: true
        },
      },
      {
        id: 'des_cuenta', name: 'Tipo Cuenta', field: 'des_cuenta',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        params: {
          complexFieldLabel: 'des_cuenta.fullName',
        },
        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: EditorTipoCuentaComponent,
          },
          alwaysSaveOnEnterKey: true,

          // required: true
        },
      },
      {
        id: 'detalle', name: 'Detalle', field: 'detalle',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        editor: {
          model: Editors['text']
        }
      },
      {
        id: 'ClienteElementoDependienteDescripcion', name: 'Objetivo', field: 'ClienteElementoDependienteDescripcion',
        sortable: true,
        type: FieldType.string,
        maxWidth: 200,
        formatter: Formatters['complexObject'],
        params: {
          complexFieldLabel: 'ClienteElementoDependienteDescripcion.fullName',
        },

        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: EditorObjetivoComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        },
      },
      {
        id: 'ApellidoNombre', name: 'Persona', field: 'ApellidoNombre',
        sortable: true,
        type: FieldType.string,
        maxWidth: 250,
        minWidth: 250,
        formatter: Formatters['complexObject'],
        params: {
          complexFieldLabel: 'ApellidoNombre.fullName',
        },
        editor: {
          model: CustomInputEditor,
          collection: [],
          params: {
            component: EditorPersonaComponent,
          },
          alwaysSaveOnEnterKey: true,
          required: true
        },
      },
      {
        id: 'monto', name: 'Monto', field: 'monto',
        sortable: true,
        type: FieldType.float,
        maxWidth: 200,
        // groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        formatter: Formatters['multiple'],
        params: {
          formatters: [Formatters['currency']],
          // groupFormatterPrefix: '<b>Total</b>: ' 
        },
        cssClass: 'text-right',
        editor: {
          model: Editors['float'], decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
      }
    ];

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.autoEdit = true
    this.gridOptionsEdit.editable = true


    this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
      editCommand.execute()
      if (row.detalle && row.des_movimiento && (row.ClienteElementoDependienteDescripcion || row.ApellidoNombre) && row.monto && row.des_cuenta) {
        row.isfull = 1;
      } else {
        row.isfull = 2;
      }


      if (!row.detalle && !row.des_movimiento && !row.ClienteElementoDependienteDescripcion && !row.PersonalDescripcion && !row.monto && !row.des_cuenta)
        this.angularGridEdit.gridService.deleteItem(row)
      else {
        this.angularGridEdit.gridService.updateItem(row)
      }


      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

      this.angularGridEdit.slickGrid.invalidate();
      this.angularGridEdit.slickGrid.render();

      const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
      if (lastrow && (lastrow.detalle || lastrow.des_movimiento || lastrow.ClienteElementoDependienteDescripcion || lastrow.PersonalDescripcion || lastrow.monto || lastrow.des_cuenta)) {
        this.addNewItem("bottom")
      }




    }



    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true


    this.gridOptionsImport = this.apiService.getDefaultGridOptions('.gridContainer3', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsImport.enableRowDetailView = this.apiService.isMobile()



  }

  selectedValueChangeMovimiento(event: string): void {
    this.selectedMovimientoId = event;
    this.$selectedMovimientoIdChange.next(event);
    this.$isMovimientoDataLoading.next(true);
    return;

  }


  selectedValueChange(event: string): void {

    this.selectedCuentalId = event;
    this.$selectedCuentalIdChange.next(event);
    this.$isCuentaDataLoading.next(true);
    return;

  }


  updateItemMetadata(previousItemMetadata: any) {

    return (rowNumber: number) => {
      const item = this.angularGridEdit.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (meta && item && item.isfull) {
        switch (item.isfull) {
          case 2:
            meta.cssClasses = 'element-add-no-complete';
            break;
          case 1:
            meta.cssClasses = 'element-add-complete';
            break;

          default:
            break;
        }
      }
      return meta;
    };
  }

  addNewItem(insertPosition?: 'bottom') {
    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
  }

  cleanTable() {

    const ids = this.gridDataInsert.filter((f: any) => f.isfull == 1);


    this.gridDataInsert.forEach(objeto => {
      ids.push(objeto["id"]);
    });

    ids.pop();


    for (let index = 0; index <= ids.length; index++) {

      this.angularGridEdit.gridService.deleteItemById(ids[index]["id"]);

    }

    this.gridDataInsert = [];

  }

  confirmNewItem() {
    const altas = this.gridDataInsert.filter((f: any) => f.isfull == 1);
    const periodo = this.liquidacionesForm.form.get('periodo')?.value
    let periodoM = periodo.getMonth() + 1;
    let periodoY = periodo.getFullYear();
    const valuePeriodo = periodoM + "/" + periodoY;
    if (altas.length > 0) {
      this.apiService.setAgregarRegistros({ gridDataInsert: altas }, valuePeriodo).subscribe((_res: any) => {
        this.formChange$.next('')
        this.cleanTable()
      });
    }
  }

  confirmDeleteImportacion( id: any) {
    this.NotificationIdForDelete = parseInt(id);
    const periodo = this.liquidacionesForm.form.get('periodo')?.value
    if (this.NotificationIdForDelete > 0) {
      //(document.querySelectorAll('nz-notification')[0] as HTMLElement).hidden = true;
      this.apiService.setDeleteImportacion(this.NotificationIdForDelete, periodo.getFullYear(), periodo.getMonth() + 1).subscribe((_evt:any) => {
        this.formChange$.next('')
      });
    }
  }

  uploadChange(event: any) {
    switch (event.type) {
      case 'start':
        this.uploading$.next({ loading: true, event })
        this.gridDataImport$.next([])
        this.gridDataImportLen = 0

        break;
      case 'progress':

        break;
      case 'error':
        const Error = event.file.error
        // console.log("di error...." + Error.error.data.list)
        if (Error.error.data?.list) {
          this.gridDataImport$.next(Error.error.data?.list)
          this.gridDataImportLen = Error.error.data?.list?.length
        }
        this.uploading$.next({ loading: false, event })
        break;
      case 'success':
        const Response = event.file.response
        this.gridDataImport$.next([])
        this.gridDataImportLen = 0
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)
        this.formChange$.next('')
        break
      default:

        break;
    }

  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGridEdit.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    const periodo = this.liquidacionesForm.form.get('periodo')?.value
    let periodoM = periodo.getMonth() + 1
    let periodoY = periodo.getFullYear()
    let isfull = 0

    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1; // Agrega 1 porque los meses se indexan desde 0 (0 = enero)
    const anio = fechaActual.getFullYear();

    return {
      id: newId,
      isfull: 0,
      periodo: periodoM + "/" + periodoY,
      fecha: new Date(),
      detalle: ""

    };
  }

  showModal(): void {
    this.isVisible = true;
  }

}
