import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-efecto-modifica',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './efecto-modifica.html',
  standalone: true,
})
export class EfectoModificaComponent {
  readonly efectoId = input<number>(0);
  readonly efectoIndividualId = input<number>(0);
  readonly modo = input<string>('consulta');

  readonly esConsulta = computed(() => this.modo() !== 'modifica');
  readonly titulo = computed(() => (this.esConsulta() ? 'Consultar efecto' : 'Modificar efecto'));
}
