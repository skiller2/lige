import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { EfectoIndividualAtributo } from '../../../shared/schemas/efecto.schemas';

@Component({
  selector: 'app-efecto-modifica',
  imports: [SHARED_IMPORTS, CommonModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzSelectModule],
  templateUrl: './efecto-modifica.html',
  standalone: true,
})
export class EfectoModificaComponent {
  readonly efecto = input<any | null>(null);
  readonly modo = input<string>('consulta');

  private fb = inject(FormBuilder);
  private search = inject(SearchService);
  private apiService = inject(ApiService);

  // Opciones de los selects: observable directo + async pipe, igual que el filtro-builder.
  readonly $optionsRubros = this.search.getRubros();
  readonly $optionsSubrubros = this.search.getSubrubros();

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

  readonly formEfecto = this.fb.group({
    EfectoId: [{ value: null as number | null, disabled: true }],
    EfectoDescripcion: [{ value: '', disabled: true }],
    RubroId: [{ value: null as number | null, disabled: true }],
    SubrubroId: [{ value: null as number | null, disabled: true }],
    StockStock: [{ value: null as number | null, disabled: true }],
    EfectoEfectoIndividualDescripcion: [{ value: '', disabled: true }],
    atributos: this.fb.array([] as FormGroup[]),
  });

  get atributos(): FormArray {
    return this.formEfecto.get('atributos') as FormArray;
  }

  // El disabled se fija al construir el control. El FormArray se reconstruye entero al cambiar de modo
  // y el @for trackea por referencia de grupo, así cada rebuild genera controles y DOM nuevos que
  // toman el disabled correcto (evita que el ValueAccessor quede "pegado" al control anterior).
  private nuevoAtributo(row: EfectoIndividualAtributo | null, disabled: boolean): FormGroup {
    return this.fb.group({
      EfectoEfectoIndividualAtributoIngresoId: [row?.EfectoEfectoIndividualAtributoIngresoId ?? null],
      EfectoAtributoAtributoIngresoId: [{ value: row?.EfectoAtributoAtributoIngresoId ?? null, disabled }],
      EfectoAtributoIngresoValor: [{ value: row?.EfectoAtributoIngresoValor ?? '', disabled }],
    });
  }

  agregarAtributo(): void {
    if (this.esConsulta()) return;
    this.atributos.push(this.nuevoAtributo(null, false));
  }

  quitarAtributo(index: number): void {
    if (this.esConsulta()) return;
    this.atributos.removeAt(index);
  }

  async guardar(): Promise<void> {
    if (this.esConsulta()) return;
    const values = {
      ...this.formEfecto.getRawValue(),
      EfectoEfectoIndividualId: this.individualId(),
    };
    await firstValueFrom(this.apiService.guardarEfectoModifica(values));
    // Relee lo persistido: las filas nuevas toman el Id que les asignó el back y no se vuelven a
    // insertar si el usuario guarda de nuevo.
    this.atributosIngreso.reload();
  }

  constructor() {
    // Único punto de armado: recompone valores y estado disabled de todos los controles cada vez que
    // cambia el efecto, el modo o las filas de atributos. Cada control se (re)setea con su disabled
    // definitivo, de modo que el modo queda siempre reflejado.
    effect(() => {
      const ef = this.efecto();
      const consulta = this.esConsulta();
      const rows = this.atributosIngreso.value() ?? [];

      // Campos base: valor + disabled según modo. EfectoId siempre bloqueado.
      this.formEfecto.get('EfectoId')!.reset({ value: ef?.EfectoId ?? null, disabled: true });
      // La columna editable de Efecto, no la compuesta que muestra la grilla.
      this.formEfecto.get('EfectoDescripcion')!.reset({ value: ef?.EfectoDescripcion ?? '', disabled: consulta });
      this.formEfecto.get('RubroId')!.reset({ value: ef?.RubroId ?? null, disabled: consulta });
      this.formEfecto.get('SubrubroId')!.reset({ value: ef?.SubrubroId ?? null, disabled: consulta });
      this.formEfecto.get('StockStock')!.reset({ value: ef?.StockStock ?? null, disabled: consulta });
      this.formEfecto.get('EfectoEfectoIndividualDescripcion')!.reset({ value: ef?.EfectoEfectoIndividualDescripcion ?? '', disabled: consulta });

      // Atributos: se reconstruyen con el disabled correcto al crearse.
      this.atributos.clear();
      for (const row of rows) this.atributos.push(this.nuevoAtributo(row, consulta));
    });
  }
}
