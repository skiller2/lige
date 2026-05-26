import { ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { EfectoUbicacion, SearchService } from '../../../services/search.service';
import { EfectoRelacionEfecto } from '../../../shared/schemas/efecto.schemas';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { TipoDestinoSearchComponent } from '../../../shared/tipo-destino-search/tipo-destino-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ProveedorSearchComponent } from '../../../shared/proveedor-search/proveedor-search.component';
import { EfectoSearchComponent } from '../../../shared/efecto-search/efecto-search';
import { ViewResponsableComponent } from '../../../shared/view-responsable/view-responsable.component';

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
  imports: [...SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, TipoDestinoSearchComponent, ObjetivoSearchComponent, ProveedorSearchComponent, EfectoSearchComponent, ViewResponsableComponent],
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

  personaResponsables = resource({
    params: () => ({
      personalId: this.parametroStock().personalId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      if (!params.personalId) return [];
      return await firstValueFrom(
        this.apiService.getPersonaResponsables(params.personalId, params.anio, params.mes)
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

  objetivoResponsables = resource({
    params: () => ({
      objetivoId: this.parametroStock().objetivoId,
      anio: this.anio(),
      mes: this.mes(),
    }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      if (!id) return [];
      return await firstValueFrom(
        this.searchService.getObjetivoResponsables(id, params.anio, params.mes)
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

  readonly individualByIndex = signal<Map<number, number | null>>(new Map());
  readonly debugExtended = signal<{ last: any } | null>(null);

  onEfectoExtended(index: number, ext: { EfectoId?: number; EfectoEfectoIndividualId?: number | null } | null | undefined): void {
    const individualId = ext?.EfectoEfectoIndividualId ?? null;
    this.individualByIndex.update(m => {
      const next = new Map(m);
      next.set(index, individualId);
      return next;
    });
    this.parametroStock.update(s => ({
      ...s,
      efectos: s.efectos.map((e, i) => i === index ? { ...e, UbicacionStockId: null } : e),
    }));
    this.debugExtended.set({ last: { index, ext } });
  }

  readonly relacionesByIndex = signal<Map<number, EfectoRelacionEfecto[]>>(new Map());

  private relacionesEffect = effect(() => {
    const individuales = this.individualByIndex();
    const efectos = this.parametroStock().efectos;
    efectos.forEach((e, i) => {
      const efectoId = e.EfectoId;
      if (!efectoId) return;
      const individualId = individuales.get(i) ?? null;
      firstValueFrom(this.searchService.getEfectoRelaciones(efectoId, individualId)).then(rels => {
        this.relacionesByIndex.update(m => {
          const next = new Map(m);
          next.set(i, rels ?? []);
          return next;
        });
      });
    });
  });

  relacionesDeLinea(index: number): EfectoRelacionEfecto[] {
    return this.relacionesByIndex().get(index) ?? [];
  }

  readonly ubicacionesByIndex = signal<Map<number, EfectoUbicacion[]>>(new Map());

  private ubicacionesEffect = effect(() => {
    const individuales = this.individualByIndex();
    const efectos = this.parametroStock().efectos;
    efectos.forEach((e, i) => {
      const efectoId = e.EfectoId;
      if (!efectoId) return;
      const individualId = individuales.get(i) ?? null;
      firstValueFrom(this.searchService.getEfectoUbicaciones(efectoId, individualId)).then(ubs => {
        this.ubicacionesByIndex.update(m => {
          const next = new Map(m);
          next.set(i, ubs ?? []);
          return next;
        });
      });
    });
  });

  ubicacionesAgrupadas(index: number): { tipo: string; label: string; items: EfectoUbicacion[] }[] {
    const all = this.ubicacionesByIndex().get(index) ?? [];
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
    this.individualByIndex.update(m => {
      const next = new Map<number, number | null>();
      for (const [i, v] of m) {
        if (i < index) next.set(i, v);
        else if (i > index) next.set(i - 1, v);
      }
      return next;
    });
    if (this.parametroStock().efectos.length === 0) {
      this.addEfecto();
    }
  }

  async confirmar() {
    await firstValueFrom(this.apiService.confirmarStockEfecto(this.parametroStock()));
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

