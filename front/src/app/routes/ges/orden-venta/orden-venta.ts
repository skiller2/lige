import { Component, effect, inject, input, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { SHARED_IMPORTS } from '@shared'
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions'
import { firstValueFrom } from 'rxjs'
import { ApiService } from '../../../services/api.service'

@Component({
  selector: 'app-orden-venta',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzDescriptionsModule, DecimalPipe],
  templateUrl: './orden-venta.html',
  styleUrl: './orden-venta.less'
})
export class OrdenVentaComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)

  cabecera = signal<any>({})
  isLoading = signal(false)

  private apiService = inject(ApiService)

  constructor() {
    effect(() => {
      const objetivoId = this.objetivoId()
      const anio = this.anio()
      const mes = this.mes()

      if (objetivoId > 0 && anio > 0 && mes > 0)
        this.getCabecera(objetivoId, anio, mes)
      else
        this.cabecera.set({})
    })
  }

  async getCabecera(objetivoId: number, anio: number, mes: number) {
    this.isLoading.set(true)
    try {
      const cabecera = await firstValueFrom(this.apiService.getCabeceraOrdenVenta(objetivoId, anio, mes))
      this.cabecera.set(cabecera ?? {})
    } finally {
      this.isLoading.set(false)
    }
  }
}
