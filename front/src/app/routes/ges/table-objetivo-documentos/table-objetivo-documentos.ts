import { Component, Output, EventEmitter, computed, input, signal, effect, model,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject } from 'rxjs';
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
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { DA_SERVICE_TOKEN } from '@delon/auth';

interface ListOptions {
  filtros: any[];
  sort: any;
}

@Component({
  selector: 'app-table-objetivo-documentos',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzAffixModule,
    FiltroBuilderComponent,
    NgxExtendedPdfViewerModule,
    ImageLoaderComponent,
    NzSpaceModule
  ],
  providers: [AngularUtilService],
  templateUrl: './table-objetivo-documentos.html',
  styleUrls: ['./table-objetivo-documentos.less'],
  standalone: true
})
export class TableObjetivoDocumentoComponent {
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
  listDocsObjetivo$ = new BehaviorSubject('');
  startFilters = signal<any[]>([])
  ClienteId = input<number>(0);
  ObjetivoId = input<number>(0);
  // RefreshCliente = model<boolean>(false);

  file = signal<any>(null)
  modalViewerVisiable1 = signal<boolean>(false)
  modalViewerVisiable2 = signal<boolean>(false)
  public src = signal<Blob>(new Blob())
  url = signal<string>('')
  fileName = signal<string>('')
  canPreviewFile = computed(() => {
    if (this.file()?.TipoArchivo && (this.file().TipoArchivo == 'pdf' || this.file().TipoArchivo == 'png' || this.file().TipoArchivo == 'jpg' || this.file().TipoArchivo == 'jpeg'))
      return true;
      
    return false
  });

  private destroy$ = new Subject();
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  
  constructor(
    private apiService: ApiService,
    private angularUtilService: AngularUtilService,
    public searchService: SearchService
  ) {
    effect(() => {
      const ClienteId = this.ClienteId()
      const ObjetivoId = this.ObjetivoId()
      if (ClienteId && ObjetivoId) {
        this.listDocsObjetivo$.next('');
      }
    });
  }
  
  columns$ = this.apiService.getCols('/api/objetivos/docs-cols');
  gridData$ = this.listDocsObjetivo$.pipe(
      debounceTime(500),
      switchMap(() => {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return this.searchService.getDocsByObjetivo(this.ObjetivoId(), this.ClienteId(), this.listOptions)
          .pipe(map(data => {
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
      this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
      
      this.gridOptions.enableRowDetailView = this.apiService.isMobile()
      this.gridOptions.showFooterRow = true
      this.gridOptions.createFooterRow = true
      this.gridOptions.forceFitColumns = true
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
      
      // console.log('row: ', row);
      
      if (row?.id){
        this.file.set(row)
        this.fileName.set(row.NombreArchivo)
        this.url.set(row.url)
      }
  
    }
  
    listOptionsChange(options: any) {
      this.listOptions = options
      this.listDocsObjetivo$.next('')
    }

    refreshGrid() {
      this.listDocsObjetivo$.next('')
    }
  
    async previewFile(){
      this.fileName.set(this.file().NombreArchivo)
      if (this.file().TipoArchivo == 'pdf') {
        this.src.set(await fetch(`${this.url()}`,{headers:{token:this.tokenService.get()?.token ?? ''}}).then(res => res.blob()))
        this.modalViewerVisiable1.set(true)
      }else if(this.file().TipoArchivo == 'png' || this.file().TipoArchivo == 'jpg' || this.file().TipoArchivo == 'jpeg'){
        this.modalViewerVisiable2.set(true)
      }
    }
  
    handleCancel(): void {
      this.modalViewerVisiable1.set(false)
      this.modalViewerVisiable2.set(false)
    }

    ngOnDestroy(): void {
      this.destroy$.next('');
      this.destroy$.complete();
    }

}