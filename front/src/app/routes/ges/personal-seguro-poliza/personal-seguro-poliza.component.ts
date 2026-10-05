import { ChangeDetectionStrategy, Component, effect, inject, input, signal, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { firstValueFrom } from 'rxjs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-personal-seguro-poliza',
  imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent],
  templateUrl: './personal-seguro-poliza.component.html',
  styleUrl: './personal-seguro-poliza.component.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalSeguroPolizaComponent {

  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  public searchService = inject(SearchService)

  
  gridOptions!: GridOption;
  private gridObj!: SlickGrid;
  private dataAngularGrid = [];
  private personalSeguro: any[] = [];
  private readonly detailViewRowCount = 9;
  private excelExportService = new ExcelExportService();
  private angularGridEdit!: AngularGridInstance;
  private readonly loadingSrv = inject(LoadingService)

  angularGrid!: AngularGridInstance
  startFilters = signal<Selections[]>([])
  PolizaSeguroNroPoliza = input<string>("")
  PolizaSeguroNroEndoso = input<string>("")
  CompaniaSeguroId = input<number>(0)
  TipoSeguroCodigo = input<string>("")

  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
    extra: null,
  });

  effect = effect(() => {
    this.PolizaSeguroNroPoliza()
    this.PolizaSeguroNroEndoso()
    this.CompaniaSeguroId()
    this.TipoSeguroCodigo()

    this.listOptions.set({
      filtros: [],
      sort: null,
      extra: null,
    })
    this.startFilters.set([])

    if (this.PolizaSeguroNroPoliza() != "" && this.PolizaSeguroNroEndoso() != "" && this.CompaniaSeguroId() != 0 && this.TipoSeguroCodigo() != "") {
      this.startFilters.set([
        { index: 'PolizaSeguroNroPoliza', condition: 'AND', operator: '=', value: this.PolizaSeguroNroPoliza(), closeable: true },
        { index: 'PolizaSeguroNroEndoso', condition: 'AND', operator: '=', value: this.PolizaSeguroNroEndoso(), closeable: true },
        { index: 'CompaniaSeguroId', condition: 'AND', operator: '=', value: this.CompaniaSeguroId(), closeable: true },
        { index: 'TipoSeguroCodigo', condition: 'AND', operator: '=', value: this.TipoSeguroCodigo(), closeable: true },
      ])
    }

  });

  columns = toSignal(this.apiService.getCols('/api/seguros/cols-personal-seguro'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.getListPolizaPersonalSeguro({ options: params.options }));
        this.dataAngularGrid = res.list;
        response = res.list;
      } catch (error) {}
      
      this.loadingSrv.close()
      return response || [];
    },
    defaultValue: []
  });

  ngOnInit(): void {
    this.initializeGridOptions();
  }

  private initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerPersonalSeguro',
      this.detailViewRowCount,
      this.excelExportService,
      this.angularUtilService,
      this,
      RowDetailViewComponent
    );
    this.gridOptions.enableRowDetailView = this.apiService.isMobile();
    this.gridOptions.showFooterRow = true;
    this.gridOptions.createFooterRow = true;
  }

  angularGridReady(angularGrid: any): void {
    this.angularGridEdit = angularGrid.detail;
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGridEdit.dataView.onRowsChanged.subscribe(() => {
      totalRecords(this.angularGridEdit);
    });

    this.angularGridEdit.slickGrid.onClick.subscribe((_e: any, args: { row: number }) => {
      this.personalSeguro = [this.dataAngularGrid[args.row]];
    });
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-personal-seguro',
      format: 'xlsx'
    });
  }

}
