import { Component, computed, inject, input, model, resource, signal } from '@angular/core';
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

  // Auditoría de cabecera (alta / última modificación).
  auditoria = signal<any>(null);
  auditoriaCargando = signal<boolean>(false);

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
    return codigo ? `Detalle del Movimiento de Stock (Código: ${codigo})` : 'Detalle del Movimiento de Stock';
  });

  // Total de Cantidad del detalle; debe coincidir con CantidadEfectos de la grilla.
  cantidadTotal = computed(() =>
    this.filas().reduce((acc: number, it: any) => acc + (Number(it.Cantidad) || 0), 0)
  );

  // Se arma como filas para reutilizar el patrón de nz-table del popover de legajo.
  auditoriaFilas = computed(() => {
    const a = this.auditoria();
    if (!a) return [];
    return [
      { Evento: 'Alta', Usuario: a.AudUsuarioIng, Fecha: a.AudFechaIng, Ip: a.AudIpIng },
      { Evento: 'Última modificación', Usuario: a.AudUsuarioMod, Fecha: a.AudFechaMod, Ip: a.AudIpMod }
    ];
  });

  async loadAuditoria(): Promise<void> {
    const codigo = this.movimientoStockCodigo();
    if (!codigo) return;
    this.auditoriaCargando.set(true);
    try {
      this.auditoria.set(await firstValueFrom(this.searchService.getMovimientoAuditoria(codigo)));
    } finally {
      this.auditoriaCargando.set(false);
    }
  }

  close(): void {
    // Se limpia para que al abrir otro movimiento no se vea la auditoría del anterior.
    this.auditoria.set(null);
    this.visible.set(false);
  }
}
