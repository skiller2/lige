import { Component, Injector, viewChild, inject, signal, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-personal-form',
  templateUrl: './personal-form.component.html',
  styleUrl: './personal-form.component.less',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
  
export class PersonalFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
  isLoading = signal(false);

  fb = inject(FormBuilder)
  formPer = this.fb.group({personalId:0, nombre:'', apellido:'', cuit:'', nroLegajo:'',
    sucusalId:0, fechaAlta:'', fechaNacimiento:'', perfilImg:'', nacionalidad:'', dniImg:''
  })

  $optionsSucusal = this.searchService.getSucursales();

  async save() {
    this.isLoading.set(true)
    const form = this.formPer.value
    console.log('form', form);
    try {
      // this.formPer.markAsUntouched()
      // this.formPer.markAsPristine()
    } catch (e) {
      
    }
    this.isLoading.set(false)
  }
}