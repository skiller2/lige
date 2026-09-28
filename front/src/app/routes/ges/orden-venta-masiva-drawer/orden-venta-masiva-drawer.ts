import { ChangeDetectionStrategy, Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { applyEach, form, FormField, required, submit } from '@angular/forms/signals';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

/**
 * Un cliente con las órdenes seleccionadas que le pertenecen. Lo arma el back agrupando la
 * selección: los datos del cliente y de sus órdenes son de consulta, y lo que se edita (estado
 * y comprobante nuevo) se aplica a todas sus órdenes.
 */
export interface ClienteMasivo {
  ClienteId: number
  Cliente: string
  CUIT: string
  Domicilio: string
  NroOrdenVentas: number[]
  // Un cliente puede tener seleccionadas órdenes de más de un objetivo
  Objetivos: string[]
  Cantidad: number
  ImporteTotalOrdenes: number
  // Editables
  EstadoOrdenVentaCodigo: string
  ComprobanteTipoCodigo: string
  ComprobanteNro: string
  ImporteTotal: string
}

/**
 * Un comprobante que tiene todas sus órdenes dentro de la selección. Los *Original identifican
 * sus filas en el back (el tipo y el número se pueden cambiar) y sirven para saber si se editó.
 */
export interface ComprobanteMasivo {
  ComprobanteTipoCodigoOriginal: string
  ComprobanteNroOriginal: string
  ImporteTotalOriginal: number | null
  // Editables
  ComprobanteTipoCodigo: string
  ComprobanteNro: string
  ImporteTotal: string
}

export interface OrdenVentaMasivaForm {
  clientes: ClienteMasivo[]
  comprobantes: ComprobanteMasivo[]
}

/**
 * Edición masiva de las órdenes de venta seleccionadas en la grilla. Sigue el contrato de
 * formularios del CLAUDE.md (modelo: orden-venta-form):
 * - load(ordenes): trae del back el modelo ya agrupado por cliente.
 * - save(): submit() del formulario; los errores del back vuelven por campo (fieldErrors).
 * - clearForm(): vuelve el modelo a sus valores por defecto (vacío).
 * - Un effect decide qué hacer según las entradas: drawer visible → load, cerrado → vacío.
 */
@Component({
  selector: 'app-orden-venta-masiva-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, CurrencyPipe, JsonPipe, FormField],
  templateUrl: './orden-venta-masiva-drawer.html',
  styleUrl: './orden-venta-masiva-drawer.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaMasivaDrawerComponent {

  // NroOrdenVenta de las filas seleccionadas en la grilla
  ordenes = input<number[]>([])
  visible = model<boolean>(false)

  // Emite al guardar: la grilla quedó vieja y hay que releerla
  ordenVentaMasivaGuardada = output<void>()

  placement: NzDrawerPlacement = 'left'

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)

  optionsEstado = toSignal(this.searchService.getEstadoOrdenVenta(), { initialValue: [] as any[] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] as any[] })

  private readonly defaultOrdenVentaMasiva: OrdenVentaMasivaForm = { clientes: [], comprobantes: [] }

  readonly ordenVentaMasiva = signal<OrdenVentaMasivaForm>(this.defaultOrdenVentaMasiva)

  readonly formOrdenVentaMasiva = form(this.ordenVentaMasiva, (p) => {
    // Comprobante nuevo del cliente: tipo y número van juntos o ninguno. El resto (importe,
    // Facturado obliga a cargarlo) lo valida el back y vuelve marcado en el campo (fieldErrors)
    applyEach(p.clientes, (clientePath) => {
      required(clientePath.ComprobanteTipoCodigo, { message: 'Código comprobante requerido', when: (ctx) => ctx.valueOf(clientePath.ComprobanteNro) != "" });
      required(clientePath.ComprobanteNro, { message: 'Número de comprobante requerido', when: (ctx) => ctx.valueOf(clientePath.ComprobanteTipoCodigo) != "" });
    });
    // Comprobantes editados: misma regla
    applyEach(p.comprobantes, (comprobantePath) => {
      required(comprobantePath.ComprobanteTipoCodigo, { message: 'Código comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteNro) != "" });
      required(comprobantePath.ComprobanteNro, { message: 'Número de comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) != "" });
    });
  })

  async load(ordenes: number[]) {
    const datos = await firstValueFrom(this.searchService.getOrdenVentaMasiva(ordenes))
    this.ordenVentaMasiva.update(m => ({ ...m, ...datos }))
    setTimeout(() => { this.formOrdenVentaMasiva().reset() }, 200)   // recién cargado = sin modificar
  }

  async save() {
    if (this.formOrdenVentaMasiva().submitting() || this.formOrdenVentaMasiva().dirty() == false
      || this.formOrdenVentaMasiva().valid() == false) return undefined

    await submit(this.formOrdenVentaMasiva, async (form) => {
      try {
        const formValue = form().value();
        await firstValueFrom(this.apiService.setOrdenVentaMasiva(formValue))
        this.ordenVentaMasivaGuardada.emit()
        this.visible.set(false)
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      return undefined

    })
  }

  clearForm(): void {
    this.ordenVentaMasiva.set(structuredClone(this.defaultOrdenVentaMasiva))
    this.formOrdenVentaMasiva().reset()
  }

  // Las entradas deciden qué mostrar: abierto → se cargan las órdenes seleccionadas; cerrado →
  // vacío. Se compara con lo último procesado para actuar solo cuando algo cambió de verdad.
  private ultimo = ''
  private effecto = effect(() => {
    const visible = this.visible()
    const ordenes = this.ordenes() ?? []
    const clave = visible ? ordenes.join(',') : ''
    if (this.ultimo === clave) return
    this.ultimo = clave

    untracked(() => {
      if (visible && ordenes.length) {
        this.load(ordenes)
      } else {
        this.clearForm()
      }
    })
  })
}
