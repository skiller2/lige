import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef} from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { FileUploadComponent } from "../../shared/file-upload/file-upload.component";
import { ClienteSearchComponent } from "../cliente-search/cliente-search.component";
import { ObjetivoSearchComponent } from "../objetivo-search/objetivo-search.component";
import { NzImageModule } from 'ng-zorro-antd/image';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
    selector: 'app-tipo-documento-alta-drawer',
    templateUrl: './tipo-documento-alta-drawer.component.html',
    styleUrl: './tipo-documento-alta-drawer.component.less',
    imports: [SHARED_IMPORTS, ReactiveFormsModule, PersonalSearchComponent,
        CommonModule, FileUploadComponent, ClienteSearchComponent, ObjetivoSearchComponent,
        NgxExtendedPdfViewerModule, NzImageModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TipoDocumentoAltaDrawerComponent {
  tituloDrawer = signal<string>('Carga de Documento')
  visible = model<boolean>(false)
  refresh = model<number>(0)
  isLoading = signal(false);
  periodo = signal<any>({anio:0, mes:0})
  placement: NzDrawerPlacement = 'left';
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');
  drawerWidth = signal("600px");
  docId = model<number>(0);
  disabled = model<boolean>(false);
  archivoOriginalname = signal<string>('');
  archivoMimetype = signal<string>('');

  constructor(
    private searchService: SearchService,
    private apiService: ApiService,
  ) { }

  inputs = { doc_id:0, doctipo_id:'', den_documento:null, persona_id:0, cliente_id:0,
    objetivo_id:0, fecha:null, fec_doc_ven:null, archivo:[], }
  fb = inject(FormBuilder)
  formTipoDocumento = this.fb.group({ ...this.inputs })

  $optionsTipos = this.searchService.getTiposDocumentoOptions();

  doc_id():number {
    const value = this.formTipoDocumento.get("doc_id")?.value
    if (value) 
      return value
    return 0
  }

  doctipo_id():string {
    const value = this.formTipoDocumento.get("doctipo_id")?.value
    if (value) 
      return value
    return ''
  }

  archivo_mimetype():string {
    if (this.docId()) {
      if (this.archivoMimetype() == 'jpeg' || this.archivoMimetype() == 'jpg' || this.archivoMimetype() == 'png') return 'image'
      else if (this.archivoMimetype() == 'pdf') return 'pdf'
    }
    const value:any = this.formTipoDocumento.get("archivo")?.value
    if (value && value.length && value[0].mimetype){
      if (value[0].mimetype.includes('image')) return 'image'
      else if (value[0].mimetype.includes('pdf')) return 'pdf'
    }
    return ''
  }

  archivo_fileUrl():string {
    if (this.docId()) {
      if (this.archivoMimetype() == 'jpeg' || this.archivoMimetype() == 'jpg' || this.archivoMimetype() == 'png')
        return `api/file-upload/downloadFile/${this.docId()}/docgeneral/original`
      else if (this.archivoMimetype() == 'pdf')
        return `api/file-upload/downloadFile/${this.docId()}/docgeneral/original`
      else
        return ''
    }
    const value:any = this.formTipoDocumento.get("archivo")?.value
    if (value && value.length && value[0].fileUrl) return value[0].fileUrl
    return ''
  }

  archivo_originalname():string {
    if (this.docId()) {
      return this.archivoOriginalname()
    }
    const value:any = this.formTipoDocumento.get("archivo")?.value
    if (value && value.length && value[0].originalname) return value[0].originalname
    return ''
  }

  async ngOnInit() {
    let now = new Date()
    this.periodo.set({anio:now.getFullYear(), mes:now.getMonth()+1})

    const res = await firstValueFrom(this.searchService.getTiposDocumentoOptions())
    this.optionsLabels.set(res)

    this.formTipoDocumento.get('archivo')?.valueChanges.subscribe((value:any) => {
      if (value.length) this.drawerWidth.set('1000px')
      else this.drawerWidth.set('600px')
    });
  }

  async save() {
    this.isLoading.set(true)
    const values = this.formTipoDocumento.value
    // console.log(values);
    try {
      if (this.doc_id()) {
        await firstValueFrom(this.apiService.updateTipoDocumento(values))
      }else{
        const res = await firstValueFrom(this.apiService.addTipoDocumento(values))
        if (res.data.doc_id)
          this.formTipoDocumento.controls.doc_id.setValue(res.data.doc_id)
      }
      let ref = this.refresh()
      this.refresh.set(++ref)
      this.formTipoDocumento.markAsUntouched()
      this.formTipoDocumento.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
  }

  async load() {
    if (this.docId()) {
      let infoDoc = await firstValueFrom(this.searchService.getTipoDocumentoById(this.docId()))
      infoDoc = infoDoc[0]
      
      infoDoc.nombre_archivo? this.archivoOriginalname.set(infoDoc.nombre_archivo) : this.archivoOriginalname.set('')
      infoDoc.extension? this.archivoMimetype.set(infoDoc.extension) : this.archivoMimetype.set('')
      
      let values:any = {...this.inputs}
      for (const key in values) {
        values[key] = infoDoc[key]
      }
      this.formTipoDocumento.reset(values)
      console.log(this.formTipoDocumento.value);
      
    }
    if (this.disabled()) this.formTipoDocumento.disable()
    else this.formTipoDocumento.enable()
  }

  resetForm(){
    this.formTipoDocumento.reset()
  }

  selectLabel(val: any){
    const tipoDoc = val
    const find = this.optionsLabels().find((obj:any)=> { return tipoDoc == obj.value})
    if (find && find.des_den_documento) {
      this.label.set(`${find.des_den_documento}`)
    } else if (find) {
      this.label.set(`Denominacion de ${find.label}`)
    } else
      this.label.set('. . .')
  }

}
