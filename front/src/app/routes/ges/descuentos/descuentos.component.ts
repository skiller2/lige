import { Component, inject, input } from '@angular/core';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';

enum Busqueda {
  Responsable
}

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule],
  templateUrl: './descuentos.component.html',
  providers: [AngularUtilService, ExcelExportService],
  styleUrl: './descuentos.component.less'
})

export class DescuentosComponent {
  angularGridPersonal!: AngularGridInstance;
  gridObjPersonal!: SlickGrid;
  tableLoading$ = new BehaviorSubject(false);
  gridOptionsPersonal!: GridOption
  $selectedResponsablePersonalIdChange = new BehaviorSubject('');
  $isResponsableDataLoading = new BehaviorSubject(false);
  personalIdlist: number[] = []


  //  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  //  private router= inject(Router)
  //  private route= inject(ActivatedRoute)
  //  private settingService= inject(SettingsService)
  private excelExportService = inject(ExcelExportService)
  private angularUtilService = inject(AngularUtilService)

  periodo = input.required<any>();


  columnsPersonal$ = this.apiService.getCols('/api/asistencia/personalxresp/cols').pipe(map((cols) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == "PersonaDes")
        col.asyncPostRender = this.renderAngularComponent.bind(this)
      return col
    });
    return mapped
  }));

  listOptionsPersonal: listOptionsT = {
    filtros: [],
    sort: null,
  };

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'PersonaDes':
        Object.assign(componentOutput.componentRef.instance, {
          link: '/ges/detalle_asistencia/persona', params: { PersonalId: dataContext.PersonalId }, detail: cellNode.innerText
        })

        break;
      case 'ObjetivoDescripcion':
        Object.assign(componentOutput.componentRef.instance, { link: '/ges/detalle_asistencia/objetivo', params: { ObjetivoId: dataContext.objetivo_id }, detail: cellNode.innerText })

        break;

      default:
        break;
    }

    cellNode.replaceChildren(componentOutput.domElement)
  }


  async angularGridReady(angularGrid: any) {

    this.angularGridPersonal = angularGrid.detail
    this.gridObjPersonal = angularGrid.detail.slickGrid;

    if (this.apiService.isMobile())
      this.angularGridPersonal.gridService.hideColumnByIds(['CUIT'])

    this.angularGridPersonal.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridPersonal)
      columnTotal('PersonalAdelantoMonto', this.angularGridPersonal)
    })

  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'adelantos-listado',
      format: FileType.xlsx
    });
  }

  listOptionsChange(options: any) {
    this.listOptionsPersonal = options;
    //    this.formChange$.next('');

  }




  gridDataPersonal$ = this.$selectedResponsablePersonalIdChange.pipe(
    //debounceTime(500),
    switchMap((PersonalId) => {
      return this.apiService
        .getPersonasResponsable(
          { options: this.listOptionsPersonal, PersonalId: Number(PersonalId), anio: this.periodo.year, mes: this.periodo.month }
        )
        .pipe(
          map(data => {
            this.personalIdlist = []
            for (const row of data.persxresp)
              this.personalIdlist.push(row.PersonalId)

            return data.persxresp

          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  selectedValueChange(event: string, busqueda: Busqueda): void {
    switch (busqueda) {
      case Busqueda.Responsable:
        this.$selectedResponsablePersonalIdChange.next(event);
        this.$isResponsableDataLoading.next(true);
        return;
    }
  }

  ngOnInit(): void {
    this.gridOptionsPersonal = this.apiService.getDefaultGridOptions('.gridContainer', 9, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsPersonal.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsPersonal.showFooterRow = true
    this.gridOptionsPersonal.createFooterRow = true

  }


}
