import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, model, Output, signal, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption, Column } from 'angular-slickgrid';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { totalRecords } from '../../../shared/custom-search/custom-search';
import { PolizaSeguroDrawerComponent } from '../poliza-seguro-drawer/poliza-seguro-drawer.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

interface ListOptions {
  filtros: any[];
  extra: any;
  sort: any;
}

interface PolizaSeguro {
  id: number;
  TipoSeguroNombre: string;
  TipoSeguroCodigo: string;
  CompaniaSeguroId: number;
  PolizaSeguroNroPoliza: string;
  PolizaSeguroNroEndoso: string;
  PolizaSeguroFechaEndoso: string;
}


@Component({
  selector: 'app-poliza-seguro',
  imports: [ SHARED_IMPORTS, CommonModule,FiltroBuilderComponent, PolizaSeguroDrawerComponent],
  templateUrl: './poliza-seguro.component.html',
  styleUrl: './poliza-seguro.component.less',
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolizaSeguroComponent {
  
  @Output() valueGridEvent = new EventEmitter<PolizaSeguro[]>();
  
  gridOptions!: GridOption;
  private gridObj!: SlickGrid;
  private dataAngularGrid: PolizaSeguro[] = [];
  private polizaSeguro: PolizaSeguro[] = [];
  private readonly detailViewRowCount = 9;
  private excelExportService = new ExcelExportService();
  private angularGridEdit!: AngularGridInstance;
  visible = model<boolean>(false)
  angularGrid!: AngularGridInstance
  PolizaSeguroNroPoliza = model<string>("")
  PolizaSeguroNroEndoso = model<string>("")
  CompaniaSeguroId = model<number>(0)
  TipoSeguroCodigo = model<string>("")
  openDrawerConsult = signal<boolean>(false)
  selectedPoliza = signal<PolizaSeguro | null>(null)
  isDeleting = signal<boolean>(false)

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
    extra: null,
  });

  columns = toSignal(this.apiService.getCols('/api/seguros/cols-poliza'), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        const res = await firstValueFrom(this.apiService.getListPolizaSeguro({ options: params.options }));
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
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerPoliza',
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
      this.polizaSeguro = [this.dataAngularGrid[args.row]];
      this.valueGridEvent.emit(this.polizaSeguro);
    });
  }

  handleSelectedRowsChanged(e: any): void {

    const selrow = e.detail.args.rows[0]
    const row = (selrow != null) ? this.angularGridEdit.slickGrid.getDataItem(selrow) : null

    // La fila completa o nada: no se conservan claves de una selección anterior
    this.selectedPoliza.set(row?.PolizaSeguroNroPoliza ? row : null)
  }

  exportGrid(): void {
    this.excelExportService.exportToExcel({
      filename: 'lista-poliza-seguro',
      format: 'xlsx'
    });
  }

  onRefreshPolizaSeguro(){
    // Al recargar la grilla la fila seleccionada deja de ser válida
    this.selectedPoliza.set(null)
    this.gridData.reload()
  }

  async deletePoliza() {
    const poliza = this.selectedPoliza()
    if (!poliza) return

    this.isDeleting.set(true)
    try {
      await firstValueFrom(this.apiService.deletePolizaSeguro({
        PolizaSeguroNroPoliza: poliza.PolizaSeguroNroPoliza,
        PolizaSeguroNroEndoso: poliza.PolizaSeguroNroEndoso,
        CompaniaSeguroId: poliza.CompaniaSeguroId,
        TipoSeguroCodigo: poliza.TipoSeguroCodigo
      }))
      this.selectedPoliza.set(null)
      this.gridData.reload()
    } catch (error) {
      // El mensaje de error lo muestra el apiService
    }
    this.isDeleting.set(false)
  }

  ////////// Drawer para nuevo /////////////

  async openDrawerForNew() {

    this.PolizaSeguroNroPoliza.set('')
    this.PolizaSeguroNroEndoso.set('')
    this.CompaniaSeguroId.set(0)
    this.TipoSeguroCodigo.set('')
    this.openDrawerConsult.set(false)
    this.visible.set(true)
  }

  async openDrawerforEdit() {
    if (!this.cargarPolizaSeleccionada()) return

    this.openDrawerConsult.set(false)
    this.visible.set(true)
  }

  async openDrawerForConsult() {
    if (!this.cargarPolizaSeleccionada()) return

    this.openDrawerConsult.set(true)
    this.visible.set(true)
  }

  // Pasa la clave de la fila seleccionada al drawer
  private cargarPolizaSeleccionada(): boolean {
    const poliza = this.selectedPoliza()
    if (!poliza) return false

    this.PolizaSeguroNroPoliza.set(poliza.PolizaSeguroNroPoliza)
    this.PolizaSeguroNroEndoso.set(poliza.PolizaSeguroNroEndoso)
    this.CompaniaSeguroId.set(poliza.CompaniaSeguroId)
    this.TipoSeguroCodigo.set(poliza.TipoSeguroCodigo)
    return true
  }
}
