import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ViewEncapsulation, model, input, computed, inject, signal, output, effect, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, map } from 'rxjs';
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
    file: []
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

  signalPersonalId = toSignal(
    this.formHabilitacion.get("PersonalId")!.valueChanges,
    { initialValue: this.formHabilitacion.get('PersonalId')!.value }
  )

  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()
  $optionsTipos = this.searchService.getDocumentoTipoOptions();

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
        this.formHabilitacion.markAsUntouched()
        this.formHabilitacion.markAsPristine()
      }
      else {
        this.formHabilitacion.reset()
        this.formHabilitacion.enable()
      }
    })
  }

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
      this.optionsLabels.set(res)
    } catch (error) {
      
    }
  }

  async save() {
    this.isLoading.set(true)
    let vals:any = this.formHabilitacion.value

    try {
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

}