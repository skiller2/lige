import { ChangeDetectionStrategy, Component, computed, inject, resource, signal, viewChildren } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { applyEach, form, FormField, required, submit, validate } from '@angular/forms/signals';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { TipoDestinoSearchComponent } from '../../../shared/tipo-destino-search/tipo-destino-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ProveedorSearchComponent } from '../../../shared/proveedor-search/proveedor-search.component';
import { ViewResponsableComponent } from '../../../shared/view-responsable/view-responsable.component';
import { EfectoStockLineaComponent } from './efecto-stock-linea/efecto-stock-linea';
import { ParametroformEfectoStock, nuevaEfectoLinea } from './movimiento-stock.types';

export type { EfectoStockLinea, ParametroformEfectoStock } from './movimiento-stock.types';

@Component({
  selector: 'app-movimiento-stock',
  imports: [...SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, TipoDestinoSearchComponent, ObjetivoSearchComponent, ProveedorSearchComponent, ViewResponsableComponent, EfectoStockLineaComponent],
  templateUrl: './movimiento-stock.html',
  styleUrl: './movimiento-stock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientoStockComponent {
  private searchService = inject(SearchService);
  private apiService = inject(ApiService);

  private readonly defaultStockForm: ParametroformEfectoStock = {
    fecha: null,
    tipoDestino: '',
    depositoId: null,
    personalId: null,
    objetivoId: null,
    proveedorId: null,
    observaciones: '',
    efectos: [nuevaEfectoLinea()],
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

    required(p.depositoId, { message: 'El depósito es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'deposito' });
    required(p.personalId, { message: 'La persona es obligatoria', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'personal' });
    required(p.objetivoId, { message: 'El objetivo es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'objetivo' });
    required(p.proveedorId, { message: 'El proveedor es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'proveedor' });

    applyEach(p.efectos, (linea) => {
      required(linea.EfectoId, { message: 'Efecto obligatorio' });
      required(linea.StockId, { message: 'Ubicación obligatoria' });
      // La cantidad no puede ser 0 ni negativa. El tope por stock se valida al confirmar (ver validarCantidades).
      validate(linea.Cantidad, (ctx) => {
        const v = ctx.value();
        if (v == null || (v as any) === '') return null; // el vacío se valida al confirmar
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0) return { kind: 'cantidad', message: 'La cantidad debe ser mayor a 0' };
        return null;
      });
    });
  });

  // Cada fila es un <app-efecto-stock-linea>; las consultamos para conocer el stock disponible al confirmar.
  private readonly lineas = viewChildren(EfectoStockLineaComponent);

  // Buscador de persona suelto bajo "Origen": el ícono lo muestra/oculta.
  readonly mostrarBuscadorPersona = signal(false);
  personaBuscadaId: number | null = null;

  toggleBuscadorPersona(): void {
    this.mostrarBuscadorPersona.update(v => !v);
  }

  tipoDestinoSeleccionado = computed(() => this.parametroStock().tipoDestino);
  personalIdSig = computed(() => this.parametroStock().personalId);
  objetivoIdSig = computed(() => this.parametroStock().objetivoId);
  anio = computed(() => this.parametroStock().fecha?.getFullYear() ?? new Date().getFullYear());
  mes = computed(() => (this.parametroStock().fecha?.getMonth() ?? new Date().getMonth()) + 1);

  // ===== Resources del destino (cabecera) =====
  depositos = resource({
    params: () => ({ tipo: this.tipoDestinoSeleccionado() }),
    loader: async ({ params }) => params.tipo === 'deposito' ? await firstValueFrom(this.searchService.getDepositos()) : [],
  });

  proveedores = resource({
    params: () => ({ tipo: this.tipoDestinoSeleccionado() }),
    loader: async ({ params }) => params.tipo === 'proveedor' ? await firstValueFrom(this.searchService.getStockEfectoProveedores()) : [],
  });

  personaInfo = resource({
    params: () => ({ personalId: this.personalIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => params.personalId
      ? await firstValueFrom(this.searchService.getStockEfectoPersonaInfo(params.personalId, params.anio, params.mes))
      : null,
  });

  personaResponsables = resource({
    params: () => ({ personalId: this.personalIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => params.personalId
      ? await firstValueFrom(this.apiService.getPersonaResponsables(params.personalId, params.anio, params.mes))
      : [],
  });

  personaSitRevista = resource({
    params: () => ({ personalId: this.personalIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => params.personalId
      ? await firstValueFrom(this.apiService.getPersonaSitRevista(params.personalId, params.anio, params.mes))
      : [],
  });

  objetivoInfo = resource({
    params: () => ({ objetivoId: this.objetivoIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      return id ? await firstValueFrom(this.searchService.getStockEfectoObjetivoInfo(id, params.anio, params.mes)) : null;
    },
  });

  objetivoResponsables = resource({
    params: () => ({ objetivoId: this.objetivoIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      return id ? await firstValueFrom(this.searchService.getObjetivoResponsables(id, params.anio, params.mes)) : [];
    },
  });

  objetivoContratos = resource({
    params: () => ({ objetivoId: this.objetivoIdSig(), anio: this.anio(), mes: this.mes() }),
    loader: async ({ params }) => {
      const id = Number(params.objetivoId);
      return id ? await firstValueFrom(this.searchService.getObjetivoContratos(id, params.anio, params.mes)) : [];
    },
  });

  // Stock disponible por StockId, juntando las ubicaciones cargadas por cada fila (para validar la cantidad).
  readonly stockDisponibleByStockId = computed(() => {
    const map = new Map<number, number>();
    for (const linea of this.lineas()) {
      for (const u of linea.ubicaciones.value() ?? []) {
        if (u.StockId != null && u.StockStock != null) map.set(Number(u.StockId), Number(u.StockStock));
      }
    }
    return map;
  });

  addEfecto(): void {
    this.parametroStock.update(s => ({ ...s, efectos: [...s.efectos, nuevaEfectoLinea()] }));
  }

  removeEfecto(index: number): void {
    this.parametroStock.update(s => {
      const efectos = s.efectos.filter((_, i) => i !== index);
      return { ...s, efectos: efectos.length ? efectos : [nuevaEfectoLinea()] };
    });
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
      return (this.depositos.value() ?? []).find((d: any) => d.DepositoId === id)?.DepositoSucursalDescripcion ?? null;
    }
    if (tipo === 'proveedor') {
      const id = this.parametroStock().proveedorId;
      return (this.proveedores.value() ?? []).find((p: any) => p.ProveedorId === id)?.ProveedorSucursalDescripcion ?? null;
    }
    return null;
  });
}
