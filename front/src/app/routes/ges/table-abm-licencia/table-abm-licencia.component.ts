import { Component, inject, input, EventEmitter, Output, signal, resource } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import {
  firstValueFrom,
} from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Column, AngularGridInstance, AngularUtilService, SlickGrid, GridOption, OnClickEventArgs } from 'angular-slickgrid';
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

interface PersonalLicencia {
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

}

@Component({
    selector: 'app-table-abm-licencia',
    imports: [SHARED_IMPORTS,
        CommonModule,
        NzAffixModule,
        FiltroBuilderComponent,
    ],
    providers: [AngularUtilService],
    templateUrl: './table-abm-licencia.component.html',
    styleUrl: './table-abm-licencia.component.less'
})
export class TableAbmLicenciaComponent {

  private readonly route = inject(ActivatedRoute);
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private settingService = inject(SettingsService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService)

  @Output()valueGridEvent = new EventEmitter();

  excelExportService = new ExcelExportService()
  angularGridEdit!: AngularGridInstance;
  gridObj!: SlickGrid;
  detailViewRowCount = 9
  gridOptions!: GridOption
  gridDataLen = 0
  
  dataAngularGrid:any
  personalLicencias: PersonalLicencia[] = [];


  anio = input<number>();
  mes = input<number>();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
    extra: null
  });

  columns = toSignal(this.apiService.getCols('/api/carga-licencia/cols'), { initialValue: [] as Column[] })
  gridData = resource({
    params: () => ({ options: this.listOptions(), anio: this.anio(), mes:this.mes() }),
    loader: async ({ params }) => {
      let response:any = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        params.options.extra = { 'todos': (this.route.snapshot.url[1].path == 'todos') }
        const res = await firstValueFrom(this.apiService.getListCargaLicencia(
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
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer1', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
 
  }

  

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    const componentOutput = this.angularUtilService.createAngularComponent(CustomLinkComponent)
    cellNode.replaceChildren(componentOutput.domElement)
  }

  ngOnDestroy() {
  }
  

  angularGridReady(angularGrid: any) {

    this.angularGridEdit = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridEdit)
    })   

    this.angularGridEdit.slickGrid.onClick.subscribe((e, args)=> {
      this.personalLicencias = []
      var data = this.dataAngularGrid[args.row]
      this.personalLicencias.push(data);
      this.valueGridEvent.emit(this.personalLicencias)
    });
    
   
  }

  valueRowSelectes(value:number){
    this.dataAngularGrid
  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'lista-permisocarga',
      format: 'xlsx'
    });
  }

 
}
 

