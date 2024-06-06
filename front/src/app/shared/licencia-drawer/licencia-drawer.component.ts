import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';

@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, ReactiveFormsModule, EditorCategoriaComponent, InasistenciaSearchComponent, PersonalSearchComponent],
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

  async onVisibleChange(vis: boolean) {
    if (vis) {
      const vals = await firstValueFrom(this.apiService.getLicencia(this.selectedPeriod().year,this.selectedPeriod().month, this.PersonalId(), this.PersonalLicenciaId()));
      console.log('valores', vals)
      this.ngForm().form.patchValue(vals)
    }
  }

  async ngOnInit() {
  }

  async save() {
    const res = await firstValueFrom(this.apiService.setLicencia(this.ngForm().value))
  }

  }
