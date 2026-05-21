import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { TipoDestinoSearchComponent } from '../../../shared/tipo-destino-search/tipo-destino-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ProveedorSearchComponent } from '../../../shared/proveedor-search/proveedor-search.component';

export interface ParametroformEfectoStock {
  fecha: Date | null;
  tipoDestino: string;
  depositoId: number | null;
  personalId: number | null;
  objetivoId: string | null;
  proveedorId: number | null;
}

@Component({
  selector: 'app-efecto-stock',
  imports: [...SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, TipoDestinoSearchComponent, ObjetivoSearchComponent, ProveedorSearchComponent],
  templateUrl: './efecto-stock.html',
  styleUrl: './efecto-stock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EfectoStockComponent {
  private searchService = inject(SearchService);
  private apiService = inject(ApiService);

  private readonly defaultStockForm: ParametroformEfectoStock = {
    fecha: null,
    tipoDestino: '',
    depositoId: null,
    personalId: null,
    objetivoId: null,
    proveedorId: null,
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

