import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ViewEncapsulation, model, input, computed, inject, signal, output, effect, viewChild } from '@angular/core';
import { FormBuilder, FormArray,  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, map } from 'rxjs';
import { FileUploadComponent } from "src/app/shared/file-upload/file-upload.component";
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-habilitaciones-detalle-form-drawer',
    imports: [SHARED_IMPORTS, CommonModule, FileUploadComponent, PersonalSearchComponent],
    templateUrl: './habilitaciones-detalle-form-drawer.html',
    styleUrl: './habilitaciones-detalle-form-drawer.less',
    encapsulation: ViewEncapsulation.None
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabilitacionesFormDrawerComponent {
  tituloDrawer = signal<string>("Nueva Habilitación Detalle")
  placement: NzDrawerPlacement = 'left';
  // disabled = input<boolean>(false)
  RefreshDetalle = model<boolean>(false)
  visible = model<boolean>(false)
  onAddorUpdate = output()
  
  codigo = model<number>(0)
  personalId = input<number>(0)
  lugarHabilitacionId = input<number>(0)
  personalHabilitacionId = model<number>(0)
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)

  isLoading = signal(false);
  
  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  objDoc = {file:[]}

  fb = inject(FormBuilder)
  formHabilitacion = this.fb.group({
    PersonalHabilitacionId:0,
    PersonalId:0,
    LugarHabilitacionId:0,
    HabilitacionCategoriaCodigos:[],
    GestionHabilitacionCodigo:0,
    GestionHabilitacionEstadoCodigo:'',
    Detalle:'',
    NroTramite:'',
    PersonalHabilitacionDesde:'',
    PersonalHabilitacionHasta:'',
    PersonalHabilitacionClase:'',
    AudFechaIng:'',
    // DocumentoId: 0,
    documentos: this.fb.array([this.fb.group({...this.objDoc})]),
  })

  GestionHabilitacionEstadoCodigo():string {
    const value = this.formHabilitacion.get("GestionHabilitacionEstadoCodigo")?.value 
    if (value)
      return value
    return ''
  }

  GestionHabilitacionCodigo():number {
    const value = this.formHabilitacion.get("GestionHabilitacionCodigo")?.value 
    if (value)
      return value
    return 0
  }

  documentos():FormArray {
    return this.formHabilitacion.get("documentos") as FormArray
  }

  signalDocumento = toSignal(
    this.documentos().valueChanges,
    { initialValue: this.documentos().value }
  )

  $optionsHabilitacionClase = this.searchService.getHabilitacionClaseOptions()
  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()
  $optionsLugarHabilitacion = this.searchService.getLugarHabilitacionOptions()
  $sitrevista = this.formHabilitacion.get('PersonalId')!.valueChanges.pipe(
      debounceTime(500),
      switchMap(() =>
          this.apiService.getPersonaSitRevista(Number(this.formHabilitacion.get('PersonalId')?.value), this.anio(), this.mes())
      )
  )
  optionsHabilitacionCategoria = signal<any[]>([])
  // $optionsHabilitacionCategoria = this.formHabilitacion.get('LugarHabilitacionId')!.valueChanges.pipe(
  //     debounceTime(500),
  //     switchMap(() =>
  //         this.searchService.getHabilitacionCategoriaOptions(Number(this.formHabilitacion.get('LugarHabilitacionId')?.value))
  //     )
  // )

  fileUploadComponent = viewChild.required(FileUploadComponent);

  private apiService = inject(ApiService)
  constructor(
    // private notification = NzNotificationService,
    private searchService: SearchService
  ) {
    effect(async() => {
      this.formHabilitacion.get('AudFechaIng')?.disable()
      const visible = this.visible()
      const codigo = this.codigo()
      if (codigo) this.tituloDrawer.set('Editar Habilitación Detalle')
      else  this.tituloDrawer.set('Nueva Habilitación Detalle')

      if (visible) {
        
        this.formHabilitacion.get('PersonalId')?.disable();
        // this.formHabilitacion.get('LugarHabilitacionId')?.disable();

        let lastConfig = {}
        if (this.personalHabilitacionId()) {
          lastConfig = await firstValueFrom(this.searchService.getPersonalHabilitacionById(this.personalHabilitacionId(), this.personalId()))
        } else {
          lastConfig = {
            PersonalHabilitacionId: this.personalHabilitacionId(),
            LugarHabilitacionId: this.lugarHabilitacionId(),
            PersonalId: this.personalId()
          }
        }

        if (this.codigo()) {
          let gestionHabi = await firstValueFrom(this.searchService.getGestionHabilitacionById(this.codigo(), this.personalId(), this.lugarHabilitacionId(), this.personalHabilitacionId()))
          
          gestionHabi.AudFechaIng = this.formatDate(gestionHabi.AudFechaIng);
          lastConfig = {...lastConfig, ...gestionHabi}
        }

        
        this.formHabilitacion.reset(lastConfig)

        const categorias = await firstValueFrom(this.searchService.getHabilitacionCategoriaOptions(this.lugarHabilitacionId()))
        this.optionsHabilitacionCategoria.set(categorias)

        this.formHabilitacion.markAsUntouched()
        this.formHabilitacion.markAsPristine()
      } else {
        this.formHabilitacion.reset()
        this.formHabilitacion.enable()
      }
    })

    effect(async() => {
      const documentos = this.signalDocumento()
      const docs = this.documentos().value
      
      for (let index = 0; index < (docs.length-1); index++)
        if(!docs[index].file?.length) this.removeDoc(index)
      
      if (documentos[documentos.length-1].file?.length) this.addDoc()
      
    })
  }

  async ngOnInit() {}

  async selectedLugarHabilitacionChange(event: any){
    const categorias = await firstValueFrom(this.searchService.getHabilitacionCategoriaOptions(event))
    this.optionsHabilitacionCategoria.set(categorias)
  }

  async save() {
    this.isLoading.set(true)
    let vals:any = this.formHabilitacion.getRawValue()
    try {

      if (this.GestionHabilitacionCodigo()) {
        await firstValueFrom(this.apiService.updateGestionHabilitacion(vals))
      } else {
        let res:any = await firstValueFrom(this.apiService.addGestionHabilitacion(vals))
        
        let data = res.data
        data.AudFechaIng = this.formatDate(data.AudFechaIng);

        if(data.PersonalHabilitacionId) this.personalHabilitacionId.set(data.PersonalHabilitacionId)
        this.tituloDrawer.set('Editar Habilitación Detalle')
        this.formHabilitacion.patchValue(data)
      } 

      this.formHabilitacion.markAsUntouched()
      this.formHabilitacion.markAsPristine()
      this.onAddorUpdate.emit()
    } catch (error) {
    }
    this.isLoading.set(false)
  }

  formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  addDoc(e?: MouseEvent): void {
    e?.preventDefault();
    this.documentos().push(this.fb.group({...this.objDoc}))
  }

  removeDoc(index: number, e?: MouseEvent): void {
    e?.preventDefault();
    if (this.documentos().controls.length > 1 ) {
      this.documentos().removeAt(index)
      this.formHabilitacion.markAsDirty()
    }
  }

}