import { ChangeDetectionStrategy, Component, effect, inject, model, signal, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { PersonalSearchComponent } from '../../../../app/shared/personal-search/personal-search.component';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../../../app/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-recibo',
    imports: [
        NzInputModule,
        NzDatePickerModule,
        SHARED_IMPORTS, PersonalSearchComponent
    ],
    templateUrl: './recibo.component.html',
    styleUrl: './recibo.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReciboComponent {
  ngForm = viewChild.required(NgForm);
  private apiService = inject(ApiService)
  PersonalId = model.required()
  anio = signal(0)
  mes = signal(0)
  constructor() {
    effect(() => { this.ngForm().controls['PersonalId']?.setValue(Number(this.PersonalId())) });
  }

  ngOnInit() {
    setTimeout(async () => {
      const now = new Date()
      const anio = Number(localStorage.getItem('anio')) > 0 ? Number(localStorage.getItem('anio')) : now.getFullYear();
      const mes = Number(localStorage.getItem('mes')) > 0 ? Number(localStorage.getItem('mes')) : now.getMonth() + 1;
      this.ngForm().controls['periodo']?.setValue(new Date(anio, mes - 1, 1))

      this.load(false)
    }, 0);
  }

  dateChange(val: Date) {
    this.anio.set(val.getFullYear())
    this.mes.set(val.getMonth() + 1)
  }

  async load(prev: boolean) {
    this.ngForm().form.patchValue(await firstValueFrom(this.apiService.getValuesRecibo(prev)))
  }

  async save() {
    const res = await firstValueFrom(this.apiService.setRecibo(this.ngForm().value))
  }

}

