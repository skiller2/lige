import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';


@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, EditorCategoriaComponent, InasistenciaSearchComponent, PersonalSearchComponent, CommonModule],
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
  uploading$ = new BehaviorSubject({loading:false,event:null});
  constructor(
    private searchService: SearchService
  ) { }

  cambios = computed(async () => {
    const visible = this.visible()
    this.ngForm().form.reset()
    if (visible) {
      const per = this.selectedPeriod()
      if (this.PersonalLicenciaId()) {
        let vals = await firstValueFrom(this.apiService.getLicencia(per.year, per.month, this.PersonalId(), this.PersonalLicenciaId()));
        vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}` }
        this.ngForm().form.patchValue(vals)
      }
    }
    return true
  })

  async save() {
    let vals = this.ngForm().value
    vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
    vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId
    vals.PersonalLicenciaHorasMensuales = this.formatHours(vals.PersonalLicenciaHorasMensuales)
    const res = await firstValueFrom(this.apiService.setLicencia(vals))
  }

  formatHours(hours: any) {

    if (!hours) return;

    let [integerPart, decimalPart] = hours.split(',');
    decimalPart = decimalPart ? decimalPart.padEnd(2, '0') : '00';
    let minutes = Math.round(parseFloat('0.' + decimalPart) * 60);

    if (minutes >= 60) {
      integerPart = (parseInt(integerPart) + 1).toString();
      minutes -= 60;
    }
    decimalPart = minutes.toString().padStart(2, '0');

    return hours = `${integerPart}.${decimalPart}`;
  }

  async deletelicencia() {
    let vals = this.ngForm().value
    const res = await firstValueFrom(this.apiService.deleteLicencia(vals))
  }

  uploadChange(event: any) {
    switch (event.type) {
      case 'start':
        this.uploading$.next({ loading: true, event })
    
        break;
      case 'progress':

        break;
      case 'error':
        const Error = event.file.error
        if (Error.error.data?.list) {
        }
        this.uploading$.next({ loading:false,event })
        break;
      case 'success':
        const Response = event.file.response
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)        
        break
      default:
        break;
    }

  }
}