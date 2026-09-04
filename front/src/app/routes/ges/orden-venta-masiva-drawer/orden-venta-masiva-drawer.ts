import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';

// Órdenes de venta seleccionadas, agrupadas por cliente
interface ClienteOrdenes {
  ClienteId: number
  Cliente: string
  ordenes: any[]
}

@Component({
  selector: 'app-orden-venta-masiva-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './orden-venta-masiva-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaMasivaDrawerComponent {

  // Filas seleccionadas en la grilla de órdenes de venta
  ordenes = input<any[]>([])

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left'

  // La edición masiva es por cliente: se agrupan las órdenes seleccionadas por el suyo
  clientes = computed<ClienteOrdenes[]>(() => {
    const porCliente = new Map<number, ClienteOrdenes>()

    for (const orden of this.ordenes()) {
      const ClienteId = Number(orden?.ClienteId ?? 0)
      if (!porCliente.has(ClienteId))
        porCliente.set(ClienteId, {
          ClienteId,
          Cliente: String(orden?.Cliente ?? '').trim(),
          ordenes: []
        })

      porCliente.get(ClienteId)!.ordenes.push(orden)
    }

    return [...porCliente.values()]
  })
}
