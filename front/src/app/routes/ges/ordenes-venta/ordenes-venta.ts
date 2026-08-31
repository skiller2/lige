import { ChangeDetectionStrategy, Component, computed, inject, model, resource, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { firstValueFrom } from 'rxjs';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';
import { OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from '../../../services/api.service';

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

  // Orden abierta. Con una abierta la pantalla muestra su detalle en vez del listado.
  ordenAbierta = signal<any | null>(null)

  // La consulta abre el mismo detalle que la modificación, pero sin poder editarlo ni guardarlo
  soloLectura = signal(false)

  // Período y objetivo identifican a la orden: se muestran, pero no se editan en ningún modo
  objetivoId = computed(() => Number(this.ordenAbierta()?.ObjetivoId ?? 0))
  anio = computed(() => Number(this.ordenAbierta()?.PeriodoAnio ?? 0))
  mes = computed(() => Number(this.ordenAbierta()?.PeriodoMes ?? 0))
  clienteId = computed(() => this.ordenAbierta()?.ClienteId ?? null)
  clienteElementoDependienteId = computed(() => this.ordenAbierta()?.ClienteElementoDependienteId ?? null)

  // Ítems de la orden (/api/orden-venta/list), el mismo detalle que edita la carga de asistencia
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

  // Cambia al guardar: la fila de la grilla quedó vieja y hay que releer la lista
  refreshTick = signal(0)

  // TODO: pendiente de implementar
  altaOrdenVenta() { }

  // TODO: pendiente de implementar
  bajaOrdenVenta() { }

  modificarOrdenVenta() {
    this.abrirDetalle(false)
  }

  consultaOrdenVenta() {
    this.abrirDetalle(true)
  }

  private abrirDetalle(soloLectura: boolean) {
    if (this.sinSeleccion()) return
    this.soloLectura.set(soloLectura)
    this.ordenAbierta.set(this.ordenSeleccionada())
  }

  // Guardado el detalle se sigue trabajando sobre él: se releen los ítems, que vuelven con su código,
  // y se marca la grilla para que al volver al listado muestre el importe total nuevo
  ordenVentaGuardada() {
    this.refreshTick.update(n => n + 1)
    this.itemsResource.reload()
  }

  volverAlListado() {
    this.ordenAbierta.set(null)
  }
}
