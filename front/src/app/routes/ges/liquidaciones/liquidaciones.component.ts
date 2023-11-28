import { Component, ViewChild, Injector, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, OnEventArgs, SlickGrid, SlickGridEventData, GroupTotalFormatters, Aggregators, Grouping } from 'angular-slickgrid';
import { CommonModule, NgIf } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { NzModalService, NzModalModule } from "ng-zorro-antd/modal";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

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
import { CustomGridEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { EditorObjetivoComponent } from '../../../shared/editor-objetivo/editor-objetivo.component';

@Component({
  selector: 'app-liquidaciones',
  templateUrl: './liquidaciones.component.html',
  styleUrls: ['./liquidaciones.component.less'],
  standalone: true,
  imports: [
    NzModalModule,
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
  constructor(private cdr: ChangeDetectorRef, public apiService: ApiService, private injector: Injector, public router: Router, private angularUtilService: AngularUtilService, private modal: NzModalService, private notification: NzNotificationService) { }


  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  columnDefinitions: Column[] = [];
  toggle = false;
  detailViewRowCount = 9;
  gridDataLen = 0
  saveLoading$ = new BehaviorSubject(false);
  tableLoading$ = new BehaviorSubject(false);
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
  $optionsMovimiento = this.apiService.getTipoMovimiento("I");
  $importacionesAnteriores = this.apiService.getImportacionesAnteriores();





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
    //console.log('this.angularGrid', this.angularGrid);

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('importe', this.angularGrid)
    })
  }

  async angularGridReadyEdit(angularGrid: any) {
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
          map(data => {
            // this.gridDataLen = data?.list?.length
            // this.gridDataLen = data.list?.length
            // this.gridObj.getFooterRowColumn(0).innerHTML = 'Registros:  ' + this.gridDataLen.toString()

            return data?.list
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

  columns$ = this.apiService.getCols('/api/liquidaciones/cols').pipe(map((cols) => {
    console.log('Cols ',cols);
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

      case "ingresosPorAsistenciaAdministrativosArt42":

        firstValueFrom(this.apiService.setingresoPorAsistenciaAdministrativosArt42(this.selectedPeriod.year, this.selectedPeriod.month).pipe(tap(res => this.formChange$.next(''))))
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

    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: true,
        formatter: Formatters.deleteIcon,
        maxWidth: 30,
      },
      {
        id: 'isfull', name: 'isfull', field: 'isfull',
        sortable: true,
        type: FieldType.number,
        maxWidth: 130,
      },
      {
        id: 'periodo', name: 'Periodo', field: 'periodo',
        sortable: true,
        type: FieldType.string,
        maxWidth: 60,
      },
      {
        id: 'des_movimiento', name: 'Tipo Movimiento', field: 'des_movimiento',
        sortable: true,
        type: FieldType.string,
        maxWidth: 200,
        formatter: Formatters.collectionEditor,

        editor: {
          model: Editors.singleSelect,
          // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
          //enableRenderHtml: true,
          collectionAsync: this.apiService.getTipoMovimiento("M"),
          customStructure: {
            value: 'tipo_movimiento_id',
            label: 'des_movimiento',
            //            labelSuffix: 'symbol'
          },
          editorOptions: {
            maxHeight: 400
          },
          alwaysSaveOnEnterKey: true,
          required: true
        },
      },
      {
        id: 'des_cuenta', name: 'Tipo Cuenta', field: 'des_cuenta',
        sortable: true,
        type: FieldType.string,
        maxWidth: 200,
        formatter: Formatters.collectionEditor,

        editor: {
          model: Editors.singleSelect,
          collectionAsync: this.apiService.getTipoCuenta(),
          customStructure: {
            value: 'tipocuenta_id',
            label: 'detalle',
          },
          editorOptions: {
            maxHeight: 400
          },
          alwaysSaveOnEnterKey: true,
          required: true
        },
      },
      {
        id: 'fecha', name: 'Fecha', field: 'fecha',
        formatter: Formatters.dateIso, sortable: true,
        type: FieldType.date,
        maxWidth: 120,
      },
      {
        id: 'detalle', name: 'Detalle', field: 'detalle',
        sortable: true,
        type: FieldType.string,
        maxWidth: 200,
        editor: {
          model: Editors.text
        }
      },
      {
        id: 'ObjetivoDescripcion', name: 'Objetivo', field: 'ObjetivoDescripcion',
        sortable: true,
        type: FieldType.string,
        maxWidth: 200,
        formatter: Formatters.complexObject,
        params: {
          complexFieldLabel: 'ObjetivoDescripcion.fullName',
        },

        editor: {
          model: CustomGridEditor,
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
        maxWidth: 200,
        formatter: Formatters.complexObject,
        params: {
          complexFieldLabel: 'ApellidoNombre.fullName',
        },
        editor: {
          model: CustomGridEditor,
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
        formatter: Formatters.multiple,
        params: {
          formatters: [Formatters.currency, Formatters.alignRight],
          // groupFormatterPrefix: '<b>Total</b>: ' 
        },
        editor: {
          model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
      }
    ];

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.autoEdit = true



    this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
      editCommand.execute()

      if (row.detalle && row.des_movimiento && (row.ObjetivoDescripcion || row.ApellidoNombre) && row.monto && row.des_cuenta) {
        row.isfull = 1;
      } else {
        row.isfull = 2;
      }


      if (!row.detalle && !row.des_movimiento && !row.ObjetivoDescripcion && !row.PersonalDescripcion && !row.monto && !row.des_cuenta)
        this.angularGridEdit.gridService.deleteItem(row)
      else {
        this.angularGridEdit.gridService.updateItem(row)
      }


      this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

      this.angularGridEdit.slickGrid.invalidate();
      this.angularGridEdit.slickGrid.render();

      const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
      if (lastrow && (lastrow.detalle || lastrow.des_movimiento || lastrow.ObjetivoDescripcion || lastrow.PersonalDescripcion || lastrow.monto || lastrow.des_cuenta)) {
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



  createBasicNotification(template: TemplateRef<{}>): void {

    const element = document.getElementsByClassName('ant-notification-notice-content ng-star-inserted');

    if (element.length == 0)
      this.notification.template(template);
  }

  createBasicNotificationImportacion(template: TemplateRef<{}>, id: string): void {

    this.NotificationIdForDelete = parseInt(id);
    const element = document.getElementsByClassName('notificacionImportacion');

    if (element.length == 0)
      this.notification.template(template);
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
    if (altas.length > 0) {
      (document.querySelectorAll('nz-notification')[0] as HTMLElement).hidden = true;
      this.apiService.setAgregarRegistros({ gridDataInsert: altas }).subscribe(evt => {
        this.formChange$.next('')
        this.cleanTable()
      });
    }
  }

  confirmDeleteImportacion() {
    if ( this.NotificationIdForDelete > 0) {
      (document.querySelectorAll('nz-notification')[0] as HTMLElement).hidden = true;
      this.apiService.setDeleteImportacion({deleteId: this.NotificationIdForDelete}).subscribe(evt => {
        this.recargarPaginaDespuesDe3Segundos()
      });
    }
  }

  recargarPaginaDespuesDe3Segundos() {
    setTimeout(() => {
      window.location.reload();
    }, 3000); // 3000 milisegundos = 3 segundos
  }

  onCellChanged(e: any) {
    /*
    let row = e.detail.args.item
    //console.log('row',row)
    if (!row.detalle && !row.des_movimiento && !row.ObjetivoDescripcion && !row.PersonalDescripcion && !row.monto && !row.des_cuenta)
      this.angularGridEdit.gridService.deleteItem(row)

    if (row.detalle && row.des_movimiento && (row.ObjetivoDescripcion || row.ApellidoNombre) && row.monto && row.des_cuenta) { 

      // se agrega isfull para luego validar que el registro este commpleto en (confirmNewItem)
      row.isfull = 1;
      
      if (document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.contains("elementAddNoComplete")) {
        // Si la clase existe, elimínala
        document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.remove("elementAddNoComplete");
      }

      document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.add("elementAdd")
     
    }else{
    //NOTA: EVALUAR Si tiene isfull en true y ponerle false y quitar los estilos si los tiene
      row.isfull = 2;

      
      if (document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.contains("elementAdd")) {
        // Si la clase existe, elimínala
        document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.remove("elementAdd");
      }
      document.getElementsByClassName("ui-widget-content slick-row even")[row.id - 1].classList.add("elementAddNoComplete")
    }

//    this.angularGridEdit.dataView.updateItem(row.id, row);
    this.angularGridEdit.slickGrid.updateRow(row)
    console.log('updateRow',row.isfull)

    const lastrow:any = this.gridDataInsert[this.gridDataInsert.length - 1];
    if (lastrow && (lastrow.detalle || lastrow.des_movimiento || lastrow.ObjetivoDescripcion || lastrow.PersonalDescripcion || lastrow.monto || lastrow.des_cuenta)) { 
      this.addNewItem("bottom")
    }
*/
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
        this.recargarPaginaDespuesDe3Segundos()
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

}

