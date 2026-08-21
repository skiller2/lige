import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { OrdenVentaComponent } from '../orden-venta/orden-venta';

@Component({
  selector: 'app-orden-venta-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, OrdenVentaComponent],
  templateUrl: './orden-venta-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaDrawerComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)
  horasAFacturarA = input<number>(0)
  horasAFacturarABloqueada = input<boolean>(false)

  guardado = output<number | null>()

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'right';

  objetivoNombre = signal<string>('')
  titulo = computed(() => {
    const nombre = this.objetivoNombre()
    return nombre ? ` ${nombre}` : 'Órdenes de Venta'
  })
}
