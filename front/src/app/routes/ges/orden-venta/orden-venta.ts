import { Component, computed, effect, inject, input, output, resource, signal } from '@angular/core'
import { CurrencyPipe, DecimalPipe } from '@angular/common'
import { SHARED_IMPORTS } from '@shared'
// import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta'
import { OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form'
import { firstValueFrom } from 'rxjs'
import { ApiService } from '../../../services/api.service'

@Component({
  selector: 'app-orden-venta',
  standalone: true,
  imports: [...SHARED_IMPORTS, DecimalPipe, CurrencyPipe, OrdenVentaFormComponent/*, TableOrdenVentaComponent*/],
  templateUrl: './orden-venta.html',
  styleUrl: './orden-venta.less'
})
export class OrdenVentaComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)
  horasAFacturarA = input<number>(0)
  horasAFacturarABloqueada = input<boolean>(false)

  objetivoNombre = output<string>()
  guardado = output<number | null>()

  cabecera = signal<any>({})
  isLoading = signal(false)

  private apiService = inject(ApiService)

  // Detalle de la orden (ítems). Se recarga solo al cambiar objetivo/período.
  // Si la orden del período no existe, el detalle viene inicializado con el mes anterior.
  itemsResource = resource({
    params: () => ({ objetivoId: this.objetivoId(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      if (!params.objetivoId || !params.anio || !params.mes) return { list: [], esNueva: false }

      const response = await firstValueFrom(
        this.apiService.getListOrdenVenta(params.objetivoId, params.anio, params.mes)
      )
      return { ...response, list: response.list ?? [] }
    },
    defaultValue: { list: [], esNueva: false } as any
  })

  items = computed<any[]>(() => this.itemsResource.value()?.list ?? [])

  // Una orden que todavía no se generó no tiene estado propio
  estado = computed<string>(() => {
    const detalle = this.itemsResource.value()
    if (this.cabecera().EstadoOrdenVenta) return this.cabecera().EstadoOrdenVenta
    if (detalle?.esNueva && detalle?.list?.length)
      return `Nueva, inicializada con ${String(detalle.origenMes).padStart(2, '0')}/${detalle.origenAnio}`
    return 'Nueva'
  })

  // Detalle tal cual está en el form (incluye ítems agregados/editados sin guardar)
  detalle = signal<any[]>([])

  // Total Orden de Venta = Σ Importe Total de cada ítem
  importeTotal = computed(() =>
    this.detalle().reduce((total: number, item: any) => total + Number(item.ImporteTotal ?? 0), 0)
  )

  constructor() {
    effect(() => {
      const objetivoId = this.objetivoId()
      const anio = this.anio()
      const mes = this.mes()

      if (objetivoId > 0 && anio > 0 && mes > 0) {
        this.getCabecera(objetivoId, anio, mes)
      } else {
        this.cabecera.set({})
        this.objetivoNombre.emit('')
      }
    })
  }

  // Después de guardar cambian tanto el detalle (ítems nuevos con su código) como la
  // cabecera (nro. de orden y estado)
  ordenVentaGuardada(horasAFacturarA: number | null) {
    this.recargar()
    this.guardado.emit(horasAFacturarA)
  }

  recargar() {
    this.itemsResource.reload()
    if (this.objetivoId() > 0 && this.anio() > 0 && this.mes() > 0)
      this.getCabecera(this.objetivoId(), this.anio(), this.mes())
  }

  async getCabecera(objetivoId: number, anio: number, mes: number) {
    this.isLoading.set(true)
    try {
      const cabecera = await firstValueFrom(this.apiService.getCabeceraOrdenVenta(objetivoId, anio, mes))
      this.cabecera.set(cabecera ?? {})
      this.objetivoNombre.emit(this.cabecera().ObjetivoNombre ?? '')
    } finally {
      this.isLoading.set(false)
    }
  }
}
