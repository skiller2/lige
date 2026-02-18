import { ChangeDetectionStrategy, Component, effect, inject, model, signal, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../../../app/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-novedad',
    imports: [
        NzInputModule,
        NzDatePickerModule,
        SHARED_IMPORTS,
    ],
    templateUrl: './novedad.html',
    styleUrl: './novedad.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NovedadComponent {
  ngForm = viewChild.required(NgForm);
  private apiService = inject(ApiService)
  NovedaCodigo = signal('')

  constructor() {}

  ngOnInit() {
    setTimeout(async () => {
      this.load(false)
    }, 0);
  }

  async load(prev: boolean) {
    this.ngForm().form.patchValue(await firstValueFrom(this.apiService.getValuesNovedad(prev)))
  }

  async save() {
    const res = await firstValueFrom(this.apiService.setNovedad(this.ngForm().value))
  }

}