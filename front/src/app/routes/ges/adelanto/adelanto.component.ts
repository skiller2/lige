import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { AngularGridInstance, AngularUtilService, Column, Editors, FileType, GridOption, OnEventArgs, SlickGrid, SlickGridEventData } from 'angular-slickgrid';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less'],
  standalone: true,
  imports: [SharedModule, FiltroBuilderComponent],
  providers: [AngularUtilService, ExcelExportService]

})
export class AdelantoComponent {
  constructor(private apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService, private excelExportService: ExcelExportService) { }
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm;

  selectedPeriod = { year: 0, month: 0 };

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);

  detailViewRowCount = 9;
  gridData: any[] = []
  columnDefinitions: Column[] = []
  gridOptions!: GridOption;

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }

  columns$ = this.apiService.getCols('/api/adelantos/cols').pipe(map((cols) => {

    const colmonto: Column = {
      name: "Importe",
      type: "float",
      id: "monto",
      field: "monto",
      sortable: true,
      //      formatter: () => '...',
      //asyncPostRender: this.renderAngularComponent.bind(this),
      //params: {
      //  component: CustomDescargaComprobanteComponent,
      //  angularUtilService: this.angularUtilService,
      //complexFieldLabel: 'assignee.name' // for the exportCustomFormatter
      //},

    }


    let mapped = cols.map((col: Column) => {
      if (col.id == 'PersonalAdelantoMonto') {
        col.editor = {
          model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 10000000, alwaysSaveOnEnterKey: true, required: true
        }
      }
      return col
    });

    return mapped
  }));

  angularGrid!: AngularGridInstance;
  gridObj!: SlickGrid;

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };


  gridData$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.adelanto.form.get('periodo')?.value
      return this.apiService
        .getPersonasAdelanto(
          { anio: periodo.getFullYear(), mes: periodo.getMonth() + 1, options: this.listOptions }
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

  async ngOnInit() {
    /*
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
        this.angularGrid.slickGrid.invalidate();
        this.angularGrid.slickGrid.reRenderColumns(true)
        this.angularGrid.slickGrid.render()
      });
*/
    this.gridOptions = this.apiService.getDefaultGridOptions(this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.autoEdit = true
    this.gridOptions.editCommandHandler = async (item, column, editCommand) => {
      editCommand.execute();
      //editCommand.undo()  Si no pudo comitear

      if (item.PersonalAdelantoMonto == 0) {
        const res = await firstValueFrom(this.apiService
          .delAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto }))
        console.log('del', res)
        item.PersonalAdelantoFechaSolicitud = null
        item.PersonalAdelantoMonto = null
        this.angularGrid.dataView.updateItem(item.id, item);
        this.angularGrid.slickGrid.reRenderColumns(true)
/*
        this.apiService
        .delAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto })
        .pipe(
          doOnSubscribe(() => this.deleteLoading$.next(true)),
          tap({
            finalize: () => this.deleteLoading$.next(false),
          }),
//          takeUntilDestroyed()

        )
        .subscribe();
  */
      } else if (item.PersonalAdelantoMonto > 0) {

        const res:any = await firstValueFrom(this.apiService
          .addAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto }))
        
        console.log('add', res)
        item.PersonalAdelantoFechaSolicitud = res.data.PersonalAdelantoFechaSolicitud 
        console.log('set', item)

        this.angularGrid.dataView.updateItem(item.id, item);
        this.angularGrid.slickGrid.reRenderColumns(true)
//        this.angularGrid.slickGrid.updateRow()
        
        /*
        this.apiService
          .addAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto })
          .pipe(

            doOnSubscribe(() => this.saveLoading$.next(true)),
            tap({
              complete: () => {
                //            this.formChange('');
                //            this.adelanto.form.get('monto')?.setValue(null);
              },
              finalize: () => this.saveLoading$.next(false),
            }),
  //          takeUntilDestroyed()
          )
          .subscribe();
*/



      }

    }
    if (!this.apiService.isMobile())
      this.gridOptions.enableRowDetailView = false

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

      this.adelanto.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
    }, 1);
  }

  personaResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
  $personaResponsables = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaResponsables(
          this.selectedPeriod.year,
          this.selectedPeriod.month,
          this.adelanto.form.get('PersonalId')?.value
        )
        .pipe(
          doOnSubscribe(() => this.personaResponsablesLoading$.next(true)),
          tap({ complete: () => this.personaResponsablesLoading$.next(false) })
        )
    )
  );

  listaAdelantos$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getAdelantos(
          this.selectedPeriod.year,
          this.selectedPeriod.month,
          this.adelanto.form.get('PersonalId')?.value
        )
        .pipe(
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    )
  );

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange('');
  }

  formChange(event: any) {
    this.formChange$.next(event);
  }

  SaveForm() {
    this.apiService
      .addAdelanto(this.adelanto.value)
      .pipe(
        doOnSubscribe(() => this.saveLoading$.next(true)),
        tap({
          complete: () => {
            this.formChange('');
            this.adelanto.form.get('monto')?.setValue(null);
          },
          finalize: () => this.saveLoading$.next(false),
        })
      )
      .subscribe();
  }

  DeleteForm() {
    this.apiService
      .delAdelanto(this.adelanto.value)
      .pipe(
        doOnSubscribe(() => this.deleteLoading$.next(true)),

        tap({
          complete: () => this.formChange(''),
          finalize: () => this.deleteLoading$.next(false),
        })
      )
      .subscribe();
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    const allColumns = this.angularGrid.gridService.getAllColumnDefinitions();



    let newCols: Column[] = await firstValueFrom(this.columns$)


    allColumns.push(...newCols)
    this.columnDefinitions = allColumns;

    //    this.gridObj.bindOnBeforeEditCell(grid);

    //    this.gridObj.onCellChange =  (e: Event, args: OnEventArgs) => {
    //      console.log(args);
    //          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
    //    }

    //    this.gridObj.onBeforeEditCell = (eventData: any, args: SlickGridEventData): boolean => {

    //return true
    //    }


    setTimeout(() => {
      //      if (this.apiService.isMobile())
      //        this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])

    }, 0)
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'adelantos-listado',
      format: FileType.xlsx
    });
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');

  }

  handleOnBeforeEditCell(e: Event) {
    const { column, item, grid } = (<CustomEvent>e).detail.args;
    if (item.PersonalAdelantoFechaAprobacion != null) {
      e.stopImmediatePropagation();
      return false
    }
    /*
    if (column && item) {
      if (!checkItemIsEditable(item, column, grid)) {
        e.stopImmediatePropagation();
        return false;
      }
    }
    */
    return true;
  }

}

