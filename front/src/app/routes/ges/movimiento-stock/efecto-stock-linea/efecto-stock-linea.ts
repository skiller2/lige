import { ChangeDetectionStrategy, Component, effect, inject, input, output, resource, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EfectoUbicacion, SearchService } from '../../../../services/search.service';
import { EfectoSearchComponent } from '../../../../shared/efecto-search/efecto-search';
import { EfectoStockLinea } from '../movimiento-stock.types';

type EfectoExtended = { EfectoId?: number; EfectoEfectoIndividualId?: number | null } | null | undefined;
type UbicacionGrupo = { tipo: string; label: string; items: EfectoUbicacion[] };

/**
 * Flujo reactivo (todo declarativo, sin guardas anti-carrera manuales):
 *   EfectoId / individualId  --> resource ubicaciones  --> autoStockId (una sola ubicación, o el
 *                                                          depósito de la sucursal del destino con mayor stock)
 *   StockId                  --> autoCantidad          (cantidad = 1 si el stock es 1; si no, la limpia)
 *   EfectoId / individualId  --> resource relaciones    (chips "Relacionado con")
 *   RelacionEfectoId         --> resource relacionUbicaciones --> autoselección si hay una sola
 */
@Component({
  selector: 'app-efecto-stock-linea',
  imports: [...SHARED_IMPORTS, CommonModule, FormField, EfectoSearchComponent],
  templateUrl: './efecto-stock-linea.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EfectoStockLineaComponent {
  private search = inject(SearchService);

  /** Sub-form de esta línea (lo provee el `form()` del padre vía applyEach). */
  readonly field = input.required<FieldTree<EfectoStockLinea>>();
  readonly esUltima = input(false);
  readonly puedeEliminar = input(false);
  /** Descripción de la sucursal del destino, para autoseleccionar el depósito que coincide. */
  readonly sucursalDestino = input<string | null>(null);

  readonly agregar = output<void>();
  readonly eliminar = output<void>();

  /** EfectoIndividualId del efecto elegido (lo emite el buscador, no viene del id). */
  private readonly individualId = signal<number | null>(null);
  private readonly relacionIndividualId = signal<number | null>(null);

  /** El bloque "Relacionado con" está visible. */
  readonly relacionAbierta = signal(false);

  // ---- Ubicaciones / relaciones del efecto principal -----------------------------------------
  readonly ubicaciones = resource({
    params: () => ({ efectoId: this.field().EfectoId().value(), individualId: this.individualId() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoUbicaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  readonly relaciones = resource({
    params: () => ({ efectoId: this.field().EfectoId().value(), individualId: this.individualId() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoRelaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // ---- Ubicaciones del efecto relacionado ----------------------------------------------------
  readonly relacionUbicaciones = resource({
    params: () => ({ efectoId: this.field().RelacionEfectoId().value(), individualId: this.relacionIndividualId() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoUbicaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // Autoselección de ubicación al (re)cargar las ubicaciones. Lee StockId sin trackearlo, así solo
  // corre cuando cambia la lista (no cuando el usuario elige a mano).
  private readonly autoStockId = effect(() => {
    const lista = this.ubicaciones.value() ?? [];
    this.sucursalDestino(); // reacciona también si cambia la sucursal del destino
    untracked(() => {
      const stock = this.field().StockId();
      const target = this.resolverStockId(lista, stock.value());
      if (stock.value() !== target) stock.value.set(target);
    });
  });

  /**
   * Qué ubicación debe quedar seleccionada:
   *  - una sola ubicación -> esa;
   *  - si la elegida sigue disponible -> se respeta;
   *  - si no, entre los depósitos de la misma sucursal del destino -> el de mayor stock;
   *  - en cualquier otro caso -> sin selección.
   */
  private resolverStockId(lista: EfectoUbicacion[], actual: number | null): number | null {
    if (lista.length === 0) return null;
    if (lista.length === 1) return lista[0].StockId;
    if (actual != null && lista.some(u => Number(u.StockId) === Number(actual))) return actual;

    const sucursal = (this.sucursalDestino() ?? '').trim().toLowerCase();
    if (!sucursal) return null;
    const candidatos = lista.filter(u =>
      u.Tipo === 'deposito' && (u.SucursalDescripcion ?? '').trim().toLowerCase() === sucursal
    );
    if (!candidatos.length) return null;
    return candidatos.reduce((mejor, u) => Number(u.StockStock ?? 0) > Number(mejor.StockStock ?? 0) ? u : mejor).StockId;
  }

  // Al cambiar la ubicación (solo entonces): cantidad = 1 si el stock es 1; en otro caso la limpia.
  // Depende solo de StockId, así una recarga de ubicaciones no pisa lo que escribió el usuario.
  private readonly autoCantidad = effect(() => {
    const stockId = this.field().StockId().value();
    untracked(() => {
      const u = (this.ubicaciones.value() ?? []).find(x => Number(x.StockId) === Number(stockId));
      const disponible = u?.StockStock != null ? Number(u.StockStock) : null;
      this.field().Cantidad().value.set(stockId != null && disponible === 1 ? 1 : null);
    });
  });

  // Autoselección de ubicación del efecto relacionado cuando hay una sola.
  private readonly autoRelacionStockId = effect(() => {
    const lista = this.relacionUbicaciones.value() ?? [];
    const stock = this.field().RelacionStockId();
    if (lista.length === 1 && stock.value() !== lista[0].StockId) stock.value.set(lista[0].StockId);
  });

  onEfectoExtended(ext: EfectoExtended): void {
    const individualId = ext?.EfectoEfectoIndividualId ?? null;
    this.individualId.set(individualId);
    this.field().EfectoIndividualId().value.set(individualId);
    this.field().StockId().value.set(null);
    this.field().Cantidad().value.set(null);
    this.cerrarRelacion(); // al cambiar el efecto, oculta y limpia la relación
  }

  relacionar(): void {
    this.relacionAbierta.set(true);
  }

  onRelacionEfectoExtended(ext: EfectoExtended): void {
    const individualId = ext?.EfectoEfectoIndividualId ?? null;
    this.relacionIndividualId.set(individualId);
    this.field().RelacionStockId().value.set(null);
    this.field().RelacionEfectoIndividualId().value.set(individualId);
  }

  private cerrarRelacion(): void {
    this.relacionAbierta.set(false);
    this.relacionIndividualId.set(null);
    this.field().RelacionEfectoId().value.set(null);
    this.field().RelacionStockId().value.set(null);
    this.field().RelacionEfectoIndividualId().value.set(null);
  }

  /** Agrupa las ubicaciones por tipo (depósito / personal / objetivo / proveedor) para el <nz-select>. */
  agrupar(lista: EfectoUbicacion[]): UbicacionGrupo[] {
    const grupos: Record<string, UbicacionGrupo> = {
      deposito:  { tipo: 'deposito',  label: 'Depósito',  items: [] },
      personal:  { tipo: 'personal',  label: 'Personal',  items: [] },
      objetivo:  { tipo: 'objetivo',  label: 'Objetivo',  items: [] },
      proveedor: { tipo: 'proveedor', label: 'Proveedor', items: [] },
    };
    for (const u of lista) grupos[u.Tipo]?.items.push(u);
    return Object.values(grupos).filter(g => g.items.length > 0);
  }

  ubicacionLabel(u: EfectoUbicacion): string {
    const stock = u.StockStock != null ? ` (Stock: ${u.StockStock})` : '';
    switch (u.Tipo) {
      case 'personal':  return `${u.PersonalApellidoNombre ?? u.PersonalId}${stock}`;
      case 'objetivo':  return `${u.ObjetivoDescripcion ?? u.ObjetivoId}${stock}`;
      case 'proveedor': return `${u.ProveedorRazonSocial ?? u.ProveedorId}${stock}`;
      case 'deposito':  return `${u.DepositoNombre ?? u.DepositoId}${stock}`;
      default: return String(u.StockId);
    }
  }
}
