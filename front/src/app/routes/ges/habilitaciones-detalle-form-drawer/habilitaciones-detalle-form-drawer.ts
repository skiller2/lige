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

@Component({
    selector: 'app-habilitaciones-detalle-form-drawer',
    imports: [SHARED_IMPORTS, CommonModule, FileUploadComponent],
    templateUrl: './habilitaciones-detalle-form-drawer.html',
    styleUrl: './habilitaciones-detalle-form-drawer.less',
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
  
  codigo = input<number>(0)
  personalId = input<number>(0)
  lugarHabilitacionId = input<number>(0)
  personalHabilitacionId = input<number>(0)
  prevFiles = signal<any[]>([]);
  randNum = signal<number>(0);
  optionsLabels = signal<any[]>([]);
  label = signal<string>('. . .');

  isLoading = signal(false);
  
  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  fb = inject(FormBuilder)
  formHabilitacion = this.fb.group({
    GestionHabilitacionCodigo:0,
    GestionHabilitacionEstadoCodigo:0,
    Detalle:'',
    NroTramite:'',
    PersonalHabilitacionDesde:'',
    PersonalHabilitacionHasta:'',
    PersonalHabilitacionClase:'',
    AudFechaIng:'',
    // DocumentoId: 0,
    file: []
  })

  GestionHabilitacionCodigo():number {
    const value = this.formHabilitacion.get("GestionHabilitacionCodigo")?.value 
    if (value)
      return value
    return 0
  }

  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()
  $optionsTipos = this.searchService.getDocumentoTipoOptions();

  fileUploadComponent = viewChild.required(FileUploadComponent);

  private apiService = inject(ApiService)
  constructor(
    // private notification = NzNotificationService,
    private searchService: SearchService
  ) {
    effect(async() => {
      const visible = this.visible()
      if (visible) {
        let lastConfig = await firstValueFrom(this.searchService.getPersonalHabilitacionById(this.personalHabilitacionId(), this.personalId()))

        if (this.codigo()) {
          let gestionHabi = await firstValueFrom(this.searchService.getGestionHabilitacionById(this.codigo(), this.personalId(), this.lugarHabilitacionId(), this.personalHabilitacionId()))
          gestionHabi.AudFechaIng = this.formatDate(gestionHabi.AudFechaIng);
          lastConfig = {...lastConfig, ...gestionHabi}
        }

        this.formHabilitacion.reset(lastConfig)
        this.formHabilitacion.markAsUntouched()
        this.formHabilitacion.markAsPristine()
        // if (this.disabled())
        //   this.formHabilitacion.disable()
        // else
        //   this.formHabilitacion.enable()
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
    vals.personalId = this.personalId()
    vals.lugarHabilitacionId = this.lugarHabilitacionId()
    vals.personalHabilitacionId = this.personalHabilitacionId()
    try {

      if (this.codigo()) {
        vals.codigo = this.codigo()
        await firstValueFrom(this.apiService.updateGestionHabiltacion(vals))
      } else {
        let result:any = await firstValueFrom(this.apiService.addGestionHabiltacion(vals))
        let data = result.data
        data.AudFechaIng = this.formatDate(data.AudFechaIng);
        
        this.formHabilitacion.patchValue(data)
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

  formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

}