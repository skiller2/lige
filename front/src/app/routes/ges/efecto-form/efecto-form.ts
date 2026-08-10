import { Component, computed, effect, inject, input, linkedSignal, output, resource, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { applyEach, disabled, form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Observable, firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { Atributo, AtributoIngreso, EfectoAtributo, EfectoIndividualAtributo, Rubro, Subrubro, Valor } from '../../../shared/schemas/efecto.schemas';
import { AtributoSearchComponent } from '../../../shared/atributo-search/atributo-search';
import { ValorSearchComponent } from '../../../shared/valor-search/valor-search';
import { EfectoSearchComponent } from '../../../shared/efecto-search/efecto-search';


const texto = (valor: string | null | undefined): string => (valor ?? '').trim();

interface AtributoLinea {
  EfectoEfectoIndividualAtributoIngresoId: number | null;
  EfectoAtributoAtributoIngresoId: number | null;
  EfectoAtributoIngresoValor: string;
}

interface EfectoFormModel {
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
  selector: 'app-efecto-form',
  imports: [SHARED_IMPORTS, FormField, NzFormModule, NzInputModule, NzSelectModule, AtributoSearchComponent, ValorSearchComponent, EfectoSearchComponent],
  templateUrl: './efecto-form.html',
  standalone: true,
})
export class EfectoFormComponent {
  readonly efecto = input<any | null>(null);
  readonly modo = input<string>('consulta');

  // Tras un alta exitosa emite el efecto ya persistido; el padre lo selecciona y navega a modificación.
  readonly guardadoAlta = output<any>();
  // Informa cualquier persistencia exitosa para que el contenedor sincronice sus grillas.
  readonly onAddorUpdate = output<any>();

  private search = inject(SearchService);
  private apiService = inject(ApiService);

  readonly rubros = toSignal(this.search.getRubros() as Observable<Rubro[]>, { initialValue: [] as Rubro[] });

  // Catálogos de las filas de atributo/valor: se cargan una sola vez acá y se pasan a los selects de
  // cada fila. Los valores vienen todos, con su AtributoId, y valor-search filtra por el atributo de
  // su fila; igual que subrubro con rubro.
  readonly atributos = toSignal(this.search.getAtributos(), { initialValue: [] as Atributo[] });
  readonly valores = toSignal(this.search.getValores(), { initialValue: [] as Valor[] });

  readonly atributosIngresoCatalogo = toSignal(this.search.getAtributosIngreso(), { initialValue: [] as AtributoIngreso[] });

  // Los subrubros se filtran por rubro en el front, así que hace falta la lista completa.
  private readonly todosLosSubrubros = toSignal(
    this.search.getSubrubros() as Observable<Subrubro[]>,
    { initialValue: [] as Subrubro[] }
  );

  // Los dos modos de alta (uno por botón): 'alta' abre el form vacío; 'alta-individual' reduce la
  // sección Efecto a un buscador y recién habilita el bloque individual al elegir un efecto.
  readonly esAltaCompleta = computed(() => this.modo() === 'alta');
  readonly esAltaIndividual = computed(() => this.modo() === 'alta-individual');
  // Solo lectura en consulta; en modificación y en las altas es editable.
  readonly esConsulta = computed(() => this.modo() === 'consulta');

  // Efecto elegido en el buscador (solo 'alta-individual'). Hasta que se elige, no hay efecto de
  // partida y el bloque individual queda oculto.
  private readonly efectoBuscado = signal<any | null>(null);

  // En 'alta-individual' el efecto de partida sale del buscador; en el resto de los modos, del input.
  readonly efectoActivo = computed(() => this.esAltaIndividual() ? this.efectoBuscado() : this.efecto());

  readonly efectoId = computed(() => this.efectoActivo()?.EfectoId ?? null);
  readonly individualId = computed(() => this.efectoActivo()?.EfectoEfectoIndividualId ?? null);
  // En alta individual el bloque se muestra siempre (aunque todavía no se haya elegido efecto): queda
  // visible pero deshabilitado y se habilita al elegir el efecto de partida (ver individualDeshabilitado).
  readonly esIndividual = computed(() =>
    this.esAltaCompleta()
    || this.esAltaIndividual()
    || this.individualId() != null
  );

  // El bloque de efecto individual arranca deshabilitado en alta individual hasta elegir el efecto.
  readonly individualDeshabilitado = computed(() => this.esAltaIndividual() && !this.efectoActivo());

  readonly hayDescripcionIndividual = computed(() => texto(this.modelo().EfectoEfectoIndividualDescripcion) !== '');

  readonly hayAtributosIndividual = computed(() => this.modelo().atributos.some(
    a => a.EfectoAtributoAtributoIngresoId != null || texto(a.EfectoAtributoIngresoValor) !== ''
  ));

  private readonly individualEnUso = computed(() => this.hayDescripcionIndividual() || this.hayAtributosIndividual());

  /** Descripción individual cargada pero sin ningún atributo: el usuario tiene que completar abajo. */
  readonly faltanAtributosIndividual = computed(() =>
    this.esAltaCompleta() && this.hayDescripcionIndividual() && !this.hayAtributosIndividual()
  );

  onEfectoBuscadoChange(opt: any): void {
    const efectoId = opt?.EfectoId ? Number(opt.EfectoId) : null;
    this.efectoBuscado.set(efectoId ? { EfectoId: efectoId, EfectoEfectoIndividualId: null, EfectoDescripcion: opt?.fullName ?? '' } : null);
  }

  // Opciones del Select "Tipo" de las filas del individual: el catálogo completo de AtributoIngreso
  // (así hay opciones también al dar de alta un individual, sin filas previas de dónde derivarlas).
  readonly atributosOpciones = computed(() =>
    this.atributosIngresoCatalogo().map(a => ({
      AtributoIngresoId: Number(a.AtributoIngresoId),
      AtributoIngresoDescripcion: a.AtributoIngresoDescripcion,
    }))
  );

  // Todo lo que el form necesita del efecto en una sola llamada: relaciones, atributos de ingreso
  // del individual y filas de EfectoAtributo. Antes eran tres GET en paralelo con la misma clave
  // (efectoId, individualId).
  readonly formulario = resource({
    params: () => ({ efectoId: this.efectoId(), individualId: this.individualId() }),
    loader: async ({ params }) =>
      params.efectoId
        ? await firstValueFrom(this.search.getEfectoFormulario(params.efectoId, params.individualId))
        : null,
  });

  // Efecto relacionado (solo mostrar). DescripcionCon = el efecto del "otro lado" de la relación.
  readonly relaciones = computed(() => this.formulario.value()?.relaciones ?? []);

  // Filas de atributo ingreso del efecto individual.
  readonly atributosIngreso = computed(() => this.formulario.value()?.atributos ?? []);

  // El modelo se rearma solo cuando cambia el modo, el efecto o llegan sus atributos; entre medio es
  // escribible y se queda con lo que edita el usuario. Reemplaza al effect que reseteaba control
  // por control. Tras guardar no se recarga: el back devuelve el formulario persistido y se aplica
  // sobre el modelo (ver guardar()).
  // El modo entra en la fuente porque al cambiar de solapa (p. ej. alta -> alta individual) el efecto
  // sigue siendo null y los atributos siguen vacíos: sin él, lo cargado a mano en el modo anterior
  // sobrevive al cambio.
  private readonly modelo = linkedSignal<{ modo: string; ef: any; rows: EfectoIndividualAtributo[] }, EfectoFormModel>({
    source: () => ({ modo: this.modo(), ef: this.efectoActivo(), rows: this.atributosIngreso() }),
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

    // Bloque de efecto individual: visible siempre en alta individual, pero deshabilitado hasta que
    // se elija el efecto de partida en el buscador.
    disabled(p.EfectoEfectoIndividualDescripcion, () => this.individualDeshabilitado());
    disabled(p.atributos, () => this.individualDeshabilitado());

    // La cabecera de Efecto (descripción, rubro, subrubro) no se edita en alta individual: ahí la
    // sección Efecto es solo el buscador y el efecto ya existe, así que esas obligatorias no aplican.
    required(p.EfectoDescripcion, { message: 'La descripción es obligatoria', when: () => !this.esAltaIndividual() });
    // maxLength no admite 'when', así que el largo se valida con un validate mode-aware: en alta
    // individual la descripción es la del efecto elegido (no se edita y puede ser larga), así que no aplica.
    validate(p.EfectoDescripcion, ({ value }) => {
      if (this.esAltaIndividual()) return undefined;
      return texto(value()).length > 100
        ? { kind: 'maxLength', message: 'La descripción no puede superar los 100 caracteres' }
        : undefined;
    });
    required(p.RubroId, { message: 'El rubro es obligatorio', when: () => !this.esAltaIndividual() });
    required(p.SubrubroId, { message: 'El subrubro es obligatorio', when: () => !this.esAltaIndividual() });

    // Columna NULL-able: vacío es "sin mínimo definido" y es válido.
    validate(p.EfectoStockMinimo, ({ value }) => {
      const v = value();
      if (v == null) return undefined;
      if (Number(v) < 0) return { kind: 'min', message: 'El stock mínimo no puede ser negativo' };
      return undefined;
    });

    // En el alta de efecto el individual es opcional: la descripción solo se exige si hay atributos
    // cargados. En el resto de los modos sigue siendo obligatoria siempre que haya individual.
    // required(p.EfectoEfectoIndividualDescripcion, {
    //   message: 'La descripción individual es obligatoria',
    //   when: () => this.esAltaCompleta() ? this.hayAtributosIndividual() : this.esIndividual(),
    // });
    maxLength(p.EfectoEfectoIndividualDescripcion, 60, {
      message: 'La descripción individual no puede superar los 60 caracteres',
    });

    // La otra mitad de la regla: con descripción individual cargada tiene que haber al menos un atributo.
    validate(p.atributos, () => this.faltanAtributosIndividual()
      ? { kind: 'required', message: 'Debe cargar al menos un atributo' }
      : undefined);

    applyEach(p.atributos, linea => {
      // En el alta, una fila vacía con el bloque individual sin usar no molesta.
      const exigir = () => !this.esAltaCompleta() || this.individualEnUso();
      required(linea.EfectoAtributoAtributoIngresoId, { message: 'Debe seleccionar el atributo', when: exigir });
      required(linea.EfectoAtributoIngresoValor, { message: 'Debe ingresar el valor', when: exigir });
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
    const ef = this.efectoActivo();
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
  readonly efectoAtributos = linkedSignal<{ modo: string; rows: EfectoAtributo[] }, EfectoAtributoLinea[]>({
    source: () => ({ modo: this.modo(), rows: this.formulario.value()?.EfectoAtributos ?? [] }),
    computation: ({ rows }) => rows.map(r => ({
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
        return texto(`${texto(atributo)}: ${texto(valor)}`);
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
    if (this.esConsulta() || this.individualDeshabilitado()) return;
    this.modelo.update(m => ({ ...m, atributos: [...m.atributos, nuevaAtributoLinea()] }));
  }

  quitarAtributo(index: number): void {
    if (this.esConsulta() || this.individualDeshabilitado()) return;
    this.modelo.update(m => ({ ...m, atributos: m.atributos.filter((_, i) => i !== index) }));
  }

  async guardar(): Promise<void> {
    if (this.esConsulta()) return;
    // Alta individual: hay que elegir primero el efecto de partida en el buscador; sin él no hay nada
    // que dar de alta (y el bloque de efecto individual todavía está oculto).
    if (this.esAltaIndividual() && !this.efectoActivo()) return;
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
      console.log('[efecto-form] payload enviado:', JSON.parse(JSON.stringify(values)));

      // Cada modo tiene su endpoint: alta de efecto completo, alta de efecto individual o
      // modificación de un efecto existente.
      const esAlta = this.esAltaCompleta() || this.esAltaIndividual();
      const guardado$ = this.esAltaCompleta()
        ? this.apiService.altaEfecto(values)
        : this.esAltaIndividual()
          ? this.apiService.altaEfectoIndividual(values)
          : this.apiService.guardarEfectoForm(values);
      const res = await firstValueFrom(guardado$);

      console.log('[efecto-form] formulario recibido:', res?.data);

      const guardado = res?.data;
      if (!guardado) return;

      this.onAddorUpdate.emit(guardado);

      // Alta: el efecto ya quedó persistido. Se avisa al padre para que lo seleccione y pase el
      // formulario a modificación de ese efecto (queda con su nuevo EfectoId, editable).
      if (esAlta) {
        this.guardadoAlta.emit(guardado);
        return;
      }

      // Modificación: el back devuelve el formulario ya persistido, así que se aplica en vez de recargar:
      // recargar los resources rearmaba el modelo entero (el linkedSignal se alimenta de atributosIngreso)
      // y el form parpadeaba. Lo único que hace falta traer son los Ids que el back asignó a las filas
      // nuevas, para que al guardar de nuevo se actualicen en lugar de insertarse otra vez.
      this.modelo.update(mod => ({
        ...mod,
        EfectoDescripcion: texto(guardado.EfectoDescripcion),
        RubroId: guardado.RubroId ?? null,
        SubrubroId: guardado.SubrubroId ?? null,
        EfectoStockMinimo: guardado.EfectoStockMinimo ?? null,
        EfectoEfectoIndividualDescripcion: texto(guardado.EfectoEfectoIndividualDescripcion),
        atributos: (guardado.atributos ?? []).map((row: EfectoIndividualAtributo) => ({
          EfectoEfectoIndividualAtributoIngresoId: row.EfectoEfectoIndividualAtributoIngresoId ?? null,
          EfectoAtributoAtributoIngresoId: row.EfectoAtributoAtributoIngresoId ?? null,
          EfectoAtributoIngresoValor: texto(row.EfectoAtributoIngresoValor),
        })),
      }));

      this.efectoAtributos.set((guardado.EfectoAtributos ?? []).map((row: EfectoAtributo) => ({
        EfectoAtributoId: row.EfectoAtributoId ?? null,
        EfectoAtributoAtributoId: row.EfectoAtributoAtributoId ?? null,
        EfectoAtributoValorId: row.EfectoAtributoValorId ?? null,
      })));
    });
  }
}
