import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, signal, model, input, output, effect } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { FormBuilder } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-habilitacion-necesaria-form-modal',
  imports: [SHARED_IMPORTS, CommonModule,],
  providers: [],
  templateUrl: './habilitacion-necesaria-form-modal.html',
  styleUrl: './habilitacion-necesaria-form-modal.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionNecesariaFormModalComponent {
  isLoading = signal<boolean>(false)
  apellidoNombre = input<string>('')
  personalId = input<number>(0)
  visible = model<boolean>(false)
  onAddorUpdate = output()

  private searchService = inject(SearchService)
  private apiService = inject(ApiService)

  fb = inject(FormBuilder)
  formHabilitacionNecesaria = this.fb.group({
    PersonalId:0,
    LugarHabilitacionIds: []
  })

  constructor() {
    effect(async() => {
      const visible = this.visible()
      if (visible) {
        let res = await firstValueFrom(this.searchService.getHabilitacionNecesariaByPersonalId(this.personalId()))
        // console.log('habsNecesaria: ', res);
        
        this.formHabilitacionNecesaria.reset(res)
        this.formHabilitacionNecesaria.markAsUntouched()
        this.formHabilitacionNecesaria.markAsPristine()
      }
      else {
        this.formHabilitacionNecesaria.reset()
        this.formHabilitacionNecesaria.enable()
      }
    })
  }

  $optionsLugarHabilitacion = this.searchService.getLugarHabilitacionOptions();

   async save() {
    this.isLoading.set(true)
    let vals:any = this.formHabilitacionNecesaria.value
    try {
      // console.log('vals: ', vals);
      await firstValueFrom(this.apiService.updateHabilitacionNecesaria(vals))

      this.formHabilitacionNecesaria.markAsUntouched()
      this.formHabilitacionNecesaria.markAsPristine()
      this.onAddorUpdate.emit()
    } catch (error) {
    }
    this.isLoading.set(false)
  }

  handleCancel(): void {
    this.visible.set(false) 
  }

}