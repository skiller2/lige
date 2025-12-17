import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, signal, output, effect } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-habilitaciones-form-drawer',
    imports: [SHARED_IMPORTS, CommonModule],
    templateUrl: './habilitaciones-form-drawer.html',
    styleUrl: './habilitaciones-form-drawer.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabilitacionesFormDrawerComponent {
  tituloDrawer = signal<string>("Nueva Habilitación Detalle")
  placement: NzDrawerPlacement = 'left';
  disabled = input<boolean>(false)
  RefreshCurso = model<boolean>(false)
  visible = model<boolean>(false)
  
  personalId = input<number>(0)
  lugarHabilitacionId = input<number>(0)
  personalHabilitacionId = input<number>(0)

  formEdit = signal<number>(0)
  isLoading = signal(false);
  
  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  fb = inject(FormBuilder)
  formHabilitacion = this.fb.group({
    GestionHabilitacionEstadoCodigo:0,
    Detalle:'',
    NroTramite:'',
    PersonalHabilitacionDesde:'',
    PersonalHabilitacionHasta:'',
    PersonalHabilitacionClase:'',
    AudFechaIng:'',
  })

  $optionsEstadoCodigo = this.searchService.getEstadosHabilitaciones()

  constructor(
    // private apiService = ApiService,
    // private notification = NzNotificationService,
    private searchService: SearchService
  ) {
    effect(async() => {
      const visible = this.visible()
      if (visible) {
        
      }
    })
  }

  async save() {
    this.isLoading.set(true)
    let vals = this.formHabilitacion.value
    try {
      
    } catch (error) {
      // Handle error if needed
    }
    this.isLoading.set(false)
  }
}