import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';
import { OrdenesVentaFormComponent } from '../ordenes-venta-form/ordenes-venta-form';
import { ApiService } from '../../../services/api.service';

// La solapa es el modo: 'listado' muestra la grilla, el resto abre el formulario de cabecera
const TAB_LISTADO = 'listado'

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, TableOrdenVentaComponent, OrdenesVentaFormComponent],
  templateUrl: './ordenes-venta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {

  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private apiService = inject(ApiService)

  ordenesSeleccionadas = model<any[]>([])

  ordenSeleccionada = computed(() => this.ordenesSeleccionadas()?.length > 0 ? this.ordenesSeleccionadas()[0] : null)

  // 'listado' | 'consulta' | 'modificacion' | 'alta'
  activeTab = toSignal(
    this.route.params.pipe(map(({ tab }) => tab || TAB_LISTADO)),
    { initialValue: TAB_LISTADO }
  )

  // La grilla no se destruye al abrir el formulario: queda oculta para no perder filtros ni selección
  enListado = computed(() => this.activeTab() === TAB_LISTADO)

  sinSeleccion = computed(() => this.ordenSeleccionada() == null)

  refreshTick = signal(0)

  // La solapa es el modo; la orden seleccionada viaja por señal
  private abrirFormulario(modo: string) {
    this.router.navigate(['/', 'ges', 'ordenes-venta', modo])
  }

  // Guardada la modificación, la fila de la grilla quedó vieja: se recarga y se vuelve al listado
  ordenVentaGuardada() {
    this.refreshTick.update(n => n + 1)
    this.router.navigate(['/', 'ges', 'ordenes-venta', TAB_LISTADO])
  }

  // TODO: pendiente de implementar
  altaOrdenVenta() { }

  // La confirmación la pide el nz-popconfirm del botón, igual que en la botonera de novedades
  async bajaOrdenVenta() {
    const orden = this.ordenSeleccionada()
    if (!orden) return

    await firstValueFrom(this.apiService.deleteOrdenVenta(orden.NroOrdenVenta))

    // La orden ya no existe: se suelta la selección, se recarga la grilla y se vuelve al listado
    this.ordenesSeleccionadas.set([])
    this.refreshTick.update(n => n + 1)
    this.router.navigate(['/', 'ges', 'ordenes-venta', TAB_LISTADO])
  }

  modificarOrdenVenta() {
    if (this.sinSeleccion()) return
    this.abrirFormulario('modificacion')
  }

  consultaOrdenVenta() {
    if (this.sinSeleccion()) return
    this.abrirFormulario('consulta')
  }
}
