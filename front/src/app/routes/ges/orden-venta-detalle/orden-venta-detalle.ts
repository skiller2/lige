import { Component, computed, effect, inject, input, linkedSignal, output, resource, signal, untracked, viewChild } from '@angular/core'
import { CurrencyPipe, DecimalPipe } from '@angular/common'
import { SHARED_IMPORTS } from '@shared'
import { HorasAFacturar, OrdenVentaFormComponent, ordenVentaNoModificable } from '../orden-venta-form/orden-venta-form'
import { firstValueFrom } from 'rxjs'
import { ApiService } from '../../../services/api.service'

// Valores del selector de Orden de Venta que no son el número de una orden existente: las
// dos formas de dar de alta una, vacía o con el detalle de la última orden de los meses anteriores
const ORDEN_NUEVA_SIN_PLANTILLA = 'nueva-sin-plantilla'
const ORDEN_NUEVA_CON_PLANTILLA = 'nueva-con-plantilla'

// Detalle de la orden de venta de un objetivo y un período, tal como lo abre la carga de
// asistencia desde su drawer. El listado de órdenes es otra pantalla (app-orden-venta).
@Component({
  selector: 'app-orden-venta-detalle',
  standalone: true,
  imports: [...SHARED_IMPORTS, DecimalPipe, CurrencyPipe, OrdenVentaFormComponent],
  templateUrl: './orden-venta-detalle.html',
  styleUrl: './orden-venta-detalle.less'
})
export class OrdenVentaDetalleComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)
  horasAFacturarA = input<number>(0)
  horasAFacturarB = input<number>(0)
  horasAFacturarABloqueada = input<boolean>(false)
  horasAFacturarBBloqueada = input<boolean>(false)

  objetivoNombre = output<string>()
  guardado = output<HorasAFacturar>()

  horasAFacturarChange = output<HorasAFacturar>()

  cabecera = signal<any>({})
  isLoading = signal(false)

  private apiService = inject(ApiService)

  // Órdenes que ya tiene el período, de la más nueva a la más vieja. Un período puede tener más
  // de una: desde acá se da de alta otra sin pisar la que ya está.
  ordenes = computed<any[]>(() => this.cabecera().Ordenes ?? [])

  // Hay una orden en los meses anteriores con detalle para copiar
  tienePlantilla = computed<boolean>(() => this.cabecera().TienePlantilla === true)

  // Opciones del selector de Orden de Venta: una por cada orden del período, y las dos altas.
  // Un período sin órdenes tiene sólo las altas.
  opcionesOrdenVenta = computed<{ value: string; label: string }[]>(() => [
    ...this.ordenes().map((orden: any) => ({
      value: String(orden.NroOrdenVenta),
      label: [orden.NroOrdenVenta, orden.EstadoOrdenVenta].filter(Boolean).join(' - ')
    })),
    { value: ORDEN_NUEVA_SIN_PLANTILLA, label: 'Nueva sin plantilla' },
    { value: ORDEN_NUEVA_CON_PLANTILLA, label: 'Nueva con plantilla' }
  ])

  // Orden que se está viendo. Al cambiar de objetivo/período, y después de guardar, se muestra
  // la última orden del período, que es la recién creada cuando el guardado dio de alta una.
  // Sin órdenes en el período se arranca el alta: con la plantilla de los meses anteriores si hay
  // algo para copiar, y vacía si no.
  ordenVentaSeleccionada = linkedSignal<{ ordenes: any[]; tienePlantilla: boolean }, string>({
    source: () => ({ ordenes: this.ordenes(), tienePlantilla: this.tienePlantilla() }),
    computation: (({ ordenes, tienePlantilla }) => ordenes.length
      ? String(ordenes[0].NroOrdenVenta)
      : tienePlantilla ? ORDEN_NUEVA_CON_PLANTILLA : ORDEN_NUEVA_SIN_PLANTILLA)
  })

  // Con "Nueva sin plantilla" la orden arranca vacía: no se arrastra ni una orden del período ni
  // el detalle de los meses anteriores
  esNuevaSinPlantilla = computed<boolean>(() => this.ordenVentaSeleccionada() === ORDEN_NUEVA_SIN_PLANTILLA)

  // Con "Nueva con plantilla" el detalle arranca con el de la última orden de los meses
  // anteriores, revaluado con los precios del período
  esNuevaConPlantilla = computed<boolean>(() => this.ordenVentaSeleccionada() === ORDEN_NUEVA_CON_PLANTILLA)

  // Las dos altas graban una orden nueva, no la del período
  esOrdenNueva = computed<boolean>(() => this.esNuevaSinPlantilla() || this.esNuevaConPlantilla())

  // Número de la orden elegida, o 0 con las altas, que todavía no tienen número
  nroOrdenVentaSeleccionada = computed<number>(() => Number(this.ordenVentaSeleccionada()) || 0)

  // Estado de la orden elegida. Las altas todavía no tienen ninguno.
  estadoOrdenSeleccionada = computed<string>(() =>
    this.ordenes().find((orden: any) => Number(orden.NroOrdenVenta) === this.nroOrdenVentaSeleccionada())
      ?.EstadoOrdenVenta ?? '')

  // "A Facturar" y "Facturado" no se modifican: el detalle queda sólo para consulta
  soloLectura = computed<boolean>(() => ordenVentaNoModificable(this.estadoOrdenSeleccionada()))

  // Detalle de la orden (ítems). Se recarga al cambiar objetivo/período o la orden elegida.
  itemsResource = resource({
    params: () => ({
      objetivoId: this.objetivoId(), anio: this.anio(), mes: this.mes(),
      NroOrdenVenta: this.nroOrdenVentaSeleccionada(),
      sinPlantilla: this.esNuevaSinPlantilla(), conPlantilla: this.esNuevaConPlantilla()
    }),
    loader: async ({ params }) => {
      if (!params.objetivoId || !params.anio || !params.mes) return { list: [], esNueva: false }

      // El alta sin plantilla no trae nada: el detalle se carga de cero
      if (params.sinPlantilla) return { list: [], esNueva: false }

      const response = await firstValueFrom(
        this.apiService.getListOrdenVenta(
          params.objetivoId, params.anio, params.mes, params.NroOrdenVenta, params.conPlantilla)
      )
      return { ...response, list: response.list ?? [] }
    },
    defaultValue: { list: [], esNueva: false } as any
  })

  items = computed<any[]>(() => this.itemsResource.value()?.list ?? [])

  // El detalle se inicializó con el del mes anterior: se puede grabar sin modificarlo
  detalleImportado = computed<boolean>(() =>
    !!this.itemsResource.value()?.esNueva && this.items().length > 0)

  // Detalle tal cual está en el form (incluye ítems agregados/editados sin guardar)
  detalle = signal<any[]>([])

  // Total Orden de Venta = suma del Importe Total de cada ítem
  importeTotal = computed(() =>
    this.detalle().reduce((total: number, item: any) => total + Number(item.ImporteTotal ?? 0), 0)
  )

  private ordenVentaForm = viewChild.required<OrdenVentaFormComponent>('ordenVentaForm')

  // El usuario tocó el detalle de la orden que se está viendo. Sin esto, abrir y cerrar el drawer
  // grabaría la orden armada sola (plantilla de meses anteriores o productos de horas agregados).
  
  // Al pasar de un campo a otro. Un detalle incompleto no se graba ni muestra errores: se sigue
  // cargando, y los faltantes se avisan al cerrar.

  private cerrarPromise: Promise<boolean> | null = null

  async guardarAlCerrar(): Promise<boolean> {
    if (this.cerrarPromise) {
      return this.cerrarPromise
    }

    this.cerrarPromise = (async () => {
      try {

        await new Promise(resolve => setTimeout(resolve, 200))

        return await this.ordenVentaForm().save()
      } finally {
        this.cerrarPromise = null
      }
    })()

    return this.cerrarPromise
  }

  constructor() {
    // Al cambiar de objetivo, período u orden elegida el detalle arranca sin tocar

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
  ordenVentaGuardada(horasAFacturar: HorasAFacturar) {
    this.recargar()
    this.guardado.emit(horasAFacturar)
  }

  recargar() {
    this.itemsResource.reload()
    if (this.objetivoId() > 0 && this.anio() > 0 && this.mes() > 0)
      this.getCabecera(this.objetivoId(), this.anio(), this.mes())
  }

  async getCabecera(objetivoId: number, anio: number, mes: number) {
    this.isLoading.set(true)
    try {
      const cabecera = await firstValueFrom(this.apiService.getOrdenVentaCabecera(objetivoId, anio, mes))
      this.cabecera.set(cabecera ?? {})
      this.objetivoNombre.emit(this.cabecera().ObjetivoNombre ?? '')
    } finally {
      this.isLoading.set(false)
    }
  }
}
