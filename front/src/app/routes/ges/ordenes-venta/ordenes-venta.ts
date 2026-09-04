import { ChangeDetectionStrategy, Component, computed, inject, model, resource, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { firstValueFrom } from 'rxjs';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';
import { OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from '../../../services/api.service';

// Listado, o el detalle abierto en uno de sus tres modos
type ModoOrdenVenta = 'alta' | 'modificacion' | 'consulta' | null

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, CurrencyPipe, NzMenuModule, TableOrdenVentaComponent, OrdenVentaFormComponent,
    ObjetivoSearchComponent],
  templateUrl: './ordenes-venta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {

  private apiService = inject(ApiService)

  ordenesSeleccionadas = model<any[]>([])

  ordenSeleccionada = computed(() => this.ordenesSeleccionadas()?.length > 0 ? this.ordenesSeleccionadas()[0] : null)

  // Baja, modificación y consulta trabajan sobre la orden seleccionada en la grilla
  sinSeleccion = computed(() => this.ordenSeleccionada() == null)

  // Modo del detalle. En null la pantalla muestra el listado.
  modo = signal<ModoOrdenVenta>(null)

  detalleAbierto = computed(() => this.modo() != null)

  // La consulta abre el mismo detalle que la modificación, pero sin poder editarlo ni guardarlo
  soloLectura = computed(() => this.modo() === 'consulta')

  // En el alta el período y el objetivo los elige el usuario; en el resto los trae la fila
  enAlta = computed(() => this.modo() === 'alta')

  // Fila de la grilla sobre la que se abrió el detalle. En el alta todavía no hay ninguna.
  ordenAbierta = signal<any | null>(null)

  // Período y objetivo elegidos en el alta
  periodoAlta = signal<Date | null>(null)
  objetivoAlta = signal<any>(null)

  // Período y objetivo identifican a la orden, sea la de la fila o la que se está dando de alta
  objetivoId = computed(() =>
    Number((this.enAlta() ? this.objetivoAlta() : this.ordenAbierta()?.ObjetivoId) ?? 0))

  anio = computed(() =>
    this.enAlta() ? (this.periodoAlta()?.getFullYear() ?? 0) : Number(this.ordenAbierta()?.PeriodoAnio ?? 0))

  mes = computed(() => {
    if (!this.enAlta()) return Number(this.ordenAbierta()?.PeriodoMes ?? 0)
    const periodo = this.periodoAlta()
    return periodo ? periodo.getMonth() + 1 : 0
  })

  periodoCompleto = computed(() => this.objetivoId() > 0 && this.anio() > 0 && this.mes() > 0)

  // Cabecera del período (/api/orden-venta/cabecera). En el alta es la única forma de saber a qué
  // cliente/elemento dependiente pertenece el objetivo elegido, que es lo que el guardado valida.
  private cabeceraResource = resource({
    params: () => ({ objetivoId: this.objetivoId(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      if (!params.objetivoId || !params.anio || !params.mes) return null

      return await firstValueFrom(
        this.apiService.getOrdenVentaCabecera(params.objetivoId, params.anio, params.mes))
    },
    defaultValue: null as any
  })

  cabecera = computed<any>(() => this.cabeceraResource.value() ?? {})

  clienteId = computed(() => this.cabecera().ClienteId ?? this.ordenAbierta()?.ClienteId ?? null)

  clienteElementoDependienteId = computed(() =>
    this.cabecera().ClienteElementoDependienteId ?? this.ordenAbierta()?.ClienteElementoDependienteId ?? null)

  // Comprobantes de la orden, tal cual están en Comprobante. Se editan en el detalle.
  comprobantes = computed<any[]>(() => this.cabecera().Comprobantes ?? [])

  // En el alta el objetivo y el período elegidos pueden tener ya una orden: el guardado no la
  // duplica, la modifica, y hay que avisarlo antes de tocar el detalle
  ordenExistente = computed<number | null>(() =>
    this.enAlta() ? (this.cabecera().NroOrdenVenta ?? null) : null)

  // Ítems de la orden (/api/orden-venta/list), el mismo detalle que edita la carga de asistencia.
  // Sin orden del período vuelve inicializado con el del mes anterior.
  private itemsResource = resource({
    params: () => ({ objetivoId: this.objetivoId(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      if (!params.objetivoId || !params.anio || !params.mes) return []

      const response = await firstValueFrom(
        this.apiService.getListOrdenVenta(params.objetivoId, params.anio, params.mes))

      return response.list ?? []
    },
    defaultValue: [] as any[]
  })

  items = computed<any[]>(() => this.itemsResource.value() ?? [])

  // mm/aaaa, como se muestra el período en la carga de asistencia
  periodoTexto = computed(() => this.anio() ? `${String(this.mes()).padStart(2, '0')}/${this.anio()}` : '')

  // Detalle tal cual está en el formulario, con los ítems agregados o editados sin guardar
  detalle = signal<any[]>([])

  // Total Orden de Venta = Σ Importe Total de cada ítem
  importeTotal = computed(() =>
    this.detalle().reduce((total: number, item: any) => total + Number(item.ImporteTotal ?? 0), 0))

  // Sin cliente resuelto el guardado no tiene contra qué grabar la orden
  puedeGuardar = computed(() => this.periodoCompleto() && this.clienteId() != null)

  // Cambia al guardar: la fila de la grilla quedó vieja y hay que releer la lista
  refreshTick = signal(0)

  // El detalle arranca en blanco: el período y el objetivo se eligen en la misma pantalla, y con
  // ellos el backend inicializa los ítems con los del mes anterior
  altaOrdenVenta() {
    this.ordenAbierta.set(null)
    this.objetivoAlta.set(null)
    // Por omisión el período en curso, que es el que se factura
    this.periodoAlta.set(new Date())
    this.modo.set('alta')
  }

  // TODO: pendiente de implementar
  bajaOrdenVenta() { }

  modificarOrdenVenta() {
    this.abrirDetalle('modificacion')
  }

  consultaOrdenVenta() {
    this.abrirDetalle('consulta')
  }

  private abrirDetalle(modo: ModoOrdenVenta) {
    if (this.sinSeleccion()) return
    this.ordenAbierta.set(this.ordenSeleccionada())
    this.modo.set(modo)
  }

  // Guardado el detalle se sigue trabajando sobre él: se releen los ítems, que vuelven con su código,
  // y se marca la grilla para que al volver al listado muestre el importe total nuevo
  ordenVentaGuardada() {
    this.refreshTick.update(n => n + 1)

    // La orden ya existe: el alta pasa a ser una modificación, con el período y el objetivo fijos
    if (this.enAlta()) {
      this.ordenAbierta.set({
        ObjetivoId: this.objetivoId(),
        PeriodoAnio: this.anio(),
        PeriodoMes: this.mes(),
        ClienteId: this.clienteId(),
        ClienteElementoDependienteId: this.clienteElementoDependienteId()
      })
      this.modo.set('modificacion')
    }

    this.itemsResource.reload()
    this.cabeceraResource.reload()
  }

  volverAlListado() {
    this.modo.set(null)
    this.ordenAbierta.set(null)
  }
}
