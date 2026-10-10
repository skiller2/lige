import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { applyEach, form, FormField, required, submit } from '@angular/forms/signals';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

// Estado Facturado: es el único que pide número de factura
const ESTADO_FACTURADO = 4

// Un cliente con las custodias seleccionadas que le pertenecen; el estado se aplica a todas
export interface ClienteEstadoMasivo {
  ClienteId: number
  Cliente: string
  CUIT: string
  RazonSocial: string
  Domicilio: string
  custodiasIds: number[]
  Cantidad: number
  ImporteTotal: number
  // Editables
  EstadoCodigo: number | null
  NumeroFactura: number | null
}

export interface EstadoMasivoForm {
  clientes: ClienteEstadoMasivo[]
}

@Component({
  selector: 'app-custodias-estado-masivo-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, FormField],
  templateUrl: './custodias-estado-masivo-drawer.html',
  styleUrl: './custodias-estado-masivo-drawer.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustodiasEstadoMasivoDrawerComponent {

  // Filas seleccionadas en la grilla de custodias
  custodias = input<any[]>([])
  // Período de la grilla
  anio = input<number>(0)
  mes = input<number>(0)
  visible = model<boolean>(false)

  // Emite al guardar: la grilla quedó vieja y hay que releerla
  estadoMasivoGuardado = output<void>()

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)

  optionsEstadoCust = toSignal(this.searchService.getEstadoCustodia(), { initialValue: [] as any[] })

  periodo = computed(() => new Date(this.anio(), this.mes() - 1, 1))

  private readonly defaultEstadoMasivo: EstadoMasivoForm = { clientes: [] }

  readonly estadoMasivo = signal<EstadoMasivoForm>(structuredClone(this.defaultEstadoMasivo))

  // El resto de las reglas (importes cargados, permisos, facturado) las valida el back y vuelven como fieldErrors
  readonly formEstadoMasivo = form(this.estadoMasivo, (p) => {
    applyEach(p.clientes, (cliente) => {
      required(cliente.EstadoCodigo, { message: 'Estado es requerido' })
      required(cliente.NumeroFactura, { message: 'Número de Factura es requerido', when: (ctx) => ctx.valueOf(cliente.EstadoCodigo) == ESTADO_FACTURADO })
    })
  })

  esFacturado(i: number): boolean {
    return this.estadoMasivo().clientes[i]?.EstadoCodigo == ESTADO_FACTURADO
  }

  async load(custodias: any[]) {
    // Agrupa las custodias seleccionadas por cliente
    const clientes: ClienteEstadoMasivo[] = []
    for (const custodia of custodias) {
      let cliente = clientes.find(c => c.ClienteId == custodia.Cliente.id)
      if (!cliente) {
        cliente = {
          ClienteId: custodia.Cliente.id, Cliente: custodia.Cliente.fullName, CUIT: '', RazonSocial: '', Domicilio: '',
          custodiasIds: [], Cantidad: 0, ImporteTotal: 0, EstadoCodigo: null, NumeroFactura: null
        }
        clientes.push(cliente)
      }
      cliente.custodiasIds.push(custodia.id)
      cliente.Cantidad += 1
      cliente.ImporteTotal += Number(custodia.ImporteFactura) || 0
    }

    // Datos de facturación, buscados por ClienteId
    const facturacion = await firstValueFrom(this.searchService.getDatosFacturacionByCliente(clientes.map(c => c.ClienteId)))
    for (const cliente of clientes) {
      const datos = Array.isArray(facturacion) ? facturacion.find((f: any) => f?.ClienteId == cliente.ClienteId) : null
      cliente.CUIT = datos?.CUIT ?? ''
      cliente.RazonSocial = datos?.ClienteDenominacion ?? ''
      cliente.Domicilio = datos?.Domicilio ?? ''
    }

    this.estadoMasivo.set({ clientes })
    setTimeout(() => { this.formEstadoMasivo().reset() }, 200)   // recién cargado = sin modificar
  }

  async save() {
    if (this.formEstadoMasivo().submitting() || !this.formEstadoMasivo().dirty() || !this.formEstadoMasivo().valid()) return

    await submit(this.formEstadoMasivo, async (form) => {
      try {
        await firstValueFrom(this.apiService.setEstado(form().value().clientes))
        this.estadoMasivoGuardado.emit()
        this.visible.set(false)
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors)
      }
      return undefined
    })
  }

  clearForm(): void {
    this.estadoMasivo.set(structuredClone(this.defaultEstadoMasivo))
    this.formEstadoMasivo().reset()
  }

  // Abierto → se cargan las custodias seleccionadas; cerrado → vacío
  private ultimo = ''
  private cargarSeleccion = effect(() => {
    const visible = this.visible()
    const custodias = this.custodias() ?? []
    const clave = visible ? custodias.map(c => c.id).join(',') : ''
    if (this.ultimo === clave) return
    this.ultimo = clave

    untracked(() => {
      if (visible && custodias.length) {
        this.load(custodias)
      } else {
        this.clearForm()
      }
    })
  })
}
