import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, output, effect } from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
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

@Component({
  selector: 'app-documento-drawer',
  templateUrl: './documento-drawer.component.html',
  styleUrl: './documento-drawer.component.less',
  imports: [SHARED_IMPORTS, ReactiveFormsModule, PersonalSearchComponent,
    CommonModule, FileUploadComponent, ClienteSearchComponent, ObjetivoSearchComponent,
    NgxExtendedPdfViewerModule, NzImageModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DocumentoDrawerComponent {
  tituloDrawer = signal<string>('Carga de Documento')
  visible = model<boolean>(false)

  onAddorUpdate = output()
  isLoading = signal(false);
  periodo = signal<any>({ anio: 0, mes: 0 })
  placement: NzDrawerPlacement = 'left';
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');

  drawerWidth = computed(() => {
    if (this.prevFiles() && this.prevFiles().length)
      return '1000px'
    else
      return '600px'
  })

  docId = model<number>(0);
  disabled = model<boolean>(false);
  prevFiles = signal<any[]>([]);

  constructor(
    private searchService: SearchService,
    private apiService: ApiService,
  ) {
    effect(async() => { 
      const visible = this.visible()
      if (visible) {
        if (this.docId()) {
          let infoDoc = await firstValueFrom(this.searchService.getDocumentoById(this.docId()))
          
          this.formTipoDocumento.reset(infoDoc)
          this.formTipoDocumento.markAsUntouched()
          this.formTipoDocumento.markAsPristine()
        }
        if (this.disabled())
          this.formTipoDocumento.disable()
        else
          this.formTipoDocumento.enable()
      }
      else {
        this.formTipoDocumento.reset()
        this.formTipoDocumento.enable()
      }
    })
  }

  fb = inject(FormBuilder)
  formTipoDocumento = this.fb.group({ doc_id: 0, doctipo_id: '', den_documento: null, persona_id: 0,
    cliente_id: 0, objetivo_id: 0, fecha: null, fec_doc_ven: null, ind_descarga_bot: false, archivo: [] })

  $optionsTipos = this.searchService.getDocumentoTipoOptions();


  doc_id(): number {
    const value = this.formTipoDocumento.get("doc_id")?.value
    if (value)
      return value
    return 0
  }

  doctipo_id(): string {
    const value = this.formTipoDocumento.get("doctipo_id")?.value
    if (value)
      return value
    return ''
  }

  archivo():[]  { 
    const value:any = this.formTipoDocumento.get("archivo")?.value
    if (value && value.length)
      return value
    return []
  }
 
  async ngOnInit() {
    let now = new Date()
    this.periodo.set({ anio: now.getFullYear(), mes: now.getMonth() + 1 })

    const res = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
    this.optionsLabels.set(res)

  }

  async save() {
    this.isLoading.set(true)
    const values = this.formTipoDocumento.value
    try {
      if (values.doc_id)
        await firstValueFrom(this.apiService.updateDocumento(values))
      else {
        const res = await firstValueFrom(this.apiService.addDocumento(values))
        if (res.data.doc_id)
          this.formTipoDocumento.patchValue({ doc_id: res.data.doc_id })
      }

      this.onAddorUpdate.emit()
      this.formTipoDocumento.markAsUntouched()
      this.formTipoDocumento.markAsPristine()
    } catch (e) {

    }
    this.isLoading.set(false)
  }

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
    this.formTipoDocumento.reset()
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
