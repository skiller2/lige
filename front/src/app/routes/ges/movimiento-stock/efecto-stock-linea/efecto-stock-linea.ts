import { ChangeDetectionStrategy, Component, effect, inject, input, model, output, resource, signal, untracked } from '@angular/core';
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
 *
 * Flujo reactivo (todo declarativo, sin guardas anti-carrera manuales):
 *   EfectoId / EfectoIndividualId --> resource ubicaciones --> autoStockId (una sola ubicación, o el
 *                                                              depósito de la sucursal del destino con mayor stock)
 *   StockId (con mismo efecto)    --> autoCantidad         (cantidad = 1 si el stock es 1; si no, la limpia)
 *   EfectoId / EfectoIndividualId --> resource relaciones   (chips "Relacionado con")
 *   RelacionEfectoId              --> resource relacionUbicaciones --> autoselección si hay una sola
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
  readonly field = model.required<FieldTree<EfectoStockLinea>>();
  /** Descripción de la sucursal del destino, para autoseleccionar el depósito que coincide. */
  readonly sucursalDestino = input<string | null>(null);


  /** El bloque "Relacionado con" está visible. */
  readonly relacionAbierta = signal(false);

  // Guarda para autoCantidad: último (efecto, ubicación) visto. Distingue un cambio real de ubicación
  // (que recalcula la cantidad) de una precarga o un reuso del componente (que la respetan).
  private lastEfectoId: number | null | undefined = undefined;
  private lastStockId: number | null | undefined = undefined;

  // ---- Ubicaciones / relaciones del efecto principal -----------------------------------------
  // El individualId sale del propio form (no del buscador), así una línea precargada con su
  // EfectoIndividualId carga la ubicación correcta sin depender del evento del buscador.
  readonly ubicaciones = resource({
    params: () => ({ efectoId: this.field().EfectoId().value(), individualId: this.field().EfectoIndividualId().value() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoUbicaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  readonly relaciones = resource({
    params: () => ({ efectoId: this.field().EfectoId().value(), individualId: this.field().EfectoIndividualId().value() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoRelaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // ---- Ubicaciones del efecto relacionado ----------------------------------------------------
  readonly relacionUbicaciones = resource({
    params: () => ({ efectoId: this.field().RelacionEfectoId().value(), individualId: this.field().RelacionEfectoIndividualId().value() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoUbicaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // ---- Relaciones del efecto relacionado (chips "Relacionado con:" debajo de su input) --------
  readonly relacionRelaciones = resource({
    params: () => ({ efectoId: this.field().RelacionEfectoId().value(), individualId: this.field().RelacionEfectoIndividualId().value() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoRelaciones(params.efectoId, params.individualId))) ?? []
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
    if (lista.length === 0) return actual;   // todavía cargando -> no limpiar lo que ya hay
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

  // Cantidad automática al cambiar la UBICACIÓN (no el efecto): 1 si el stock es 1, si no la limpia.
  //  - Si cambió el efecto (o se reusó el componente / se precargó la línea) -> re-siembra la guarda
  //    sin tocar la cantidad, así respeta la cantidad precargada.
  //  - Si cambió solo la ubicación dentro del mismo efecto -> recalcula la cantidad.
  private readonly autoCantidad = effect(() => {
    const efectoId = this.field().EfectoId().value();
    const stockId = this.field().StockId().value();
    untracked(() => {
      if (this.lastEfectoId !== efectoId) {
        this.lastEfectoId = efectoId;
        this.lastStockId = stockId;
        return;
      }
      if (this.lastStockId === stockId) return;
      this.lastStockId = stockId;
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
    // Solo fija el individual y cierra la relación. La ubicación/cantidad las reajustan los effects
    // al recargar las ubicaciones del nuevo efecto (así no se pisan los valores precargados).
    this.field().EfectoIndividualId().value.set(ext?.EfectoEfectoIndividualId ?? null);
    this.cerrarRelacion();
  }

  relacionar(): void {
    this.relacionAbierta.set(true);
  }

  onRelacionEfectoExtended(ext: EfectoExtended): void {
    this.field().RelacionStockId().value.set(null);
    this.field().RelacionEfectoIndividualId().value.set(ext?.EfectoEfectoIndividualId ?? null);
  }

  private cerrarRelacion(): void {
    this.relacionAbierta.set(false);
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
