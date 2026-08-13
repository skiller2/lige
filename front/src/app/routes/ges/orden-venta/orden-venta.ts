import { Component, input } from '@angular/core'
import { SHARED_IMPORTS } from '@shared'

@Component({
  selector: 'app-orden-venta',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  templateUrl: './orden-venta.html',
  styleUrl: './orden-venta.less'
})
export class OrdenVentaComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)
}
