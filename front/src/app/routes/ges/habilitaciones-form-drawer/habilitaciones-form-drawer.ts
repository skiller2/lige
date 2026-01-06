import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ViewEncapsulation, model, input, computed, inject, signal, output, effect, viewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
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
  // disabled = input<boolean>(false)
  RefreshDetalle = model<boolean>(false)
  visible = model<boolean>(false)
  onAddorUpdate = output()
  
  personalId = input<number>(0)
  lugarHabilitacionId = input<number>(0)
  personalHabilitacionId = input<number>(0)
  prevFiles = signal<any[]>([]);
  randNum = signal<number>(0);
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');

  // formEdit = signal<number>(0)
  isLoading = signal(false);
  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo()?this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo()?this.periodo().getMonth()+1 : 0)
  formEdit = computed(() => (this.personalHabilitacionId() && this.personalId() && this.lugarHabilitacionId())? true : false)
  
  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  fb = inject(FormBuilder)
  formHabilitacion = this.fb.group({
    PersonalHabilitacionId:0,
    PersonalId:0,
    LugarHabilitacionId:0,
    HabilitacionCategoriaCodigo:[],
    // GestionHabilitacionCodigo:0,
    GestionHabilitacionEstadoCodigo:0,
    Detalle:'',
    NroTramite:'',
    PersonalHabilitacionDesde:'',
    PersonalHabilitacionHasta:'',
    PersonalHabilitacionClase:'',
    // DocumentoId: 0,
    file: []
  })

  LugarHabilitacionId():number {
    const value = this.formHabilitacion.get("LugarHabilitacionId")?.value 
    if (value)
      return value
    return 0
  }

  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()
  $optionsTipos = this.searchService.getDocumentoTipoOptions();
  $optionsLugarHabilitacion = this.searchService.getLugarHabilitacionOptions()

  optionsHabilitacionCategoria = signal<any[]>([])

  fileUploadComponent = viewChild.required(FileUploadComponent);

  private apiService = inject(ApiService)
  constructor(
    // private notification = NzNotificationService,
    private searchService: SearchService
  ) {
    effect(async() => {
      const visible = this.visible()
      if (visible) {

        if (this.formEdit()) {
          const res = await firstValueFrom(this.searchService.getPersonalHabilitacionById(this.personalHabilitacionId(), this.personalId()))

          this.formHabilitacion.reset(res)
        }else{
          this.formHabilitacion.reset()
        }
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
      if (this.formEdit()){
        await firstValueFrom(this.apiService.updatePersonalHabiltacion(vals))
      }else{
        await firstValueFrom(this.apiService.addPersonalHabiltacion(vals))
      }
      
      this.formHabilitacion.markAsUntouched()
      this.formHabilitacion.markAsPristine()
      this.onAddorUpdate.emit()
    } catch (error) {
    }
    this.isLoading.set(false)
  }

  handlePrevFiles(event: any[]) {
    console.log('handle',event)
    const copia = event.map(item => ({ ...item }))
    this.prevFiles.set([...copia])
    this.randNum.set(Math.random())
  }

  async selectedLugarHabilitacionChange(event: any){
    const Categorias = await firstValueFrom(this.searchService.getHabilitacionCategoriaOptions(this.LugarHabilitacionId()))
    this.optionsHabilitacionCategoria.set(Categorias)
  }

}