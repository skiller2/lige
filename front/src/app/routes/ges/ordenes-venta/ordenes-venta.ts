import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { AngularUtilService } from 'angular-slickgrid';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, TableOrdenVentaComponent],
  templateUrl: './ordenes-venta.html',
  styleUrl: './ordenes-venta.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {

  ordenesSeleccionadas = model<any[]>([])

  ordenSeleccionada = computed(() => this.ordenesSeleccionadas()?.length > 0 ? this.ordenesSeleccionadas()[0] : null)

  // TODO: pendiente de implementar
  altaOrdenVenta() { }

  bajaOrdenVenta() { }

  modificarOrdenVenta() { }

  consultaOrdenVenta() { }
}
