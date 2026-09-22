import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, resource, signal, untracked } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
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
  comprobantesSeleccion = signal<any[]>([])
  datosFacturacion = signal<any[]>([])

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left'

  private fb = inject(FormBuilder)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)

  optionsEstado = toSignal(this.searchService.getEstadoOrdenVenta(), { initialValue: [] as any[] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] as any[] })

  private effect =  effect(()=>{
    const visible = this.visible()
    if (visible){

      untracked(async ()=>{
      console.log('presentar datos',this.ordenes())
      const cs= await firstValueFrom(this.searchService.getOrdenVentaMasiva(this.ordenes()))
      
      this.comprobantesSeleccion.set(cs.comprobantes)
      this.datosFacturacion.set(cs.clientes)

      console.log('presentar datos',this.ordenes())
      console.log('presentar datos',this.comprobantesSeleccion())
      console.log('presentar datos',this.datosFacturacion())

      })

    }
  })

  // La edición masiva es por cliente: se agrupan las órdenes seleccionadas por el suyo, con la
  // cantidad y el importe total de cada grupo
  clientes = computed<ClienteOrdenes[]>(() => {
    const porCliente = new Map<number, ClienteOrdenes>()

    for (const orden of this.ordenes() ?? []) {
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


  // Indexados por ClienteId, para buscarlos desde cada tarjeta
  facturacion = computed<Record<number, any>>(() =>
    Object.fromEntries((this.datosFacturacion() ?? []).map(
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

  comprobantesEditables = computed<any[]>(() => this.comprobantesSeleccion() ?? [])

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

  
  // Cambia al guardar: la grilla quedó vieja y hay que releerla
  onOrdenVentaMasivaSave = output<void>()

  // Con "Facturado" elegido para el cliente, los datos del comprobante son obligatorios
  async save() {
  
    const clientes = this.clientesArray().getRawValue().map((cliente: any, indice: number) => ({
      ClienteId: cliente.ClienteId,
      // Las órdenes del cliente salen de la selección de la grilla, no del formulario
      NroOrdenVentas: this.clientes()[indice]?.NroOrdenVentas ?? [],
      EstadoOrdenVentaCodigo: cliente.EstadoOrdenVentaCodigo,
      ComprobanteTipoCodigo: cliente.ComprobanteTipoCodigo,
      ComprobanteNro: String(cliente.ComprobanteNro ?? '').trim(),
      ImporteTotal: aNumero(cliente.ImporteTotal)
    }))

    // Pasar a "Facturado" obliga a cargar el comprobante del cliente, con todos sus datos
    const sinComprobante = clientes.filter((cliente: any) =>
      String(cliente.EstadoOrdenVentaCodigo ?? '').trim().toUpperCase() === 'FAC'
      && (!cliente.ComprobanteTipoCodigo || !cliente.ComprobanteNro || cliente.ImporteTotal == null))


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

    try {
      const respuesta = await firstValueFrom(this.apiService.setOrdenVentaMasiva(clientes, comprobantes))

      this.onOrdenVentaMasivaSave.emit()
      this.visible.set(false)
    } finally {
    }
  }
}
