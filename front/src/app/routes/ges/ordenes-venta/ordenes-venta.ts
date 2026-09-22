import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { Router } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';
import { OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { OrdenVentaMasivaDrawerComponent } from '../orden-venta-masiva-drawer/orden-venta-masiva-drawer';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, NzMenuModule, TableOrdenVentaComponent, OrdenVentaFormComponent,
    ObjetivoSearchComponent, OrdenVentaMasivaDrawerComponent],
  templateUrl: './ordenes-venta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  public router = inject(Router)

  ordenesSeleccionadas = model<any[]>([])
  soloLectura = computed(() => this.router.isActive('/ges/ordenes-venta/consulta',{}) )
  masivaVisible = signal(false)

  // Ítems de la orden (/api/orden-venta/list), el mismo detalle que edita la carga de asistencia.
  // Sin orden del período vuelve inicializado con el del mes anterior.

  // Cambia al guardar: la fila de la grilla quedó vieja y hay que releer la lista
  refreshTick = signal(0)

  // Auditoría de la cabecera (alta / última modificación), igual que en el detalle de movimientos de efectos

  // Anular: las órdenes tildadas en la grilla pasan a estado cancelado. El detalle y los
  // comprobantes quedan como están, sólo cambia el estado.
  async bajaOrdenVenta() {
    if (this.ordenesSeleccionadas() && this.ordenesSeleccionadas().length!=1) return

    try {
      await firstValueFrom(this.apiService.anularOrdenesVenta(this.ordenesSeleccionadas()))
      // La selección quedó con el estado viejo y la grilla hay que releerla
      this.ordenesSeleccionadas.set([])
      this.refreshTick.update(n => n + 1)
    } finally {
    }
  }

  // Edición masiva de las órdenes seleccionadas, agrupadas por cliente
  edicionMasiva() {
    if (this.ordenesSeleccionadas() && this.ordenesSeleccionadas().length<1) return
    this.masivaVisible.set(true)
  }

  // Anular pide confirmación: la solapa es la que abre el cartel

  // Guardado el detalle se sigue trabajando sobre él: se releen los ítems, que vuelven con su código,
  // y se marca la grilla para que al volver al listado muestre el importe total nuevo
  ordenVentaGuardada() {
    this.refreshTick.update(n => n + 1)
  }

}
