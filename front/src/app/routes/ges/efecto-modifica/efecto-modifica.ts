import { Component, computed, effect, inject, input, linkedSignal, resource, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { applyEach, disabled, form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Observable, firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { EfectoIndividualAtributo, Rubro, Subrubro } from '../../../shared/schemas/efecto.schemas';
import { AtributoSearchComponent } from '../../../shared/atributo-search/atributo-search';
import { ValorSearchComponent } from '../../../shared/valor-search/valor-search';


const texto = (valor: string | null | undefined): string => (valor ?? '').trim();

interface AtributoLinea {
  EfectoEfectoIndividualAtributoIngresoId: number | null;
  EfectoAtributoAtributoIngresoId: number | null;
  EfectoAtributoIngresoValor: string;
}

interface EfectoModificaModel {
  EfectoId: number | null;
  EfectoDescripcion: string;
  RubroId: number | null;
  SubrubroId: number | null;
  EfectoStockMinimo: number | null;
  EfectoEfectoIndividualDescripcion: string;
  atributos: AtributoLinea[];
}

const nuevaAtributoLinea = (): AtributoLinea => ({
  EfectoEfectoIndividualAtributoIngresoId: null,
  EfectoAtributoAtributoIngresoId: null,
  EfectoAtributoIngresoValor: '',
});

@Component({
  selector: 'app-efecto-modifica',
  imports: [SHARED_IMPORTS, FormField, NzFormModule, NzInputModule, NzSelectModule, AtributoSearchComponent, ValorSearchComponent],
  templateUrl: './efecto-modifica.html',
  standalone: true,
})
export class EfectoModificaComponent {
  readonly efecto = input<any | null>(null);
  readonly modo = input<string>('consulta');

  private search = inject(SearchService);
  private apiService = inject(ApiService);

  readonly rubros = toSignal(this.search.getRubros() as Observable<Rubro[]>, { initialValue: [] as Rubro[] });

  // Los subrubros se filtran por rubro en el front, así que hace falta la lista completa.
  private readonly todosLosSubrubros = toSignal(
    this.search.getSubrubros() as Observable<Subrubro[]>,
    { initialValue: [] as Subrubro[] }
  );

  readonly esConsulta = computed(() => this.modo() !== 'modifica');

  readonly efectoId = computed(() => this.efecto()?.EfectoId ?? null);
  readonly individualId = computed(() => this.efecto()?.EfectoEfectoIndividualId ?? null);
  readonly esIndividual = computed(() => this.individualId() != null);

  // Opciones del Select de Atributo (una sola carga).
  readonly atributosOpciones = resource({
    loader: async () => (await firstValueFrom(this.search.getAtributos())) ?? [],
  });

  // Efecto relacionado (solo mostrar). DescripcionCon = el efecto del "otro lado" de la relación.
  readonly relaciones = resource({
    params: () => ({ efectoId: this.efectoId(), individualId: this.individualId() }),
    loader: async ({ params }) =>
      params.efectoId
        ? (await firstValueFrom(this.search.getEfectoRelaciones(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // Filas de atributo ingreso del efecto individual.
  readonly atributosIngreso = resource({
    params: () => ({ efectoId: this.efectoId(), individualId: this.individualId() }),
    loader: async ({ params }) =>
      params.efectoId && params.individualId != null
        ? (await firstValueFrom(this.search.getEfectoIndividualAtributos(params.efectoId, params.individualId))) ?? []
        : [],
  });

  // El modelo se rearma solo cuando cambia el efecto o llegan sus atributos; entre medio es
  // escribible y se queda con lo que edita el usuario. Reemplaza al effect que reseteaba control
  // por control. Tras guardar, el reload() de atributosIngreso vuelve a pasar por acá y deja el
  // modelo con lo que quedó persistido.
  private readonly modelo = linkedSignal<{ ef: any; rows: EfectoIndividualAtributo[] }, EfectoModificaModel>({
    source: () => ({ ef: this.efecto(), rows: this.atributosIngreso.value() ?? [] }),
    computation: ({ ef, rows }) => ({
      EfectoId: ef?.EfectoId ?? null,
      // La columna editable de Efecto, no la compuesta que muestra la grilla.
      EfectoDescripcion: texto(ef?.EfectoDescripcion),
      RubroId: ef?.RubroId ?? null,
      SubrubroId: ef?.SubrubroId ?? null,
      EfectoStockMinimo: ef?.EfectoStockMinimo ?? null,
      EfectoEfectoIndividualDescripcion: texto(ef?.EfectoEfectoIndividualDescripcion),
      atributos: rows.map(row => ({
        EfectoEfectoIndividualAtributoIngresoId: row.EfectoEfectoIndividualAtributoIngresoId ?? null,
        EfectoAtributoAtributoIngresoId: row.EfectoAtributoAtributoIngresoId ?? null,
        EfectoAtributoIngresoValor: texto(row.EfectoAtributoIngresoValor),
      })),
    }),
  });

  // Los largos espejan los de las columnas; el back los revalida y es la autoridad.
  readonly formEfecto = form(this.modelo, p => {
    // El modo es una regla derivada, no un estado que haya que rearmar en cada carga.
    disabled(p, () => this.esConsulta());
    disabled(p.EfectoId);

    required(p.EfectoDescripcion, { message: 'La descripción es obligatoria' });
    maxLength(p.EfectoDescripcion, 100, { message: 'La descripción no puede superar los 100 caracteres' });
    required(p.RubroId, { message: 'El rubro es obligatorio' });
    required(p.SubrubroId, { message: 'El subrubro es obligatorio' });

    // Columna NULL-able: vacío es "sin mínimo definido" y es válido.
    validate(p.EfectoStockMinimo, ({ value }) => {
      const v = value();
      if (v == null) return undefined;
      if (Number(v) < 0) return { kind: 'min', message: 'El stock mínimo no puede ser negativo' };
      return undefined;
    });

    required(p.EfectoEfectoIndividualDescripcion, {
      message: 'La descripción individual es obligatoria',
      when: () => this.esIndividual(),
    });
    maxLength(p.EfectoEfectoIndividualDescripcion, 60, {
      message: 'La descripción individual no puede superar los 60 caracteres',
    });

    applyEach(p.atributos, linea => {
      required(linea.EfectoAtributoAtributoIngresoId, { message: 'Debe seleccionar el atributo' });
      required(linea.EfectoAtributoIngresoValor, { message: 'Debe ingresar el valor' });
      maxLength(linea.EfectoAtributoIngresoValor, 40, { message: 'El valor no puede superar los 40 caracteres' });
    });
  });

  // La FK de Efecto es el par (RubroId, SubrubroId): un subrubro solo existe dentro de su rubro.
  readonly subrubrosDelRubro = computed(() => {
    const rubroId = Number(this.formEfecto.RubroId().value());
    if (!rubroId) return [];
    return this.todosLosSubrubros().filter(sub => Number(sub.RubroId) === rubroId);
  });

  private efectoVisto: any = undefined;
  private rubroVisto: number | null = null;

  // Al cambiar el rubro, el subrubro anterior pertenece a otro rubro y deja de ser válido. Se guarda
  // lo último visto para distinguir "el usuario cambió el rubro" de "se cargó otro efecto" (mismo
  // patrón que autoCantidad en efecto-stock-linea): en la carga el modelo ya trae su propio
  // subrubro y vaciarlo sería borrar el dato que se acaba de leer.
  private readonly limpiarSubrubroDeOtroRubro = effect(() => {
    const rubroId = this.formEfecto.RubroId().value();
    const ef = this.efecto();
    untracked(() => {
      const esCarga = ef !== this.efectoVisto;
      const cambioRubro = rubroId !== this.rubroVisto;
      this.efectoVisto = ef;
      this.rubroVisto = rubroId;
      if (esCarga || !cambioRubro) return;
      this.modelo.update(m => ({ ...m, SubrubroId: null }));
    });
  });

  // Atributo/Valor: todavía sin cablear al modelo. Estado local sólo para que el Valor se filtre por
  // el Atributo elegido y se limpie cuando el Atributo cambia.
  readonly atributoSel = signal<number | null>(null);
  readonly valorSel = signal<number | null>(null);

  onAtributoChange(id: number | null): void {
    this.atributoSel.set(id ?? null);
    this.valorSel.set(null);
  }

  agregarAtributo(): void {
    if (this.esConsulta()) return;
    this.modelo.update(m => ({ ...m, atributos: [...m.atributos, nuevaAtributoLinea()] }));
  }

  quitarAtributo(index: number): void {
    if (this.esConsulta()) return;
    this.modelo.update(m => ({ ...m, atributos: m.atributos.filter((_, i) => i !== index) }));
  }

  async guardar(): Promise<void> {
    if (this.esConsulta()) return;
    await submit(this.formEfecto, async f => {
      const m = f().value();
      const values = {
        ...m,
        // Los largos se validan contra el texto recortado, así que se manda ya recortado.
        EfectoDescripcion: texto(m.EfectoDescripcion),
        EfectoEfectoIndividualDescripcion: texto(m.EfectoEfectoIndividualDescripcion),
        EfectoEfectoIndividualId: this.individualId(),
      };
      await firstValueFrom(this.apiService.guardarEfectoModifica(values));
      // Relee lo persistido: las filas nuevas toman el Id que les asignó el back y no se vuelven a
      // insertar si el usuario guarda de nuevo.
      this.atributosIngreso.reload();
    });
  }
}
