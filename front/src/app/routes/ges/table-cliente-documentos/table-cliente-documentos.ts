import { Component, Output, EventEmitter, computed, input, signal, effect, model,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { AngularGridInstance, AngularUtilService, SlickGrid, GridOption } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { LoadingService } from '@delon/abc/loading';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ImageLoaderComponent } from '../../../shared/image-loader/image-loader.component';


interface ListOptions {
  filtros: any[];
  sort: any;
}

@Component({
  selector: 'app-table-cliente-documentos',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
    NgxExtendedPdfViewerModule,
    ImageLoaderComponent
  ],
  providers: [AngularUtilService],
  templateUrl: './table-cliente-documentos.html',
  styleUrls: ['./table-cliente-documentos.less'],
  standalone: true
})
export class TableClienteDocumentoComponent {
  // @Output() valueGridEvent = new EventEmitter<PersonalEstudio[]>();

  private readonly loadingSrv = inject(LoadingService);

  angularGrid!: AngularGridInstance
  gridOptions!: GridOption
  gridDataInsert: any[] = []
  excelExportService = new ExcelExportService()
  detailViewRowCount = 1
  listOptions: ListOptions = {
    filtros: [],
    sort: null,
  };

  tableLoading$ = new BehaviorSubject<boolean>(false);
  listDocsCliente$ = new BehaviorSubject('');
  startFilters = signal<any[]>([])
  ClienteId = input<number>(0);
  // RefreshCliente = model<boolean>(false);

  file = signal<any>(null)
  modalViewerVisiable1 = signal<boolean>(false)
  modalViewerVisiable2 = signal<boolean>(false)
  src = signal<any>({})
  fileName = signal<any>({})
  
  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) {
    effect(() => {
      const ClienteId = this.ClienteId()
      if (ClienteId) {
        this.listDocsCliente$.next('');
      }
    });
  }

  // private refreshEffect = effect(() => {
  //   if (this.RefreshCliente()) {
  //     console.log(' Recargando grilla');
  //     this.listOptions.filtros = [];

  //     this.listDocsCliente$.next('refresh');
  //   }
  // });


  columns$ = this.apiService.getCols('/api/clientes/docs-cols');
  gridData$ = this.listDocsCliente$.pipe(
      debounceTime(500),
      switchMap(() => {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return this.searchService.getDocsByCliente({ options: this.listOptions, ClienteId: this.ClienteId() })
          .pipe(map(data => {
            console.log('data.list:', data.list);
            
            return data.list
          }),
          doOnSubscribe(() => { }),
          tap({ complete: () => { this.loadingSrv.close() } })
        )
      })
  ) 

  ngOnInit(): void {
    // this.initializeGridOptions();
  }

  ngAfterViewInit() {
    this.initializeGridOptions();
  }

  initializeGridOptions(): void {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    
    this.gridOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    // this.gridOptions.forceFitColumns = true
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    
    console.log('row: ', row);
    
    if (row?.id){
      this.file.set(row)
    }
      // this.editClienteId.set(row.id)

  }

  listOptionsChange(options: any) {
    this.listOptions = options
    this.listDocsCliente$.next('')
  }

  previewFile(){
    this.src.set(this.file().url)
    this.fileName.set(this.file().NombreArchivo)
    if (this.file().TipoArchivo == 'pdf') {
      this.modalViewerVisiable1.set(true)
    }else if(this.file().TipoArchivo == 'png' || this.file().TipoArchivo == 'jpg'){
      this.modalViewerVisiable2.set(true)
    } else {
      

    }
  }

  handleCancel(): void {
    this.modalViewerVisiable1.set(false)
    this.modalViewerVisiable2.set(false)
  }

}