import { Component, inject, input, effect, ChangeDetectionStrategy,  model } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { Injector } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, PersonalSearchComponent],
  templateUrl: './descuentos.component.html',
  providers: [AngularUtilService, ExcelExportService],
  styleUrl: './descuentos.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DescuentosComponent {
  angularGridPersonal!: AngularGridInstance;
  gridObjPersonal!: SlickGrid;
  tableLoading$ = new BehaviorSubject(false);
  gridOptionsPersonal!: GridOption
  $selectedResponsablePersonalIdChange = new BehaviorSubject(0);
  $isResponsableDataLoading = new BehaviorSubject(false);
  personalIdlist = model<number[]>([])

  //  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private excelExportService = inject(ExcelExportService)
  private angularUtilService = inject(AngularUtilService)

  periodo = input({year:0,month:0});
  responsable = model(0)
  #injector = inject(Injector);


  columnsPersonal$ = this.apiService.getCols('/api/asistencia/personalxrespdesc/cols').pipe(map((cols: Column[]) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == "ApellidoNombre")
        col.asyncPostRender = this.renderAngularComponent.bind(this)
      return col
    });
    return mapped
  }));

  listOptionsPersonal: listOptionsT = {
    filtros: [],
    sort: null,
  };

  renderAngularComponent(cellNode: HTMLElement, _row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    switch (colDef.id) {
      case 'ApellidoNombre':
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

    this.angularGridPersonal.dataView.onRowsChanged.subscribe((_e: any, _arg: any) => {
      totalRecords(this.angularGridPersonal)
      //columnTotal('', this.angularGridPersonal)
    })

  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'listado-personal',
      format: FileType.xlsx
    });
  }

  listOptionsChange(options: any) {
    this.listOptionsPersonal = options;
    //    this.formChange$.next('');
    this.selectedValueChange(this.responsable())
  }




  gridDataPersonal$ = this.$selectedResponsablePersonalIdChange.pipe(
    debounceTime(50),
    switchMap((PersonalId) => {
      return this.apiService
        .getPersonasResponsableDesc(
          { options: this.listOptionsPersonal, PersonalId: Number(PersonalId), anio: this.periodo().year, mes: this.periodo().month }
        )
        .pipe(
          map(data => {
            const lista = []
            
            for (const row of data.descuentos)
              lista.push(row.PersonalId)
            
            this.personalIdlist.set(lista)
            return data.descuentos


          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    })
  )

  selectedValueChange(event: number): void {
    this.$selectedResponsablePersonalIdChange.next(event);
    this.$isResponsableDataLoading.next(true);
  }
  
  ngOnInit(): void {
    this.gridOptionsPersonal = this.apiService.getDefaultGridOptions('.gridContainer', 9, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptionsPersonal.enableRowDetailView = this.apiService.isMobile()
    this.gridOptionsPersonal.showFooterRow = true
    this.gridOptionsPersonal.createFooterRow = true

    runInInjectionContext(this.#injector, () => {
      effect(() => {
        this.periodo()
        this.selectedValueChange(this.responsable())
      })
    })
  }
}
