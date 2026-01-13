import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ViewEncapsulation, model, input, computed, inject, signal, output, effect, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, merge } from 'rxjs';
import { FileUploadComponent } from "src/app/shared/file-upload/file-upload.component";
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

@Component({
    selector: 'app-habilitaciones-form-drawer',
    imports: [SHARED_IMPORTS, CommonModule, FileUploadComponent, PersonalSearchComponent],
    templateUrl: './habilitaciones-form-drawer.html',
    styleUrl: './habilitaciones-form-drawer.less',
    encapsulation: ViewEncapsulation.None
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabilitacionesFormDrawerComponent {
  tituloDrawer = input<string>("Nueva Habilitación Detalle")
  placement: NzDrawerPlacement = 'left';
  RefreshDetalle = model<boolean>(false)
  visible = model<boolean>(false)
  onAddorUpdate = output()
  
  prevFiles = signal<any[]>([]);
  randNum = signal<number>(0);
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');

  isLoading = signal(false);
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  // formEdit = computed(() => (this.personalHabilitacionId() && this.personalId() && this.lugarHabilitacionId())? true : false)
  
  uploading$ = new BehaviorSubject({loading:false,event:null});
  lugarHabilitacion$ = new BehaviorSubject('')

  objDoc = {files:[]}

  fb = inject(FormBuilder)
  formHabilitacion = this.fb.group({
    PersonalHabilitacionId:0,
    PersonalId:0,
    LugarHabilitacionId:0,
    HabilitacionCategoriaCodigo:[],
    // GestionHabilitacionCodigo:0,
    GestionHabilitacionEstadoCodigo:'',
    Detalle:'',
    NroTramite:'',
    PersonalHabilitacionDesde:'',
    PersonalHabilitacionHasta:'',
    PersonalHabilitacionClase:'',
    // DocumentoId: 0,
    documentos: this.fb.array([this.fb.group({...this.objDoc})]),
  })

  GestionHabilitacionEstadoCodigo():string {
    const value = this.formHabilitacion.get("GestionHabilitacionEstadoCodigo")?.value 
    if (value)
      return value
    return ''
  }

  LugarHabilitacionId():number {
    const value = this.formHabilitacion.get("LugarHabilitacionId")?.value 
    if (value)
      return value
    return 0
  }

  documentos():FormArray {
    return this.formHabilitacion.get("documentos") as FormArray
  }

  signalPersonalId = toSignal(
    this.formHabilitacion.get("PersonalId")!.valueChanges,
    { initialValue: this.formHabilitacion.get('PersonalId')!.value }
  )

  signalDocumento = toSignal(
    this.documentos().valueChanges,
    { initialValue: this.documentos().value }
  )

  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()
  $optionsTipos = this.searchService.getDocumentoTipoOptions();
  $sitrevista = this.formHabilitacion.get('PersonalId')!.valueChanges.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
      .getPersonaSitRevista(
        Number(this.formHabilitacion.get('PersonalId')?.value),
        this.anio(),
        this.mes()
      )
    )
    )

  optionsHabilitacionCategoria = signal<any[]>([])
  optionsLugarHabilitacion = signal<any[]>([])

  fileUploadComponent = viewChild.required(FileUploadComponent);

  private apiService = inject(ApiService)
  constructor(
    // private notification = NzNotificationService,
    private searchService: SearchService
  ) {
    effect(async() => {
      const PersonalId = this.signalPersonalId()
      
      if (PersonalId) {
        const res = await firstValueFrom(this.searchService.getLugarHabilitacionByPersonlaId(PersonalId))
        this.optionsLugarHabilitacion.set(res)
      }else
        this.optionsLugarHabilitacion.set([])
      
    })
    effect(async() => {
      const visible = this.visible()
      if (visible) {
        // const res = await firstValueFrom(this.searchService.getPersonalHabilitacionById(this.personalHabilitacionId(), this.personalId()))

        this.formHabilitacion.reset()
        this.documentos().clear()
        if (this.documentos().length == 0)
          this.documentos().push(this.fb.group({...this.objDoc}))
        this.formHabilitacion.markAsUntouched()
        this.formHabilitacion.markAsPristine()
      }
      else {
        this.formHabilitacion.reset()
        this.formHabilitacion.enable()
      }
    })
    effect(async() => {
      const documentos = this.signalDocumento()
      if ( documentos[documentos.length-1]?.files?.length) {
        this.addDoc()
      }
    })
  }

  async ngOnInit() {
    try {
      // this.documentos().valueChanges.subscribe((values:any)=>{
      //   console.log('values: ', values);
      //   if (values[values.length-1]?.files?.length) {
      //     this.addDoc()
      //   }
      // })
      const res = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
      this.optionsLabels.set(res)
    } catch (error) {
      
    }
  }

  async save() {
    this.isLoading.set(true)
    let vals:any = this.formHabilitacion.value

    try {
      // console.log('vals: ', vals);
      await firstValueFrom(this.apiService.addPersonalHabiltacion(vals))
      
      this.formHabilitacion.markAsUntouched()
      this.formHabilitacion.markAsPristine()
      this.onAddorUpdate.emit()
    } catch (error) {
    }
    this.isLoading.set(false)
  }

  handlePrevFiles(event: any[]) {
    // console.log('handle',event)
    const copia = event.map(item => ({ ...item }))
    this.prevFiles.set([...copia])
    this.randNum.set(Math.random())
  }

  async selectedLugarHabilitacionChange(event: any){
    const Categorias = await firstValueFrom(this.searchService.getHabilitacionCategoriaOptions(this.LugarHabilitacionId()))
    this.optionsHabilitacionCategoria.set(Categorias)
  }

  addDoc(e?: MouseEvent): void {
    e?.preventDefault();
    this.documentos().push(this.fb.group({...this.objDoc}))
  }

  removeDoc(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.documentos().controls.length > 1 ) {
      this.documentos().removeAt(index)
      this.formHabilitacion.markAsDirty()
    }
  }

}