import { ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { EfectoUbicacion, SearchService } from '../../../services/search.service';
import { EfectoRelacionEfecto } from '../../../shared/schemas/efecto.schemas';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, validate, type ValidationError } from '@angular/forms/signals';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { TipoDestinoSearchComponent } from '../../../shared/tipo-destino-search/tipo-destino-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ProveedorSearchComponent } from '../../../shared/proveedor-search/proveedor-search.component';
import { EfectoSearchComponent } from '../../../shared/efecto-search/efecto-search';
import { ViewResponsableComponent } from '../../../shared/view-responsable/view-responsable.component';

export interface EfectoStockLinea {
  EfectoId: number | null;
  Cantidad: number | null;
  StockId: number | null;
  EfectoIndividualId: number | null;
  Usado: boolean;
  RelacionEfectoId: number | null;
  RelacionStockId: number | null;
  RelacionEfectoIndividualId: number | null;
}

export interface ParametroformEfectoStock {
  fecha: Date | null;
  tipoDestino: string;
  depositoId: number | null;
  personalId: number | null;
  objetivoId: string | null;
  proveedorId: number | null;
  observaciones: string;
  efectos: EfectoStockLinea[];
}

@Component({
  selector: 'app-movimiento-stock',
  imports: [...SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, TipoDestinoSearchComponent, ObjetivoSearchComponent, ProveedorSearchComponent, EfectoSearchComponent, ViewResponsableComponent],
  templateUrl: './movimiento-stock.html',
  styleUrl: './movimiento-stock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientoStockComponent {
  private searchService = inject(SearchService);
  private apiService = inject(ApiService);

  private readonly objEfectoLinea: EfectoStockLinea = { EfectoId: null, Cantidad: null, StockId: null, EfectoIndividualId: null, Usado: false, RelacionEfectoId: null, RelacionStockId: null, RelacionEfectoIndividualId: null };

  private readonly defaultStockForm: ParametroformEfectoStock = {
    fecha: null,
    tipoDestino: '',
    depositoId: null,
    personalId: null,
    objetivoId: null,
    proveedorId: null,
    observaciones: '',
    efectos: [structuredClone(this.objEfectoLinea)],
  };

  readonly parametroStock = signal<ParametroformEfectoStock>(this.defaultStockForm);

  ngOnInit() {
    queueMicrotask(() => {  
        this.parametroStock.update(s => ({ ...s, fecha: new Date() }));
    });
  }

  readonly formEfectoStock = form(this.parametroStock, (p) => {
    required(p.fecha, { message: 'La fecha es obligatoria' });
    required(p.tipoDestino, { message: 'El tipo de destino es obligatorio' });

    required(p.depositoId, {
      message: 'El depósito es obligatorio',
      when: (ctx) => ctx.valueOf(p.tipoDestino) === 'deposito',
    });
    required(p.personalId, {
      message: 'La persona es obligatoria',
      when: (ctx) => ctx.valueOf(p.tipoDestino) === 'personal',
    });
    required(p.objetivoId, {
      message: 'El objetivo es obligatorio',
      when: (ctx) => ctx.valueOf(p.tipoDestino) === 'objetivo',
    });
    required(p.proveedorId, {
      message: 'El proveedor es obligatorio',
      when: (ctx) => ctx.valueOf(p.tipoDestino) === 'proveedor',
    });

    applyEach(p.efectos, (linea) => {
      required(linea.EfectoId, { message: 'Efecto obligatorio' });
      required(linea.StockId, { message: 'Ubicación obligatoria' });
      // La cantidad no puede ser 0 (ni negativa). El tope por stock se valida al confirmar (ver validarCantidades).
      validate(linea.Cantidad, (ctx) => {
        const v = ctx.value();
        if (v == null || (v as any) === '') return null; // el vacío se valida al confirmar
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0) return { kind: 'cantidad', message: 'La cantidad debe ser mayor a 0' };
        return null;
      });
    });
  });

  tipoDestinoSeleccionado = computed(() => this.parametroStock().tipoDestino);


  // al cambiar otros campos del form (observaciones, cantidad, etc.)
  personalIdSig = computed(() => this.parametroStock().personalId);
  objetivoIdSig = computed(() => this.parametroStock().objetivoId);

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
      personalId: this.personalIdSig(),
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
      personalId: this.personalIdSig(),
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
      personalId: this.personalIdSig(),
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
      objetivoId: this.objetivoIdSig(),
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
      objetivoId: this.objetivoIdSig(),
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
      objetivoId: this.objetivoIdSig(),
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

  onEfectoExtended(index: number, ext: { EfectoId?: number; EfectoEfectoIndividualId?: number | null } | null | undefined): void {
    const individualId = ext?.EfectoEfectoIndividualId ?? null;
    this.individualByIndex.update(m => {
      const next = new Map(m);
      next.set(index, individualId);
      return next;
    });
    // Al cambiar el efecto principal, oculta y limpia el bloque de relación de esa línea
    this.parametroStock.update(s => ({
      ...s,
      efectos: s.efectos.map((e, i) => i === index
        ? { ...e, StockId: null, Cantidad: null, EfectoIndividualId: individualId, RelacionEfectoId: null, RelacionStockId: null, RelacionEfectoIndividualId: null }
        : e),
    }));
    this.relacionAbiertaByIndex.update(set => {
      if (!set.has(index)) return set;
      const next = new Set(set);
      next.delete(index);
      return next;
    });
    this.relacionIndividualByIndex.update(m => {
      if (!m.has(index)) return m;
      const next = new Map(m);
      next.delete(index);
      return next;
    });
    this.relacionUbicacionesByIndex.update(m => {
      if (!m.has(index)) return m;
      const next = new Map(m);
      next.delete(index);
      return next;
    });
  }

  readonly relacionesByIndex = signal<Map<number, EfectoRelacionEfecto[]>>(new Map());

  // Solo los EfectoId por línea: así los effects no se redisparan al cambiar Cantidad/StockId
  private readonly efectoIds = computed(
    () => this.parametroStock().efectos.map(e => e.EfectoId),
    { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) }
  );

  private relacionesEffect = effect(() => {
    const individuales = this.individualByIndex();
    const ids = this.efectoIds();
    ids.forEach((efectoId, i) => {
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

  // Stock disponible por StockId (a partir de las ubicaciones ya cargadas) para validar la cantidad client-side
  readonly stockDisponibleByStockId = computed(() => {
    const ubicaciones = [...this.ubicacionesByIndex().values()].flat();
    return new Map(
      ubicaciones
        .filter(u => u.StockId != null && u.StockStock != null)
        .map(u => [Number(u.StockId), Number(u.StockStock)])
    );
  });

  private ubicacionesEffect = effect(() => {
    const individuales = this.individualByIndex();
    this.efectoIds().forEach((efectoId, i) => {
      if (efectoId) this.cargarUbicaciones(i, efectoId, individuales.get(i) ?? null);
    });
  });

  // StockId por línea (sin reaccionar a Cantidad/otros campos)
  private readonly stockIds = computed(
    () => this.parametroStock().efectos.map(e => e.StockId),
    { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) }
  );

  // Último StockId visto por línea: distingue un cambio real de ubicación de una recarga de ubicaciones
  private readonly lastStockIdByIndex = new Map<number, number | null>();

  // Al cambiar la ubicación: si la nueva tiene stock 1 autocompleta la cantidad en 1; en otro caso la limpia.
  private autoCantidadEffect = effect(() => {
    const stock = this.stockDisponibleByStockId();
    this.stockIds().forEach((stockId, i) => {
      const actual = stockId ?? null;
      if (this.lastStockIdByIndex.has(i) && this.lastStockIdByIndex.get(i) === actual) return; // sin cambio -> respeta al usuario
      this.lastStockIdByIndex.set(i, actual);
      this.setCantidad(i, actual != null && stock.get(Number(actual)) === 1 ? 1 : null);
    });
  });

  private setCantidad(index: number, cantidad: number | null): void {
    this.parametroStock.update(s => {
      if ((s.efectos[index]?.Cantidad ?? null) === cantidad) return s; //  -> evita re-trigger
      return { ...s, efectos: s.efectos.map((e, i) => (i === index ? { ...e, Cantidad: cantidad } : e)) };
    });
  }

  private async cargarUbicaciones(index: number, efectoId: number, individualId: number | null): Promise<void> {
    const lista = (await firstValueFrom(this.searchService.getEfectoUbicaciones(efectoId, individualId))) ?? [];

    // Descartar respuestas obsoletas: la línea pudo cambiar de efecto mientras se resolvía
    if (!this.lineaCoincide(index, efectoId, individualId)) return;

    this.ubicacionesByIndex.update(m => new Map(m).set(index, lista));
    this.setStockId(index, this.resolverStockId(index, lista));
  }

  private lineaCoincide(index: number, efectoId: number, individualId: number | null): boolean {
    return this.parametroStock().efectos[index]?.EfectoId === efectoId
      && (this.individualByIndex().get(index) ?? null) === individualId;
  }

  /** StockId que debe quedar según las ubicaciones cargadas */
  private resolverStockId(index: number, lista: EfectoUbicacion[]): number | null {
    if (lista.length === 1) return lista[0].StockId;                  // una sola ubicación -> autoseleccionar
    const actual = this.parametroStock().efectos[index]?.StockId ?? null;
    const sigueExistiendo = lista.some(u => Number(u.StockId) === Number(actual));
    return sigueExistiendo ? actual : null;                           // limpiar si la elegida ya no está
  }

  private setStockId(index: number, stockId: number | null): void {
    this.parametroStock.update(s => {
      if ((s.efectos[index]?.StockId ?? null) === stockId) return s;  // sin cambios -> evita re-trigger
      return { ...s, efectos: s.efectos.map((e, i) => (i === index ? { ...e, StockId: stockId } : e)) };
    });
  }

  ubicacionesAgrupadas(index: number): { tipo: string; label: string; items: EfectoUbicacion[] }[] {
    const all = this.ubicacionesByIndex().get(index) ?? [];
    const grupos: Record<string, { tipo: string; label: string; items: EfectoUbicacion[] }> = {
      deposito:  { tipo: 'deposito',  label: 'Depósito',  items: [] },
      personal:  { tipo: 'personal',  label: 'Personal',  items: [] },
      objetivo:  { tipo: 'objetivo',  label: 'Objetivo',  items: [] },
      proveedor: { tipo: 'proveedor', label: 'Proveedor', items: [] },
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

  // Líneas con el bloque de relación ("Relacionado con" + Ubicación) habilitado
  readonly relacionAbiertaByIndex = signal<Set<number>>(new Set());

  relacionAbierta(index: number): boolean {
    return this.relacionAbiertaByIndex().has(index);
  }

  relacionar(index: number, e?: MouseEvent): void {
    e?.preventDefault();
    this.relacionAbiertaByIndex.update(s => {
      const next = new Set(s);
      next.add(index);
      return next;
    });
  }

  // ===== Efecto relacionado: ubicaciones (espeja la lógica del efecto principal) =====
  readonly relacionIndividualByIndex = signal<Map<number, number | null>>(new Map());

  onRelacionEfectoExtended(index: number, ext: { EfectoId?: number; EfectoEfectoIndividualId?: number | null } | null | undefined): void {
    const individualId = ext?.EfectoEfectoIndividualId ?? null;
    this.relacionIndividualByIndex.update(m => {
      const next = new Map(m);
      next.set(index, individualId);
      return next;
    });
    this.parametroStock.update(s => ({
      ...s,
      efectos: s.efectos.map((e, i) => i === index ? { ...e, RelacionStockId: null, RelacionEfectoIndividualId: individualId } : e),
    }));
  }

  private readonly relacionEfectoIds = computed(
    () => this.parametroStock().efectos.map(e => e.RelacionEfectoId),
    { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) }
  );

  readonly relacionUbicacionesByIndex = signal<Map<number, EfectoUbicacion[]>>(new Map());

  private relacionUbicacionesEffect = effect(() => {
    const individuales = this.relacionIndividualByIndex();
    this.relacionEfectoIds().forEach((efectoId, i) => {
      if (efectoId) this.cargarRelacionUbicaciones(i, efectoId, individuales.get(i) ?? null);
    });
  });

  private async cargarRelacionUbicaciones(index: number, efectoId: number, individualId: number | null): Promise<void> {
    const lista = (await firstValueFrom(this.searchService.getEfectoUbicaciones(efectoId, individualId))) ?? [];
    if (this.parametroStock().efectos[index]?.RelacionEfectoId !== efectoId
      || (this.relacionIndividualByIndex().get(index) ?? null) !== individualId) return;
    this.relacionUbicacionesByIndex.update(m => new Map(m).set(index, lista));
    if (lista.length === 1) this.setRelacionStockId(index, lista[0].StockId);
  }

  private setRelacionStockId(index: number, stockId: number | null): void {
    this.parametroStock.update(s => {
      if ((s.efectos[index]?.RelacionStockId ?? null) === stockId) return s;
      return { ...s, efectos: s.efectos.map((e, i) => (i === index ? { ...e, RelacionStockId: stockId } : e)) };
    });
  }

  ubicacionesRelacionAgrupadas(index: number): { tipo: string; label: string; items: EfectoUbicacion[] }[] {
    const all = this.relacionUbicacionesByIndex().get(index) ?? [];
    const grupos: Record<string, { tipo: string; label: string; items: EfectoUbicacion[] }> = {
      deposito:  { tipo: 'deposito',  label: 'Depósito',  items: [] },
      personal:  { tipo: 'personal',  label: 'Personal',  items: [] },
      objetivo:  { tipo: 'objetivo',  label: 'Objetivo',  items: [] },
      proveedor: { tipo: 'proveedor', label: 'Proveedor', items: [] },
    };
    for (const u of all) {
      const g = grupos[u.Tipo];
      if (g) g.items.push(u);
    }
    return Object.values(grupos).filter(g => g.items.length > 0);
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
    this.relacionIndividualByIndex.update(m => {
      const next = new Map<number, number | null>();
      for (const [i, v] of m) {
        if (i < index) next.set(i, v);
        else if (i > index) next.set(i - 1, v);
      }
      return next;
    });
    this.relacionAbiertaByIndex.update(s => {
      const next = new Set<number>();
      for (const i of s) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      }
      return next;
    });
    const nextLastStock = new Map<number, number | null>();
    for (const [i, v] of this.lastStockIdByIndex) {
      if (i < index) nextLastStock.set(i, v);
      else if (i > index) nextLastStock.set(i - 1, v);
    }
    this.lastStockIdByIndex.clear();
    for (const [i, v] of nextLastStock) this.lastStockIdByIndex.set(i, v);
    if (this.parametroStock().efectos.length === 0) {
      this.addEfecto();
    }
  }

  async confirmar() {
    await submit(this.formEfectoStock, async (form) => {
      // La cantidad se valida al confirmar (no al perder foco). Es client-side: no va al back.
      const errores = this.validarCantidades(form().value());
      if (errores.length) return this.apiService.formBackendErrors(form, errores);

      try {
        await firstValueFrom(this.apiService.confirmarStockEfecto(form().value()));
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      return undefined;
    });
  }

  private validarCantidades(v: ParametroformEfectoStock): { fieldTree: string; kind: string; message: string }[] {
    const errores: { fieldTree: string; kind: string; message: string }[] = [];
    const stock = this.stockDisponibleByStockId();
    v.efectos.forEach((linea, i) => {
      const cantidad = Number(linea.Cantidad);
      if (linea.Cantidad == null || Number.isNaN(cantidad) || cantidad <= 0) {
        errores.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'cantidad', message: 'La cantidad debe ser mayor a 0' });
      } else if (linea.StockId != null) {
        const disponible = stock.get(Number(linea.StockId));
        if (disponible != null && cantidad > disponible) {
          errores.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'stock', message: `La cantidad (${cantidad}) supera el stock disponible (${disponible})` });
        }
      }
    });
    return errores;
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

