import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, signal, output, effect } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-instituciones-drawer',
    imports: [SHARED_IMPORTS, CommonModule, NzUploadModule, NzAutocompleteModule],
    templateUrl: './instituciones-drawer.component.html',
    styleUrl: './instituciones-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstitucionesDrawerComponent {
  tituloDrawer = signal<string>("Nueva Institución")
  disabled = input<boolean>(false)
  RefreshCurso = model<boolean>(false)
  private apiService = inject(ApiService)
  private notification = inject(NzNotificationService)
  CentroCapacitacionId = input.required<number>()
  CentroCapacitacionIdForEdit = signal<number>(0)
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)
  isSaving = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    CentroCapacitacionId: 0,
    CentroCapacitacionCuit: "",
    CentroCapacitacionRazonSocial: "",
    CentroCapacitacionInactivo: false
  })

  constructor(private searchService: SearchService) {
    effect(async() => {
      const visible = this.visible()
      if (visible) {
        if (this.CentroCapacitacionId() > 0) {
          let vals = await firstValueFrom(this.apiService.getListInstitucionesHistory({ options: { filtros: [], sort: null, extra: null } }, this.CentroCapacitacionId()))
          
          this.CentroCapacitacionIdForEdit.set(vals.list[0].CursoHabilitacionId)
          vals.CentroCapacitacionId = vals.list[0].CentroCapacitacionId
          vals.CentroCapacitacionCuit = vals.list[0].CentroCapacitacionCuit
          vals.CentroCapacitacionRazonSocial = vals.list[0].CentroCapacitacionRazonSocial
          vals.CentroCapacitacionInactivo = vals.list[0].CentroCapacitacionInactivo
          
          this.formCli.patchValue(vals)
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()

          if (this.disabled()) {
            this.tituloDrawer.set('Consultar Institución')
            this.formCli.disable()
          } else {
            this.tituloDrawer.set('Editar Institución')
            this.formCli.enable()
          }
        }
      }
    })
  }

  async save() {
    this.isSaving.set(true)
    let vals = this.formCli.value
    try {
      vals.CentroCapacitacionId = this.CentroCapacitacionId()
      const res = await firstValueFrom(this.apiService.setInstituciones(vals))

      if(res.data?.list[0]?.CentroCapacitacionId > 0) {
        this.CentroCapacitacionIdForEdit.set(res.data?.list[0]?.CentroCapacitacionId)
        this.formCli.patchValue({
          CentroCapacitacionId: res.data?.list[0]?.CentroCapacitacionId,
        })
        this.tituloDrawer.set('Editar Institución')
      }  
      
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      this.onRefreshInstituciones.emit()
    } catch (error) {
      // Handle error if needed
    }
    this.isSaving.set(false)
  }

  async deleteInstitucion() {
    this.visible.set(false)
    this.onRefreshInstituciones.emit()
  }
}