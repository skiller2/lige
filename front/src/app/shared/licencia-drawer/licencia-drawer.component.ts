import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, ReactiveFormsModule, EditorCategoriaComponent, InasistenciaSearchComponent, PersonalSearchComponent,CommonModule],
  templateUrl: './licencia-drawer.component.html',
  styleUrl: './licencia-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LicenciaDrawerComponent {
  ngForm = viewChild.required(NgForm);
  PersonalId = input.required<number>()
  PersonalLicenciaId = input.required<number>()
  selectedPeriod = input.required<any>()
  private apiService = inject(ApiService)

  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  tituloDrawer = "Modificación de Licencia"

  cambios =  computed(async() => {
    const visible = this.visible()
    if (visible) {
      let vals = await firstValueFrom(this.apiService.getLicencia(this.selectedPeriod().year, this.selectedPeriod().month, this.PersonalId(), this.PersonalLicenciaId()));
      vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}` }
      this.ngForm().form.patchValue(vals)
    }
    return true
  })

  async save() {
    let vals = this.ngForm().value
    vals.PersonalLicenciaTipoAsociadoId=vals.categoria.categoriaId
    vals.PersonalLicenciaCategoriaPersonalId=vals.categoria.tipoId
    const res = await firstValueFrom(this.apiService.setLicencia(vals))
  }

  }
