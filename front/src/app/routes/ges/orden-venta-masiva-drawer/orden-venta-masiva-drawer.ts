import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, resource, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

// Órdenes de venta seleccionadas, agrupadas por cliente
interface ClienteOrdenes {
  ClienteId: number
  Cliente: string
  NroOrdenVentas: number[]
  // Objetivos de las órdenes del cliente, sin repetir: un cliente puede tener varios
  objetivos: string[]
  cantidad: number
  importeTotal: number
}

// Valor de un input enmascarado como número, o null si todavía no se cargó
function aNumero(valor: any): number | null {
  if (valor == null || String(valor).trim() === '') return null
  const texto = String(valor)
  const numero = Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto)
  return Number.isFinite(numero) ? numero : null
}

@Component({
  selector: 'app-orden-venta-masiva-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, CurrencyPipe],
  templateUrl: './orden-venta-masiva-drawer.html',
  styleUrl: './orden-venta-masiva-drawer.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaMasivaDrawerComponent {

  // Filas seleccionadas en la grilla de órdenes de venta
  ordenes = input<any[]>([])

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left'

  private fb = inject(FormBuilder)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private notification = inject(NzNotificationService)

  optionsEstado = toSignal(this.searchService.getEstadoOrdenVenta(), { initialValue: [] as any[] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] as any[] })

  // La edición masiva es por cliente: se agrupan las órdenes seleccionadas por el suyo, con la
  // cantidad y el importe total de cada grupo
  clientes = computed<ClienteOrdenes[]>(() => {
    const porCliente = new Map<number, ClienteOrdenes>()

    for (const orden of this.ordenes()) {
      const ClienteId = Number(orden?.ClienteId ?? 0)

      if (!porCliente.has(ClienteId))
        porCliente.set(ClienteId, {
          ClienteId,
          Cliente: String(orden?.Cliente ?? '').trim(),
          NroOrdenVentas: [],
          objetivos: [],
          cantidad: 0,
          importeTotal: 0
        })

      const cliente = porCliente.get(ClienteId)!
      cliente.NroOrdenVentas.push(Number(orden?.NroOrdenVenta))
      cliente.cantidad += 1
      cliente.importeTotal += Number(orden?.ImporteTotalAFacturar ?? 0)

      const objetivo = String(orden?.Objetivo ?? '').trim()
      if (objetivo && !cliente.objetivos.includes(objetivo)) cliente.objetivos.push(objetivo)
    }

    return [...porCliente.values()]
  })

  // CUIT, razón social y domicilio de los clientes de la selección
  private datosFacturacion = resource({
    params: () => ({ clientes: this.clientes().map(cliente => cliente.ClienteId) }),
    loader: async ({ params }) => {
      if (!params.clientes.length) return []
      return await firstValueFrom(this.searchService.getDatosFacturacionOrdenVenta(params.clientes))
    },
    defaultValue: [] as any[]
  })

  // Indexados por ClienteId, para buscarlos desde cada tarjeta
  facturacion = computed<Record<number, any>>(() =>
    Object.fromEntries((this.datosFacturacion.value() ?? []).map(
      (cliente: any) => [Number(cliente.ClienteId), cliente])))

  // Un grupo por cliente con lo que se va a aplicar a todas sus órdenes. Se rearma solo cuando
  // cambia la selección de la grilla: lo cargado a mano vale para esa selección, no para otra.
  formMasivo = computed<FormGroup>(() => this.fb.group({
    clientes: this.fb.array(this.clientes().map(cliente => this.fb.group({
      ClienteId: cliente.ClienteId,
      EstadoOrdenVentaCodigo: [null as string | null],
      ComprobanteTipoCodigo: [null as string | null],
      ComprobanteNro: [''],
      ImporteTotal: [null as number | null]
    })))
  }))

  clientesArray = computed<FormArray>(() => this.formMasivo().get('clientes') as FormArray)

  // Comprobantes que ya tienen las órdenes seleccionadas y se pueden editar. Un mismo comprobante
  // puede estar en varias órdenes: el back sólo devuelve los que tienen TODAS sus órdenes dentro
  // de la selección, porque si no, editarlo cambiaría una orden que no se eligió.
  private comprobantesSeleccion = resource({
    params: () => ({
      ordenes: this.ordenes().map(orden => Number(orden?.NroOrdenVenta)).filter(Number.isFinite)
    }),
    loader: async ({ params }) => {
      if (!params.ordenes.length) return []
      return await firstValueFrom(this.searchService.getComprobantesSeleccionOrdenVenta(params.ordenes))
    },
    defaultValue: [] as any[]
  })

  comprobantesEditables = computed<any[]>(() => this.comprobantesSeleccion.value() ?? [])

  // El tipo y el número originales identifican al comprobante: son los que el back usa para
  // encontrar sus filas, así que se guardan aparte de lo que se edita en pantalla
  formComprobantes = computed<FormGroup>(() => this.fb.group({
    comprobantes: this.fb.array(this.comprobantesEditables().map(comprobante => this.fb.group({
      ComprobanteTipoCodigoOriginal: String(comprobante.ComprobanteTipoCodigo ?? '').trim(),
      ComprobanteNroOriginal: String(comprobante.ComprobanteNro ?? '').trim(),
      ComprobanteTipoCodigo: [String(comprobante.ComprobanteTipoCodigo ?? '').trim()],
      ComprobanteNro: [String(comprobante.ComprobanteNro ?? '').trim()],
      ImporteTotal: [comprobante.ImporteTotal ?? null]
    })))
  }))

  comprobantesArray = computed<FormArray>(() => this.formComprobantes().get('comprobantes') as FormArray)

  guardando = signal(false)

  // Cambia al guardar: la grilla quedó vieja y hay que releerla
  guardado = output<void>()

  async save() {
    if (this.guardando()) return

    const clientes = this.clientesArray().getRawValue().map((cliente: any, indice: number) => ({
      ClienteId: cliente.ClienteId,
      // Las órdenes del cliente salen de la selección de la grilla, no del formulario
      NroOrdenVentas: this.clientes()[indice]?.NroOrdenVentas ?? [],
      EstadoOrdenVentaCodigo: cliente.EstadoOrdenVentaCodigo,
      ComprobanteTipoCodigo: cliente.ComprobanteTipoCodigo,
      ComprobanteNro: String(cliente.ComprobanteNro ?? '').trim(),
      ImporteTotal: aNumero(cliente.ImporteTotal)
    }))

    // Sólo se mandan los comprobantes que se tocaron: el resto no tiene nada que actualizar
    const comprobantes = this.comprobantesArray().controls
      .filter(comprobante => comprobante.dirty)
      .map(comprobante => {
        const valor = comprobante.getRawValue()
        return {
          ComprobanteTipoCodigoOriginal: valor.ComprobanteTipoCodigoOriginal,
          ComprobanteNroOriginal: valor.ComprobanteNroOriginal,
          ComprobanteTipoCodigo: valor.ComprobanteTipoCodigo,
          ComprobanteNro: String(valor.ComprobanteNro ?? '').trim(),
          ImporteTotal: aNumero(valor.ImporteTotal)
        }
      })

    this.guardando.set(true)
    try {
      const respuesta = await firstValueFrom(this.apiService.setOrdenVentaMasiva(clientes, comprobantes))

      this.notification.success('Órdenes de venta', respuesta?.msg ?? 'Grabación exitosa')
      this.guardado.emit()
      this.visible.set(false)
    } finally {
      this.guardando.set(false)
    }
  }
}
