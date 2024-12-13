import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ClientesFormComponent } from "../clientes-form/clientes-form.component"

@Component({
  selector: 'app-precios-productos',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS, 
    CommonModule, 
    FiltroBuilderComponent,
  ],
  templateUrl: './precios-productos.component.html',
  styleUrl: './precios-productos.component.less'
})
export class PreciosProductosComponent {

  
  startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private angularUtilService = inject(AngularUtilService)
  formChange$ = new BehaviorSubject('')
  listPrecios$ = new BehaviorSubject('')
  editProducto = signal(0)
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  angularGrid!: AngularGridInstance
  gridOptions!: GridOption

  detailViewRowCount = 1
  excelExportService = new ExcelExportService()

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listPrecios$.next('')
  }

  columns$ = this.apiService.getCols('/api/precios-productos/cols')

  async ngOnInit(){

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

 
  }

  gridData$ = this.listPrecios$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getListaPrecioProductos({ options: this.listOptions })
        .pipe(map(data => {
          return data.list
        })
      )
    })
  ) 

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id)
      this.editProducto.set(row.id)

  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
         totalRecords(this.angularGrid)
         columnTotal('cantidad', this.angularGrid)
    })
    if (this.apiService.isMobile())
        this.angularGrid.gridService.hideColumnByIds([])
  }

}
