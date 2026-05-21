import { ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { EfectoUbicacion, SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { TipoDestinoSearchComponent } from '../../../shared/tipo-destino-search/tipo-destino-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ProveedorSearchComponent } from '../../../shared/proveedor-search/proveedor-search.component';
import { EfectoSearchComponent } from '../../../shared/efecto-search/efecto-search';

export interface EfectoStockLinea {
  EfectoId: number | null;
  Cantidad: number | null;
  UbicacionStockId: number | null;
}

export interface ParametroformEfectoStock {
  fecha: Date | null;
  tipoDestino: string;
  depositoId: number | null;
  personalId: number | null;
  objetivoId: string | null;
  proveedorId: number | null;
  efectos: EfectoStockLinea[];
}

@Component({
  selector: 'app-efecto-stock',
  imports: [...SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, TipoDestinoSearchComponent, ObjetivoSearchComponent, ProveedorSearchComponent, EfectoSearchComponent],
  templateUrl: './efecto-stock.html',
  styleUrl: './efecto-stock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EfectoStockComponent {
  private searchService = inject(SearchService);
  private apiService = inject(ApiService);

  private readonly objEfectoLinea: EfectoStockLinea = { EfectoId: null, Cantidad: null, UbicacionStockId: null };

  private readonly defaultStockForm: ParametroformEfectoStock = {
    fecha: null,
    tipoDestino: '',
    depositoId: null,
    personalId: null,
    objetivoId: null,
    proveedorId: null,
    efectos: [structuredClone(this.objEfectoLinea)],
  };

  readonly parametroStock = signal<ParametroformEfectoStock>(this.defaultStockForm);

  ngOnInit() {
    queueMicrotask(() => {  
        this.parametroStock.update(s => ({ ...s, fecha: new Date() }));
    });
  }

  readonly formEfectoStock = form(this.parametroStock, (p) => {
    // Schema vacío por ahora — necesario para que las bindings [formField] inicialicen bien.
  });

  tipoDestinoSeleccionado = computed(() => this.parametroStock().tipoDestino);

  anio = computed(() => this.parametroStock().fecha?.getFullYear() ?? new Date().getFullYear());
  mes = computed(() => (this.parametroStock().fecha?.getMonth() ?? new Date().getMonth()) + 1);

  depositos = resource({
    params: () => ({ tipo: this.tipoDestinoSeleccionado() }),
    loader: async ({ params }) => {
      if (params.tipo !== 'deposito') return [];
      return await firstValueFrom(this.searchService.getDepositos());
    },
  });

  proveedores = resource({
    params: () => ({ tipo: this.tipoDestinoSeleccionado() }),
    loader: async ({ params }) => {
      if (params.tipo !== 'proveedor') return [];
      return await firstValueFrom(this.searchService.getStockEfectoProveedores());
    },
  });

  personaInfo = resource({
    params: () => ({
      personalId: this.parametroStock().personalId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      if (!params.personalId) return null;
      return await firstValueFrom(
        this.searchService.getStockEfectoPersonaInfo(params.personalId, params.anio, params.mes)
      );
    },
  });

  personaSitRevista = resource({
    params: () => ({
      personalId: this.parametroStock().personalId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      if (!params.personalId) return [];
      return await firstValueFrom(
        this.apiService.getPersonaSitRevista(params.personalId, params.anio, params.mes)
      );
    },
  });

  objetivoInfo = resource({
    params: () => ({
      objetivoId: this.parametroStock().objetivoId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      if (!id) return null;
      return await firstValueFrom(
        this.searchService.getStockEfectoObjetivoInfo(id, params.anio, params.mes)
      );
    },
  });

  objetivoContratos = resource({
    params: () => ({
      objetivoId: this.parametroStock().objetivoId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      if (!id) return [];
      return await firstValueFrom(
        this.searchService.getObjetivoContratos(id, params.anio, params.mes)
      );
    },
  });

  readonly relacionesByEfectoId = signal<Map<number, { EfectoRelacionadoId: number; EfectoRelacionadoDescripcion: string }[]>>(new Map());

  private cargandoRelaciones = new Set<number>();

  private relacionesEffect = effect(() => {
    const ids = this.parametroStock().efectos
      .map(e => e.EfectoId)
      .filter((id): id is number => !!id);
    const cache = this.relacionesByEfectoId();
    for (const id of ids) {
      if (cache.has(id) || this.cargandoRelaciones.has(id)) continue;
      this.cargandoRelaciones.add(id);
      firstValueFrom(this.searchService.getEfectoRelaciones(id)).then(rels => {
        this.cargandoRelaciones.delete(id);
        this.relacionesByEfectoId.update(m => {
          const next = new Map(m);
          next.set(id, rels ?? []);
          return next;
        });
      });
    }
  });

  relacionesDe(efectoId: number | null | undefined): { EfectoRelacionadoId: number; EfectoRelacionadoDescripcion: string }[] {
    if (!efectoId) return [];
    return this.relacionesByEfectoId().get(efectoId) ?? [];
  }

  readonly ubicacionesByEfectoId = signal<Map<number, EfectoUbicacion[]>>(new Map());
  private cargandoUbicaciones = new Set<number>();

  private ubicacionesEffect = effect(() => {
    const ids = this.parametroStock().efectos
      .map(e => e.EfectoId)
      .filter((id): id is number => !!id);
    const cache = this.ubicacionesByEfectoId();
    for (const id of ids) {
      if (cache.has(id) || this.cargandoUbicaciones.has(id)) continue;
      this.cargandoUbicaciones.add(id);
      firstValueFrom(this.searchService.getEfectoUbicaciones(id)).then(ubs => {
        this.cargandoUbicaciones.delete(id);
        this.ubicacionesByEfectoId.update(m => {
          const next = new Map(m);
          next.set(id, ubs ?? []);
          return next;
        });
      });
    }
  });

  ubicacionesAgrupadas(efectoId: number | null | undefined): { tipo: string; label: string; items: EfectoUbicacion[] }[] {
    if (!efectoId) return [];
    const all = this.ubicacionesByEfectoId().get(efectoId) ?? [];
    const grupos: Record<string, { tipo: string; label: string; items: EfectoUbicacion[] }> = {
      personal:  { tipo: 'personal',  label: 'Personal',  items: [] },
      objetivo:  { tipo: 'objetivo',  label: 'Objetivo',  items: [] },
      proveedor: { tipo: 'proveedor', label: 'Proveedor', items: [] },
      deposito:  { tipo: 'deposito',  label: 'Depósito',  items: [] },
    };
    for (const u of all) {
      const g = grupos[u.Tipo];
      if (g) g.items.push(u);
    }
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

  addEfecto(e?: MouseEvent): void {
    e?.preventDefault();
    this.parametroStock.update(s => ({
      ...s,
      efectos: [...s.efectos, structuredClone(this.objEfectoLinea)],
    }));
  }

  removeEfecto(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroStock.update(s => ({
      ...s,
      efectos: s.efectos.filter((_, i) => i !== index),
    }));
    if (this.parametroStock().efectos.length === 0) {
      this.addEfecto();
    }
  }

  sucursalDescripcionDisplay = computed(() => {
    const tipo = this.tipoDestinoSeleccionado();
    if (tipo === 'personal') return this.personaInfo.value()?.SucursalDescripcion ?? null;
    if (tipo === 'objetivo') return this.objetivoInfo.value()?.SucursalDescripcion ?? null;
    if (tipo === 'deposito') {
      const id = this.parametroStock().depositoId;
      const dep = (this.depositos.value() ?? []).find((d: any) => d.DepositoId === id);
      return dep?.DepositoSucursalDescripcion ?? null;
    }
    if (tipo === 'proveedor') {
      const id = this.parametroStock().proveedorId;
      const pro = (this.proveedores.value() ?? []).find((p: any) => p.ProveedorId === id);
      return pro?.ProveedorSucursalDescripcion ?? null;
    }
    return null;
  });
}

