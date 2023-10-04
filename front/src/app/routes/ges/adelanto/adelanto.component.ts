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
import { SettingsService } from '@delon/theme';



@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less'],
  standalone: true,
  imports: [SharedModule, FiltroBuilderComponent],
  providers: [AngularUtilService, ExcelExportService]

})
export class AdelantoComponent {
  constructor(private settingService: SettingsService, private apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService, private excelExportService: ExcelExportService) { }
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm;
  @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;

  selectedPeriod = { year: 0, month: 0 };

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);

  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }

  columns$ = this.apiService.getCols('/api/adelantos/cols').pipe(map((cols) => {
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
            this.gridDataLen = data.list.length
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  async ngOnInit() {


    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.autoEdit = true
    this.gridOptions.editCommandHandler = async (item, column, editCommand) => {
      editCommand.execute();
      try {
        if (item.PersonalAdelantoMonto == 0) {
          const res = await firstValueFrom(this.apiService
            .delAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto }))
          item.PersonalAdelantoFechaSolicitud = null
          item.PersonalAdelantoMonto = null
        } else if (item.PersonalAdelantoMonto > 0) {
          const res: any = await firstValueFrom(this.apiService
            .addAdelanto({ PersonalId: item.OperacionesPersonalAAsignarPersonalId, monto: item.PersonalAdelantoMonto }))

          item.PersonalAdelantoFechaSolicitud = res.data.PersonalAdelantoFechaSolicitud
        }
      } catch (err) {
        editCommand.undo()
      }

      this.angularGrid.dataView.updateItem(item.id, item);
      this.angularGrid.slickGrid.updateRow(editCommand.row)

    }



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

  ngAfterContentInit(): void {
    const user: any = this.settingService.getUser()

    setTimeout(() => {
      if (user.PersonalId > 0)
      this.sharedFiltroBuilder.addFilter('ApellidoNombreJ', 'AND', '=', '548')
    }, 3000);

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

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds(['CUIT', "CUITJ", "ApellidoNombreJ"])

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
    return true;
  }

}

