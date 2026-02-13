import { Component, Injector, ViewChild, inject, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { AngularGridInstance, AngularUtilService, Column, Editors, FileType, GridOption, OnEventArgs, SlickGrid } from 'angular-slickgrid';
import { BehaviorSubject, Observable, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Router } from '@angular/router';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CommonModule } from '@angular/common';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { SearchService } from 'src/app/services/search.service';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { CustomFloatEditor } from 'src/app/shared/custom-float-grid-editor/custom-float-grid-editor.component';



@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less'],
  providers: [AngularUtilService, ExcelExportService],
  imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, PersonalSearchComponent, ViewResponsableComponent]
})
export class AdelantoComponent {
  startFilters = signal<any[]>([])
  constructor(private settingService: SettingsService, public router: Router, private angularUtilService: AngularUtilService, private excelExportService: ExcelExportService) { }
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm;
  //@ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)

  selectedPeriod = { year: 0, month: 0 };

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);
  objetivos$ = new Observable<any>
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  periodo = signal(new Date())
  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component && dataContext.monto > 0) {
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component)
      Object.assign(componentOutput.componentRef.instance, { item: dataContext, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month })
      cellNode.append(componentOutput.domElement)
      //setTimeout(() => cellNode.append(componentOutput.domElement))
    }
  }

  columns$ = this.apiService.getCols('/api/adelantos/cols').pipe(map((cols: Column<any>[]) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == 'PersonalPrestamoMonto') {
        col.editor = {
          model: CustomFloatEditor,
          decimal: 2,
          minValue: 0,
          maxValue: 10000000,
          alwaysSaveOnEnterKey: true,
          required: true
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
      //const periodo = this.adelanto.form.get('periodo')?.value
      return this.apiService
        .getPersonasAdelanto(
          { anio: this.selectedPeriod.year, mes: this.selectedPeriod.month, options: this.listOptions }
        )
        .pipe(
          map((data: any) => {
            this.gridDataLen = data.list.length
            return data.list
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  async ngOnInit() {
    const now = new Date(); //date
    const anio =
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear();
    const mes =
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;
    this.periodo.set(new Date(anio, mes - 1, 1))
    this.selectedPeriod = { year: anio, month: mes }

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.editable = true
    this.gridOptions.autoEdit = true



    this.gridOptions.editCommandHandler = async (item, column, editCommand) => {
      if (column.id != 'PersonalPrestamoMonto') return
      editCommand.execute();
      try {
        if (item.PersonalPrestamoMonto == 0) {
          const res = await firstValueFrom(this.apiService
            .delAdelanto({ PersonalId: item.PersonalId, monto: item.PersonalPrestamoMonto, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month }))
          item = { ...item, PersonalPrestamoAudFechaIng: null, PersonalPrestamoMonto: null, FormaPrestamoDescripcion: null }

        } else if (item.PersonalPrestamoMonto > 0) {
          const res: any = await firstValueFrom(this.apiService
            .addAdelanto({ PersonalId: item.PersonalId, monto: item.PersonalPrestamoMonto, anio: this.selectedPeriod.year, mes: this.selectedPeriod.month }))

          const resObj = res?.data
          if (resObj)
            item = { ...item, ...resObj }

        }
      } catch (err) {
        editCommand.undo()
      }

      this.angularGrid.dataView.updateItem(item.id, item);
      this.angularGrid.slickGrid.updateRow(editCommand.row)

    }

  }


  ngAfterViewInit(): void {
  }

  ngAfterContentInit(): void {
    const user: any = this.settingService.getUser()
    this.startFilters.set([
      { field: 'GrupoActividadNumero', condition: 'AND', operator: '=', value: user.GrupoActividad.map((grupo: any) => grupo.GrupoActividadNumero).join(';'), closeable: true },])


  }

  personaResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
  $personaResponsables = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      this.objetivos$ = this.searchService.getAsistenciaPersona(this.adelanto.form.get('PersonalId')?.value, this.selectedPeriod.year, this.selectedPeriod.month)

      return this.apiService
        .getPersonaResponsables(
          this.adelanto.form.get('PersonalId')?.value,
          this.selectedPeriod.year,
          this.selectedPeriod.month,

        )
        .pipe(
          doOnSubscribe(() => this.personaResponsablesLoading$.next(true)),
          tap({ complete: () => this.personaResponsablesLoading$.next(false) })
        )


    }
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
    const vals = this.adelanto.value
    vals.anio = this.selectedPeriod.year
    vals.mes = this.selectedPeriod.month
    this.apiService
      .addAdelanto(vals)
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
      this.angularGrid.gridService.hideColumnByIds(['CUIT'])

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('PersonalPrestamoMonto', this.angularGrid)
    })

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
    if (column.id != 'PersonalPrestamoMonto') {
      e.stopImmediatePropagation();
      return false
    }

    if (item.PersonalPrestamoFechaAprobacion != null) {
      e.stopImmediatePropagation();
      return false
    }
    return true;
  }
}
