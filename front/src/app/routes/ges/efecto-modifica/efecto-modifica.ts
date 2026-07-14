import { Component, computed, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SearchService } from '../../../services/search.service';

// Pantalla de modificar/consultar un efecto (ruta ges/efecto/modifica).
// Recibe por input la fila del efecto seleccionado en la grilla de la solapa activa y el modo:
//   - 'consulta' -> solo lectura
//   - 'modifica' -> edición
// El formulario se precarga con los datos de la fila (Rubro/Subrubro/Stock/Descripción).
// NOTA: el guardado contra el backend queda pendiente (hoy el maestro de Efecto no expone UPDATE).
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
  private searchService = inject(SearchService);

  // Opciones de los selects: observable directo + async pipe, igual que el filtro-builder.
  readonly $optionsRubros = this.searchService.getRubros();
  readonly $optionsSubrubros = this.searchService.getSubrubros();

  readonly esConsulta = computed(() => this.modo() !== 'modifica');
  readonly titulo = computed(() => (this.esConsulta() ? 'Consultar efecto' : 'Modificar efecto'));

  readonly formEfecto = this.fb.group({
    EfectoId: [{ value: null as number | null, disabled: true }],
    EfectoDescripcionCompleto: [''],
    RubroId: [null as number | null],
    SubrubroId: [null as number | null],
    StockStock: [{ value: null as number | null, disabled: true }],
  });

  constructor() {
    // Carga el formulario según el efecto seleccionado en la grilla.
    effect(() => {
      const ef = this.efecto();
      this.formEfecto.reset({
        EfectoId: ef?.EfectoId ?? null,
        EfectoDescripcionCompleto: ef?.EfectoDescripcionCompleto ?? '',
        RubroId: ef?.RubroId ?? null,
        SubrubroId: ef?.SubrubroId ?? null,
        StockStock: ef?.StockStock ?? null,
      });
    });

    // Modo consulta -> solo lectura; modifica -> editable.
    effect(() => {
      this.modo();
      this.aplicarModo();
    });
  }

  private aplicarModo(): void {
    if (this.esConsulta()) this.formEfecto.disable();
    else this.formEfecto.enable();
    // EfectoId y Stock son siempre de solo lectura.
    this.formEfecto.get('EfectoId')?.disable();
    this.formEfecto.get('StockStock')?.disable();
  }
}
