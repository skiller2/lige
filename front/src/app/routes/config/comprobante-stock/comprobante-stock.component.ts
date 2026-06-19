import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../../../app/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-comprobante-stock',
    imports: [
        NzInputModule,
        NzDatePickerModule,
        SHARED_IMPORTS,
    ],
    templateUrl: './comprobante-stock.component.html',
    styleUrl: './comprobante-stock.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComprobanteStockComponent {
  ngForm = viewChild.required(NgForm);
  private apiService = inject(ApiService)
  MovimientoStockCodigo = signal('')

  ngOnInit() {
    setTimeout(async () => {
      this.load(false)
    }, 0);
  }

  async load(prev: boolean) {
    this.ngForm().form.patchValue(await firstValueFrom(this.apiService.getValuesComprobanteStock(prev)))
  }

  async save() {
    const res = await firstValueFrom(this.apiService.setComprobanteStock(this.ngForm().value))
  }

}
