import { Component, computed, inject, input, model, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';

// Drawer de solo lectura con el detalle de efectos (MovimientoStockDetalle) de un movimiento.
@Component({
  selector: 'app-table-movimientos-efecto-detalle',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
  ],
  templateUrl: './table-movimientos-efecto-detalle.html',
  standalone: true
})
export class TableMovimientosEfectoDetalleComponent {

  movimientoStockCodigo = input<number | null>(null);
  visible = model<boolean>(false);

  private searchService = inject(SearchService);

  data = resource({
    params: () => ({ codigo: this.movimientoStockCodigo(), visible: this.visible() }),
    loader: async ({ params }) => {
      // Solo pedimos al backend cuando el drawer está abierto y hay un movimiento seleccionado.
      if (!params.visible || !params.codigo) return { cabecera: null, detalle: [] };
      const response = await firstValueFrom(this.searchService.getEfectoMovimientoDetalle(params.codigo));
      return response ?? { cabecera: null, detalle: [] };
    },
    defaultValue: { cabecera: null, detalle: [] }
  });

  cabecera = computed(() => this.data.value()?.cabecera ?? null);
  filas = computed(() => this.data.value()?.detalle ?? []);

  esIngresoStock = computed(() => {
    const ind = (this.cabecera() as any)?.IndIngresoStock;
    return ind === true || ind === 1 || ind === '1';
  });

  titulo = computed(() => {
    const codigo = this.movimientoStockCodigo();
    return codigo ? `Detalle de Efectos código: ${codigo}` : 'Detalle de Efectos';
  });

  // Total de Cantidad del detalle; debe coincidir con CantidadEfectos de la grilla.
  cantidadTotal = computed(() =>
    this.filas().reduce((acc: number, it: any) => acc + (Number(it.Cantidad) || 0), 0)
  );

  close(): void {
    this.visible.set(false);
  }
}
