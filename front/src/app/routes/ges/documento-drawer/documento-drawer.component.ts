import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, output, effect } from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, noop } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component";
import { ClienteSearchComponent } from "../../../shared/cliente-search/cliente-search.component";
import { ObjetivoSearchComponent } from "../../../shared/objetivo-search/objetivo-search.component";
import { NzImageModule } from 'ng-zorro-antd/image';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ImageLoaderComponent } from '../../../shared/image-loader/image-loader.component';
import { applyEach, disabled, FieldTree, form, FormField, readonly, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

export interface FormDoc { 
  DocumentoId: number,
  DocumentoTipoCodigo: '',  
  DocumentoDenominadorDocumento: string, 
  PersonalId: number,
  DocumentoClienteId: number, 
  ObjetivoId: number, 
  Documentofecha: Date | null, 
  DocumentoFechaDocumentoVencimiento: Date | null,
  DocumentoIndividuoDescargaBot: boolean,
  archivo: any[]
}

@Component({
  selector: 'app-documento-drawer',
  templateUrl: './documento-drawer.component.html',
  styleUrl: './documento-drawer.component.less',
  imports: [SHARED_IMPORTS, ReactiveFormsModule, PersonalSearchComponent,
    CommonModule, FileUploadComponent, ClienteSearchComponent, ObjetivoSearchComponent,
    NgxExtendedPdfViewerModule, NzImageModule, ImageLoaderComponent, FormField, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DocumentoDrawerComponent {
  tituloDrawer = signal<string>('Carga de Documento')
  visible = model<boolean>(false)
  randNum = signal<number>(0);

  onAddorUpdate = output()
  isLoading = signal(false);
  token = signal<string>('');
  periodo = signal<any>({ anio: 0, mes: 0 })
  placement: NzDrawerPlacement = 'left';
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');
  fileUploadComponent = viewChild.required(FileUploadComponent);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private searchService=inject(SearchService)
  private apiService=inject(ApiService)
  

  drawerWidth = computed(() => {
    const archivo = this.tipoDocumento().archivo
    if (archivo.length > 0 && (archivo[0]?.mimetype?.includes('image') || archivo[0]?.mimetype?.includes('pdf'))) {
      return '1000px'
    } else {
      return '600px'
    }
  })

  docId = model<number>(0);
  disabled = model<boolean>(false);
  prevFiles = signal<any[]>([]);
  Date: any;

  private tipoDocumentoDefault: FormDoc = {
      DocumentoId: 0,
      DocumentoTipoCodigo: '',  
      DocumentoDenominadorDocumento: '', 
      PersonalId: 0,
      DocumentoClienteId: 0, 
      ObjetivoId: 0, 
      Documentofecha: null, 
      DocumentoFechaDocumentoVencimiento: null,
      DocumentoIndividuoDescargaBot: false,
      archivo: []
  }

  readonly tipoDocumento = signal<FormDoc>(this.tipoDocumentoDefault);

  readonly formTipoDocumento = form(this.tipoDocumento, (p) => {
    disabled(p, () => this.disabled())
  })

  loadEffect = effect(async () => {
    if (!this.visible()) return
    
    if (this.docId()) {
      let infoDoc = await firstValueFrom(this.searchService.getDocumentoById(this.docId()))
      this.tipoDocumento.update(m => ({
        ...m, 
        ...infoDoc,
      }));
      setTimeout(() => { this.formTipoDocumento().reset() }, 400);
    }
  })

  optionsTipos = toSignal(this.searchService.getDocumentoTipoOptions(), { initialValue: [] });
  labelsEffect = effect(async () => {
    const DocumentoTipoCodigo:string = this.tipoDocumento().DocumentoTipoCodigo
    this.selectLabel(DocumentoTipoCodigo);
  })
 
  async ngOnInit() {
    this.token.set(this.tokenService.get()?.token ?? '');
    let now = new Date()
    this.periodo.set({ anio: now.getFullYear(), mes: now.getMonth() + 1 })

    const res = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
    this.optionsLabels.set(res)

  }

  async save() {
    await submit(this.formTipoDocumento, async (form) => {
      this.isLoading.set(true)
      const values:any = form().value()
      let docId = 0
      try {
        if (values.DocumentoId){
          docId = values.DocumentoId
          await firstValueFrom(this.apiService.updateDocumento(values))
        } else {
          const res = await firstValueFrom(this.apiService.addDocumento(values))
          if (res.data.DocumentoId){
            docId = res.data.DocumentoId
            this.tipoDocumento.update(m => ({
              ...m, 
              DocumentoId: res.data.DocumentoId
            }));
          }
        }

        if (docId > 0){
          this.fileUploadComponent().LoadArchivosAnteriores(docId)
        }
        this.onAddorUpdate.emit()
        setTimeout(() => { this.formTipoDocumento().reset() }, 400);
      } catch (e) {

      }
      this.isLoading.set(false)
    })
  }

  // handlePrevFiles(event: any[]) {
  //   console.log('handle',event)
  //   const copia = event.map(item => ({ ...item }))
  //   this.prevFiles.set([...copia])
  //   this.randNum.set(Math.random())
  // }

  // async load() {
  //   if (this.docId()) {
  //     let infoDoc = await firstValueFrom(this.searchService.getDocumentoById(this.docId()))
  //     
  //     this.formTipoDocumento.reset(infoDoc)
  //     this.formTipoDocumento.markAsUntouched()
  //     this.formTipoDocumento.markAsPristine()
  //   }
  //   if (this.disabled())
  //     this.formTipoDocumento.disable()
  //   else
  //     this.formTipoDocumento.enable()
  // }

  resetForm() {
    setTimeout(() => { this.formTipoDocumento().reset() }, 400);
  }

  selectLabel(val: any) {
    const tipoDoc = val
    const find = this.optionsLabels().find((obj: any) => { return tipoDoc == obj.value })
    if (find && find.des_den_documento) {
      this.label.set(`${find.des_den_documento}`)
    } else if (find) {
      this.label.set(`Denominacion de ${find.label}`)
    } else
      this.label.set('. . .')
  }

}
