import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
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
  IsEdit = input.required<boolean>()
  selectedSucursalId = '';
  $selectedSucursalIdChange = new BehaviorSubject('');
  $isSucursalDataLoading = new BehaviorSubject(false);
  $optionsSucursales = this.searchService.getSucursales();

  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  tituloDrawer = "Modificación de Licencia"

  constructor(
    private searchService: SearchService
  ) {}

  cambios =  computed(async() => {
    const visible = this.visible()
    if (visible) {
      let vals = await firstValueFrom(this.apiService.getLicencia(this.selectedPeriod().year, this.selectedPeriod().month, this.PersonalId(), this.PersonalLicenciaId()));
      // if(vals?.categoria != undefined){
        vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}` }
        this.ngForm().form.patchValue(vals)
      //}
    }
    return true
  })

  async save(IsEdit:boolean) {
    let vals = this.ngForm().value
    vals.PersonalLicenciaTipoAsociadoId=vals.categoria.categoriaId
    vals.PersonalLicenciaCategoriaPersonalId=vals.categoria.tipoId
    vals.IsEdit=IsEdit
    vals.PersonalLicenciaHorasMensuales = this.formatHours(vals.PersonalLicenciaHorasMensuales)
    const res = await firstValueFrom(this.apiService.setLicencia(vals))
  }

  formatHours(hours:any) {

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
    vals.PersonalLicenciaTipoAsociadoId=vals.categoria.categoriaId
    vals.PersonalLicenciaCategoriaPersonalId=vals.categoria.tipoId
    const res = await firstValueFrom(this.apiService.deleteLicencia(vals))
  }

  selectedValueChange(event: any): void {
    //   this.asistenciaexcepcion.controls['anio'].setValue(2023);
    //    this.asistenciaexcepcion.controls['mes'].setValue(3);


        this.$selectedSucursalIdChange.next(event);
        this.$isSucursalDataLoading.next(true);

        return; 
    }
  }

  
