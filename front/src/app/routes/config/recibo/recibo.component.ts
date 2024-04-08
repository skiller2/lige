import { ChangeDetectionStrategy, Component, effect, inject, model, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS, PersonalSearchComponent],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ReciboComponent {
  ngForm = viewChild.required(NgForm);
  private apiService = inject(ApiService)
  PersonalId = model.required()

  constructor() {
    effect(() => { this.ngForm().controls['PersonalId']?.setValue(Number(this.PersonalId())) });
  }

  ngOnInit() {
    setTimeout(() => {
      const now = new Date()
      const anio = Number(localStorage.getItem('anio')) > 0 ? Number(localStorage.getItem('anio')) : now.getFullYear();
      const mes = Number(localStorage.getItem('mes')) > 0 ? Number(localStorage.getItem('mes')) : now.getMonth() + 1;
      this.ngForm().controls['periodo']?.setValue(new Date(anio, mes - 1, 1))
    }, 0);

  }

  async save() {
    const res = await firstValueFrom(this.apiService.setRecibo(this.ngForm().value))
  }

}

