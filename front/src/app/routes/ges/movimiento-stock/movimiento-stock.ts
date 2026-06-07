import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal, viewChildren } from '@angular/core';
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
import { EfectoStockLinea, ParametroformEfectoStock, nuevaEfectoLinea } from './movimiento-stock.types';

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

  private readonly STORAGE_KEY = 'movimiento-stock-form';

  private readonly defaultStockForm: ParametroformEfectoStock = {
    fecha: null,
    tipoDestino: '',
    depositoId: null,
    personalId: null,
    objetivoId: null,
    proveedorId: null,
    personalIdInter: null,
    observaciones: '',
    efectos: [nuevaEfectoLinea()],
  };

  readonly parametroStock = signal<ParametroformEfectoStock>(this.defaultStockForm);

  private readonly persistir = effect(() => {
    const value = this.parametroStock();
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(value));
    } catch { /* localStorage lleno o no disponible: se ignora */ }
  });

  ngOnInit(): void {
    const form = this.cargarDesdeStorage()
    if (form){
      this.parametroStock.update(s => ({ ...s, ...form }));
    this.formEfectoStock().markAsTouched()
    this.formEfectoStock().markAsDirty()      
    }

    //FIX for computed anio & mes
    this.parametroStock.update(s => ({ ...s, fecha: new Date() }));

    queueMicrotask(()=>{
    this.parametroStock.update(s => ({ ...s, fecha: new Date() }));
  })
  }

  /** Lee el formulario guardado (en JSON viaja como string). */
  private cargarDesdeStorage(): ParametroformEfectoStock | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as ParametroformEfectoStock;
      return data;
    } catch {
      return null;
    }
  }

  /** Borra el formulario persistido (al confirmar con éxito). */
  private limpiarStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { }
  }

  readonly formEfectoStock = form(this.parametroStock, (p) => {
    required(p.fecha, { message: 'La fecha es obligatoria' });
    required(p.tipoDestino, { message: 'El tipo de destino es obligatorio' });

    required(p.depositoId, { message: 'El depósito es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'deposito' });
    required(p.personalId, { message: 'La persona es obligatoria', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'personal' });
    required(p.objetivoId, { message: 'El objetivo es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'objetivo' });
    required(p.proveedorId, { message: 'El proveedor es obligatorio', when: (ctx) => ctx.valueOf(p.tipoDestino) === 'proveedor' });

    applyEach(p.efectos, (linea) => {
      required(linea.EfectoId, { message: 'Efecto obligatorio' , when: (ctx) => ctx.valueOf(linea.EfectoId) !== null });
      required(linea.StockId, { message: 'Ubicación obligatoria' , when: (ctx) => ctx.valueOf(linea.StockId) !== null });
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

  // Buscador persona/objetivo dentro del popconfirm bajo "Origen".
  readonly tipoBusqueda = signal<'persona' | 'objetivo'>('persona');
  // Opciones del selector Persona/Objetivo, traídas del backend.
  readonly tiposOrigen = resource({
    loader: async () => await firstValueFrom(this.searchService.getStockEfectoTiposOrigen()) as { value: string; label: string }[],
  });
  personaBuscadaId: number | null = null;
  objetivoBuscadoId: number | string | null = null;
  // Las líneas vienen precargadas (persona u objetivo) -> no se ofrece "Relacionar".
  readonly cargadoDesdeBusqueda = signal(false);

  onChangeTipoBusqueda(tipo: 'persona' | 'objetivo' | null): void {
    this.tipoBusqueda.set(tipo ?? 'persona');
    // Solo se resetea el input de búsqueda; NO se tocan las líneas (efecto/cantidad/ubicación):
    // se reemplazan recién cuando se confirma la búsqueda.
    this.personaBuscadaId = null;
    this.objetivoBuscadoId = null;
  }

  // La carga se dispara al confirmar el popconfirm (no al seleccionar en el buscador).
  confirmarBusqueda(): void {
    if (this.tipoBusqueda() === 'persona') {
      this.cargarEfectosDePersona(this.personaBuscadaId);
    } else {
      this.cargarEfectosDeObjetivo(this.objetivoBuscadoId);
    }
  }

  // Resetea la sección Origen: borra la selección del buscador y vuelve a una línea vacía.
  limpiarOrigen(): void {
    this.personaBuscadaId = null;
    this.objetivoBuscadoId = null;
    this.cargadoDesdeBusqueda.set(false);
    this.parametroStock.update(s => ({ ...s, efectos: [nuevaEfectoLinea()] }));
  }

  // Reemplaza las líneas de Origen con una por cada efecto en stock de la persona / objetivo elegido.
  async cargarEfectosDePersona(personalId: number | string | null): Promise<void> {
    const id = Number(personalId);
    if (!id) { this.cargadoDesdeBusqueda.set(false); return; }
    this.aplicarLineas(this.construirLineas(await firstValueFrom(this.searchService.getEfectoByPersonalId(id))));
    this.formEfectoStock().markAsTouched()
    this.formEfectoStock().markAsDirty()
  }

  async cargarEfectosDeObjetivo(objetivoId: number | string | null): Promise<void> {
    const id = Number(objetivoId);
    if (!id) { this.cargadoDesdeBusqueda.set(false); return; }
    this.aplicarLineas(this.construirLineas(await firstValueFrom(this.searchService.getEfectoByObjetivoId(id))));
    this.formEfectoStock().markAsTouched()
    this.formEfectoStock().markAsDirty()

  }

  // El individual viene como EfectoIndividualId (persona) o EfectoEfectoIndividualId (objetivo).
  private construirLineas(registros: any[]): EfectoStockLinea[] {
    return (registros ?? []).map((r: any) => ({
      trackId: crypto.randomUUID(),
      EfectoId: r.EfectoId ?? null,
      Cantidad: Number(r.StockStock ?? 0) - Number(r.StockReservado ?? 0),
      StockId: r.StockId ?? null,
      EfectoIndividualId: r.EfectoIndividualId ?? r.EfectoEfectoIndividualId ?? null,
      Usado: false,
      RelacionEfectoId: null,
      RelacionStockId: null,
      RelacionEfectoIndividualId: null,
    }));
  }

  private aplicarLineas(efectos: EfectoStockLinea[]): void {
    this.parametroStock.update(s => ({ ...s, efectos: efectos.length ? efectos : [nuevaEfectoLinea()] }));
    this.cargadoDesdeBusqueda.set(efectos.length > 0);
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


  async confirmar() {
    this.parametroStock.update(m => ({
      ...m,
      efectos: m.efectos.filter((row, i) => row.EfectoId),
    }));
    if (this.parametroStock().efectos.length==0)
      this.addEfectoLinea(null)


    await submit(this.formEfectoStock, async (form) => {
      const formValue = form().value();

      // La cantidad se valida al confirmar (no al perder foco). Es client-side: no va al back.
      // En determinadas situaciones falla.  Ej cuando se borraban varios items
      //      const errores = this.validarCantidades(formValue);
      //      if (errores.length) return this.apiService.formBackendErrors(form, errores);

      try {
        await firstValueFrom(this.apiService.confirmarStockEfecto(formValue));
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      //this.limpiarStorage(); // confirmado: el borrador deja de tener sentido
      return ;
    });
  }

  // Stock disponible por StockId, juntando las ubicaciones cargadas por cada fila (para validar la cantidad).
  /*
  readonly stockDisponibleByStockId = computed(() => {
    const map = new Map<number, number>();
    for (const row of this.parametroStock().efectos) {
      for (const u of row.ubicaciones.value() ?? []) {
        if (u.StockId != null && u.StockStock != null) map.set(Number(u.StockId), Number(u.StockStock));
      }
    }
    return map;
  });
  
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
  */

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

  addEfectoLinea(e?: MouseEvent | null): void {
    e?.preventDefault();
    const efectoLinea = structuredClone(nuevaEfectoLinea())
    this.parametroStock.update(s => ({ ...s, efectos: [...s.efectos, efectoLinea] }));
  }

  removeEfectoLinea(index: number, e: MouseEvent): void {
    e.preventDefault();

    this.parametroStock.update(m => ({
      ...m,
      efectos: m.efectos.filter((_, i) => i !== index),
    }));
  }

  trackByTrackId(item: any) {
    try {
      const id = item().value().trackId
      return id;
    } catch (w) {
      return null
    }

  }

}
