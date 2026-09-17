import { ChangeDetectionStrategy, Component, computed, input, model, output, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { OrdenVentaDetalleComponent } from '../orden-venta-detalle/orden-venta-detalle';
import { HorasAFacturar } from '../orden-venta-form/orden-venta-form';

@Component({
  selector: 'app-orden-venta-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, OrdenVentaDetalleComponent],
  templateUrl: './orden-venta-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaDrawerComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)
  horasAFacturarA = input<number>(0)
  horasAFacturarB = input<number>(0)
  horasAFacturarABloqueada = input<boolean>(false)
  horasAFacturarBBloqueada = input<boolean>(false)

  guardado = output<HorasAFacturar>()

  horasAFacturarChange = output<HorasAFacturar>()

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'right';

  private detalle = viewChild(OrdenVentaDetalleComponent)

  objetivoNombre = signal<string>('')
  titulo = computed(() => {
    const nombre = this.objetivoNombre()
    return nombre ? ` ${nombre}` : 'Órdenes de Venta'
  })

  // No hay botón de guardar: al cerrar se graba lo pendiente. Si no se pudo grabar (detalle
  // incompleto o error) el drawer queda abierto con los errores a la vista.
  async cerrar() {
    const detalle = this.detalle()
    if (detalle && !(await detalle.guardarAlCerrar())) return
    this.visible.set(false)
  }
}
