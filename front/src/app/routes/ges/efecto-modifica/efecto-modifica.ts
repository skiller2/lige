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
import { Atributo, EfectoAtributo, EfectoIndividualAtributo, Rubro, Subrubro, Valor } from '../../../shared/schemas/efecto.schemas';
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

/** Una fila de EfectoAtributo (atributo + valor del efecto). Sin Id = alta. */
interface EfectoAtributoLinea {
  EfectoAtributoId: number | null;
  EfectoAtributoAtributoId: number | null;
  EfectoAtributoValorId: number | null;
}

const nuevaEfectoAtributoLinea = (): EfectoAtributoLinea => ({
  EfectoAtributoId: null,
  EfectoAtributoAtributoId: null,
  EfectoAtributoValorId: null,
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

  // Catálogos de las filas de atributo/valor: se cargan una sola vez acá y se pasan a los selects de
  // cada fila. Los valores vienen todos, con su AtributoId, y valor-search filtra por el atributo de
  // su fila; igual que subrubro con rubro.
  readonly atributos = toSignal(this.search.getAtributos(), { initialValue: [] as Atributo[] });
  readonly valores = toSignal(this.search.getValores(), { initialValue: [] as Valor[] });

  // Los subrubros se filtran por rubro en el front, así que hace falta la lista completa.
  private readonly todosLosSubrubros = toSignal(
    this.search.getSubrubros() as Observable<Subrubro[]>,
    { initialValue: [] as Subrubro[] }
  );

  readonly esConsulta = computed(() => this.modo() !== 'modifica');

  readonly efectoId = computed(() => this.efecto()?.EfectoId ?? null);
  readonly individualId = computed(() => this.efecto()?.EfectoEfectoIndividualId ?? null);
  readonly esIndividual = computed(() => this.individualId() != null);

  // Opciones del Select de las filas de atributo del individual: los atributos que ya devuelve
  // getEfectoIndividualAtributos (resource atributosIngreso), deduplicados por su Id.
  readonly atributosOpciones = computed(() => {
    const rows = this.atributosIngreso.value() ?? [];
    const map = new Map<number, string>();
    for (const r of rows) {
      if (r.EfectoAtributoAtributoIngresoId != null)
        map.set(Number(r.EfectoAtributoAtributoIngresoId), r.AtributoDescripcion);
    }
    return [...map].map(([AtributoIngresoId, AtributoIngresoDescripcion]) => ({ AtributoIngresoId, AtributoIngresoDescripcion }));
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

  // Atributos/valores del efecto (filas de EfectoAtributo, 1:N). Se leen para no pisarlos al guardar.
  readonly efectoAtributosRes = resource({
    params: () => ({ efectoId: this.efectoId() }),
    loader: async ({ params }) =>
      params.efectoId ? (await firstValueFrom(this.search.getEfectoAtributos(params.efectoId))) ?? [] : [],
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

  // Filas de Atributo/Valor del efecto (EfectoAtributo, 1:N). Se resiembran desde el resource al
  // cambiar de efecto, pero quedan editables (linkedSignal). Van por afuera del modelo del form
  // porque persisten en su propia tabla y el valor de cada fila depende de su atributo.
  readonly efectoAtributos = linkedSignal<EfectoAtributo[], EfectoAtributoLinea[]>({
    source: () => this.efectoAtributosRes.value() ?? [],
    computation: rows => rows.map(r => ({
      EfectoAtributoId: r.EfectoAtributoId ?? null,
      EfectoAtributoAtributoId: r.EfectoAtributoAtributoId ?? null,
      EfectoAtributoValorId: r.EfectoAtributoValorId ?? null,
    })),
  });

 readonly descripcionCompleta = computed(() => {
    const m = this.formEfecto().value();

    // Atributos del efecto: se resuelven los Ids contra los catálogos ya cargados.
    const atributosPorId = new Map(this.atributos().map(a => [Number(a.AtributoId), a.AtributoDescripcion]));
    // ValorId es secuencial dentro de cada Atributo, no único en la tabla (igual que SubrubroId
    // dentro de su Rubro): la clave es el par, si no cada valor resuelve al de otro atributo.
    const valoresPorId = new Map(
      this.valores().map(v => [`${Number(v.AtributoId)}-${Number(v.ValorId)}`, v.ValorDescripcion])
    );
    const atrEfecto = this.efectoAtributos()
      .filter(fila => fila.EfectoAtributoAtributoId != null)
      .map(fila => {
        const atributo = atributosPorId.get(Number(fila.EfectoAtributoAtributoId)) ?? '';
        const valor = fila.EfectoAtributoValorId != null
          ? valoresPorId.get(`${Number(fila.EfectoAtributoAtributoId)}-${Number(fila.EfectoAtributoValorId)}`) ?? ''
          : '';
        return texto(`${texto(atributo)} ${texto(valor)}`);
      })
      .filter(Boolean)
      .join(', ');

    // Atributos de ingreso del individual: el valor es texto libre, cargado en la misma fila.
    const descripcionIngresoPorId = new Map(
      this.atributosOpciones().map(op => [Number(op.AtributoIngresoId), op.AtributoIngresoDescripcion])
    );
    const atrIndividual = (m.atributos ?? [])
      .filter(linea => linea.EfectoAtributoAtributoIngresoId != null)
      .map(linea => {
        const atributo = descripcionIngresoPorId.get(Number(linea.EfectoAtributoAtributoIngresoId)) ?? '';
        return texto(`${texto(atributo)} ${texto(linea.EfectoAtributoIngresoValor)}`);
      })
      .filter(Boolean)
      .join(', ');

    return `${texto(m.EfectoDescripcion)} - ${texto(m.EfectoEfectoIndividualDescripcion)} (${atrEfecto}, ${atrIndividual} )`;
  });

  onEfectoAtributoChange(index: number, atributoId: number | null): void {
    // Al cambiar el atributo de la fila, su valor anterior pertenece a otro atributo: se limpia.
    this.efectoAtributos.update(rows => rows.map((r, i) =>
      i === index ? { ...r, EfectoAtributoAtributoId: atributoId ?? null, EfectoAtributoValorId: null } : r));
  }

  onEfectoValorChange(index: number, valorId: number | null): void {
    this.efectoAtributos.update(rows => rows.map((r, i) =>
      i === index ? { ...r, EfectoAtributoValorId: valorId ?? null } : r));
  }

  agregarEfectoAtributo(): void {
    if (this.esConsulta()) return;
    this.efectoAtributos.update(rows => [...rows, nuevaEfectoAtributoLinea()]);
  }

  quitarEfectoAtributo(index: number): void {
    if (this.esConsulta()) return;
    this.efectoAtributos.update(rows => rows.filter((_, i) => i !== index));
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
        // Filas de EfectoAtributo: persisten en su propia tabla, aparte del modelo del form.
        EfectoAtributos: this.efectoAtributos(),
      };
      await firstValueFrom(this.apiService.guardarEfectoModifica(values));
      // Relee lo persistido: las filas nuevas toman el Id que les asignó el back y no se vuelven a
      // insertar si el usuario guarda de nuevo.
      this.atributosIngreso.reload();
      this.efectoAtributosRes.reload();
    });
  }
}
