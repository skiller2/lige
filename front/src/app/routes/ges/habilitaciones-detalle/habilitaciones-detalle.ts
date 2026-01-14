import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, viewChild, computed, Injector, effect, input, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { columnTotal, totalRecords } from "src/app/shared/custom-search/custom-search"
import { SettingsService } from '@delon/theme';
import { HabilitacionesFormDrawerComponent } from 'src/app/routes/ges/habilitaciones-detalle-form-drawer/habilitaciones-detalle-form-drawer';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ImageLoaderComponent } from '../../../shared/image-loader/image-loader.component';

@Component({
  selector: 'app-habilitaciones-detalle',
  imports: [SHARED_IMPORTS, CommonModule, HabilitacionesFormDrawerComponent, NgxExtendedPdfViewerModule, ImageLoaderComponent  ],
  providers: [AngularUtilService],
  templateUrl: './habilitaciones-detalle.html',
  styleUrl: './habilitaciones-detalle.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesDetalleComponent {

  angularGridDetalle!: AngularGridInstance;
  gridDetalleOptions!: GridOption;
  gridDetalleDataInsert: any[] = [];
  angularGridDoc!: AngularGridInstance;
  gridDocOptions!: GridOption;
  gridDocDataInsert: any[] = [];
  detailViewRowCount = 1;
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  habilitacionesChange$ = new BehaviorSubject('')
  
  detalle = input<string>('')
  selectedIndex = signal(0)
  // isLoading = signal<boolean>(false)
  codigo = signal<number>(0)
  personalId = input<number>(0)
  personalHabilitacionId = model<number>(0)
  lugarHabilitacionId = input<number>(0)
  visibleForm = signal<boolean>(false)
  visibleFormEdit = signal<boolean>(false)
  loadingDelete = signal<boolean>(false)

  modalViewerVisiable1 = signal<boolean>(false)
  modalViewerVisiable2 = signal<boolean>(false)
  public src = signal<Blob>(new Blob())
  public srcImg = signal<string>('')
  fileName = signal<string>('')
  private readonly tokenService = inject(DA_SERVICE_TOKEN);

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private settingsService = inject(SettingsService)
  private apiService = inject(ApiService)
  // private injector = inject(Injector)

  columnsDetalle$ = this.apiService.getCols('/api/habilitaciones/detalle-cols')
  columnsDoc$ = this.apiService.getCols('/api/habilitaciones/doc-cols')

  ngOnInit() {

    this.gridDetalleOptions = this.apiService.getDefaultGridOptions('.gridDetalleContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridDetalleOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridDetalleOptions.showFooterRow = true
    this.gridDetalleOptions.createFooterRow = true

    this.gridDocOptions = this.apiService.getDefaultGridOptions('.gridDocContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridDocOptions.enableRowDetailView = this.apiService.isMobile()
    this.gridDocOptions.showFooterRow = true
    this.gridDocOptions.createFooterRow = true

    this.settingsService.setLayout('collapsed', true)
  }

  gridDetalleData$ = this.habilitacionesChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getDetalleGestionesByHabilitacion(this.personalId(), this.personalHabilitacionId(), this.lugarHabilitacionId())
        .pipe(map(data => { 
          return data.list 
        }))
    })
  )

  gridDocData$ = this.habilitacionesChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      return this.searchService.getDocsByHabilitacion(this.personalId(), this.personalHabilitacionId(), this.lugarHabilitacionId())
        .pipe(map(data => { 
          return data.list 
        }))
    })
  )

  async angularGridDetalleReady(angularGrid: any) {
    this.angularGridDetalle = angularGrid.detail
    this.angularGridDetalle.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridDetalle)
    })
    if (this.apiService.isMobile())
      this.angularGridDetalle.gridService.hideColumnByIds([])
  }

  async angularGridDocReady(angularGrid: any) {
    this.angularGridDoc = angularGrid.detail
    this.angularGridDoc.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGridDoc)
    })
    if (this.apiService.isMobile())
      this.angularGridDoc.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGridDetalle.slickGrid.getDataItem(selrow)
    // console.log('row: ', row);
    
    if (row?.id) {
      this.codigo.set(row.GestionHabilitacionCodigo)
    }else{
      this.codigo.set(0)
    }

  }

  refreshGrid(_e: any){
    this.habilitacionesChange$.next('');
  }

  cambios = computed(async () => {
    this.personalId()
    this.personalHabilitacionId()
    this.lugarHabilitacionId()
    this.refreshGrid('')
  });

  openDrawerforForm(): void{
    this.visibleForm.set(true) 
  }

  openDrawerforFormEdit(): void{
    this.visibleFormEdit.set(true) 
  }

  async LoadArchivo(url: string, filename: string) {
      this.modalViewerVisiable1.set(false)
      this.src.set(await fetch(`${url}`,{headers:{token:this.tokenService.get()?.token ?? ''}}).then(res => res.blob()))
      this.fileName.set(filename)
      this.modalViewerVisiable1.set(true)
    }

  async LoadImage(url: string, filename: string) {
    this.modalViewerVisiable2.set(false)
    this.srcImg.set(url)
    this.fileName.set(filename)
    this.modalViewerVisiable2.set(true)
  }

  handleCancel(): void {
    this.modalViewerVisiable1.set(false)
    this.modalViewerVisiable2.set(false)
  }

  formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  async deleteDocumento(docId:number) {
    if (!docId) return
    this.loadingDelete.set(true);
    try {
      const id = docId;
      if (id != null) {
        await firstValueFrom(this.apiService.deleteDocumento(id, 'Documento'));
        // Emito cambio para refrescar la lista, el grid, etc.
        this.refreshGrid('')
      }
    } catch (error) {
      // Aquí puedes mostrar un mensaje de error con tu toast/snackbar
      console.error('Error borrando documento', error);
    } finally {
      this.loadingDelete.set(false);
    }
  }

}