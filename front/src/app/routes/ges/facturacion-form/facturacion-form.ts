import { ChangeDetectionStrategy, Component, inject, input,signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, GridOption, SlickGrid } from 'angular-slickgrid';
import { LoadingService } from '@delon/abc/loading';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

@Component({
  selector: 'app-facturacion-form',
  imports: [  
    SHARED_IMPORTS,
    CommonModule,],
  templateUrl: './facturacion-form.html',
  styleUrl: './facturacion-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class FacturacionFormComponent {

  rowSelected = input<any>(null);
  resultgrid = signal<any>(null)
  rowSelectedSearch = signal<any>(null)
  comprobanteNroold = signal<string>("")
  excelExportService = new ExcelExportService()
  angularGrid!: AngularGridInstance
  gridOptions!: GridOption
  formChangefacturacion$ = new BehaviorSubject('')
  tableLoading$ = new BehaviorSubject(false)
  gridObj!: SlickGrid
  detailViewRowCount = 1
  isDetail = input<boolean>(false)
  FacturacionCodigo = signal<any[]>([])
  private readonly loadingSrv = inject(LoadingService)
  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)


  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null
  }

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    ClienteFacturacionCUIT: 0,
    ClienteApellidoNombre: "",
    ComprobanteNro: "",
    ImporteTotal: 0,
    ComprobanteTipoCodigo: "",
    comprobanteNroold: "",
    ClienteId: 0,
    ClienteElementoDependienteId: 0
  })

  $optionsComprobanteTipo = this.searchService.getComprobanteTipoSearch();

  columns$ = this.apiService.getCols('/api/facturacion/colsDetail').pipe(map((cols) => {
    return cols
  }))

  gridData$ = this.formChangefacturacion$.pipe(
    debounceTime(500),
    doOnSubscribe(() => this.loadingSrv.open()),
    switchMap(() => {
      if (this.rowSelected() && this.rowSelected().length > 0) {
        this.FacturacionCodigo.set(this.rowSelected().map((item: any) => item.FacturacionCodigo))
        return this.apiService.getFacturas(
          this.rowSelected()[0]?.ComprobanteNro,
          this.FacturacionCodigo()
        ).pipe(
          map((data: any) => {
            const list = data.list ?? []
            this.resultgrid.set(list)
            return list;
          }),
          catchError(() => of([])),
          tap({ complete: () => this.loadingSrv.close() })
        );
      } else {
        this.loadingSrv.close();
        return of([]);
      }
    })
  );

 
  ngOnChanges(changes: SimpleChanges) {
    if (changes['rowSelected'] && this.rowSelected()) {
      this.formChangefacturacion$.next('')
      this.ngOnInit();
     
    }
  
    if(!this.isDetail() ){
      console.log("isDetail ",this.isDetail(),"entro")
        this.formCli.get('ComprobanteNro')?.enable()

        if (!this.rowSelected()[0]?.ComprobanteNro) {
          this.formCli.get('ComprobanteTipoCodigo')?.enable()
        } 
    }else{
      this.formCli.get('ComprobanteNro')?.disable()
      this.formCli.get('ComprobanteTipoCodigo')?.disable()
    } 


    
  }

  async ngOnInit(){

    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainerFacturacionForm', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true

    this.gridOptions.autoResize = {
      container: '.gridContainerFacturacionForm',
      rightPadding: 0,
      bottomPadding: 0,
      calculateAvailableSizeBy: 'container',
      minHeight: 400,
      maxHeight: 400
    };

      //this.formCli.disable()
      this.formCli.get('ClienteFacturacionCUIT')?.disable()
      this.formCli.get('ClienteApellidoNombre')?.disable()

      //console.log(this.formCli.disabled)
      //console.log(this.formCli.getRawValue()); 

  if(this.rowSelected().length > 0){

      let clienteId = this.rowSelected()?.[0]?.ObjetivoCodigo?.split('/')[0]
      let clienteElementoDependienteId = this.rowSelected()?.[0]?.ObjetivoCodigo?.split('/')[1]

     
      this.formCli.patchValue({
        comprobanteNroold: this.rowSelected()?.[0]?.ComprobanteNro,
        ClienteFacturacionCUIT: this.rowSelected()?.[0]?.ClienteFacturacionCUIT,
        ClienteApellidoNombre: this.rowSelected()?.[0]?.ClienteApellidoNombre,
        ComprobanteNro: this.rowSelected()?.[0]?.ComprobanteNro,
        ComprobanteTipoCodigo: this.rowSelected()?.[0]?.ComprobanteTipoCodigo,
        ClienteId: clienteId,
        ClienteElementoDependienteId: clienteElementoDependienteId
      })
   }

  }

  async save(){
    await firstValueFrom(this.apiService.saveFacturacion(this.formCli.value,this.resultgrid()))

      this.rowSelected().forEach((row: any) => {
        row.ComprobanteNro = this.formCli.get('ComprobanteNro')?.value;
      })
      
     this.formChangefacturacion$.next('')
  }

  angularGridReady(angularGrid: any) {

    this.angularGrid = angularGrid.detail
    this.gridObj = angularGrid.detail.slickGrid;

    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('PrecioUnitario', this.angularGrid)
      columnTotal('Cantidad', this.angularGrid)
      columnTotal('ImporteTotal', this.angularGrid)
    })

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])

  }

  exportGrid() {
    this.excelExportService.exportToExcel({
      filename: 'detalle-facturacion',
      format: "xlsx"
    });
  }
}
