import { Component, ViewChild, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../../../shared/row-preload-detail/row-preload-detail.component';
import { AngularGridInstance, AngularUtilService, Column, Formatters, FieldType, Editors, FileType, GridOption, OnEventArgs, SlickGrid, SlickGridEventData } from 'angular-slickgrid';
import { CommonModule, NgIf } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { NzModalService,NzModalModule } from "ng-zorro-antd/modal";

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
  constructor(public apiService: ApiService, private injector: Injector, public router: Router, private angularUtilService: AngularUtilService,private modal: NzModalService) { }


  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');
  files: NzUploadFile[] = [];
  columnDefinitions: Column[] = [];
  toggle = false;
  detailViewRowCount = 9;
  gridDataLen = 0
  tableLoading$ = new BehaviorSubject(false);
  filesChange$ = new BehaviorSubject('');
  gridOptions!: GridOption;
  gridOptionsEdit!: GridOption;
  selectedPeriod = { year: 0, month: 0 };
  gridDataInsert = [];
  isFull = false;

  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance;
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  gridObjEdit!: SlickGrid;

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
            this.gridDataLen = data?.list?.length
            console.log("data",data)
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
          collectionAsync: this.apiService.getTipoMovimiento(),
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
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.currency, Formatters.alignRight] },
        editor: {
          model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
        }
      }
    ];

    this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.gridContainer2', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsEdit.enableRowDetailView = false
    this.gridOptionsEdit.autoEdit = true

    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
      });
      


    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()

  }

  // onBeforeEditCell($event:any) {
  //   console.log("soy el data set", this.gridDataInsert)
  //   // this.angularGrid.resizerService.pauseResizer(true);
  // }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  addNewItem(insertPosition?: 'bottom') {
    const newItem1 = this.createNewItem(1);
    this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow:false, scrollRowIntoView:false, triggerEvent:false });
  }

  confirmNewItem(){

      //TODO Usar this.gridDataInsert
      debugger
    console.log("este es el grid data insert", this.gridDataInsert)
    let isComplete = false;

    for(let index of this.gridDataInsert){
      //este if valida el registro que se crea vacio
       if(index["id"] != this.gridDataInsert.length - 1 ){
        
       // se valida que los registros esten completos
         if ('isfull' in index) 
          isComplete = true
        else 
          isComplete = false
       }  

    }

    if(isComplete){
      this.gridDataInsert.pop()
      this.apiService.setAgregarRegistros({ gridDataInsert: this.gridDataInsert }).subscribe(evt => {
      this.formChange$.next('')
      
    });
    }else{
     this.notification.error('Grabación', 'Campos vacios');
   }

  
    // isComplete
    // // agregar mensaje de que los registros no estan completos

  }

  onCellChanged(e: any) {
    let row = e.detail.args.item
    //console.log('row',row)
    if (!row.detalle && !row.des_movimiento && !row.ObjetivoDescripcion && !row.PersonalDescripcion && !row.monto)
      this.angularGridEdit.gridService.deleteItem(row)
      debugger
    if (row.detalle && row.des_movimiento && (row.ObjetivoDescripcion || row.PersonalDescripcion) && row.monto) { 

      // se agrega isfull para luego validar que el registro este commpleto en (confirmNewItem)
      row.isfull = 1;
      
      if (document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.contains("elementAddNoComplete")) {
        // Si la clase existe, elimínala
        document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.remove("elementAddNoComplete");
      }

      document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.add("elementAdd")
     
    }else{
    //NOTA: EVALUAR Si tiene isfull en true y ponerle false y quitar los estilos si los tiene
      row.isfull = 2;

      
      if (document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.contains("elementAdd")) {
        // Si la clase existe, elimínala
        document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.remove("elementAdd");
      }
      document.getElementsByClassName("ui-widget-content")[row.id - 1].classList.add("elementAddNoComplete")
    }

    const lastrow:any = this.gridDataInsert[this.gridDataInsert.length - 1];
    if (lastrow && (lastrow.detalle || lastrow.des_movimiento || lastrow.ObjetivoDescripcion || lastrow.PersonalDescripcion || lastrow.monto)) { 
      this.addNewItem("bottom")
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
      isfull:0,
      periodo: periodoM + "/" + periodoY,
      fecha: new Date(),
      detalle: ""
      
    };
  }
  

  openCustomModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Agregar liquidaciones',
      nzContent: 'Seguro que desea cargar las liquidaciones...', 
      nzFooter: [
        {
          label: 'Aceptar',
          onClick: () => {
            // Acciones al hacer clic en "Aceptar"
            this.confirmNewItem();
            modalRef.close();
          },
          class: 'custom-modal-button', 
        },
        {
          label: 'Cancelar',
          onClick: () => {
            // Acciones al hacer clic en "Cancelar"
            modalRef.close();
          },
          class: 'custom-modal-button', 
        },
      ],
      nzClassName: 'custom-modal', // Clase CSS para el modal
    });
  }
 
}





