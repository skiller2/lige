import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { form, FormField, submit } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

export interface PrecioEfecto {
  EfectoId: number | null,
  EfectoEfectoIndividualId: number | null,
  Importe: number | null,
  FechaDesde: Date | null,
}

@Component({
  selector: 'app-precio-efectos-drawer',
  templateUrl: './precio-efectos-drawer.html',
  styleUrl: './precio-efectos-drawer.less',
  imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FormField, FormsModule]
})
export class PrecioEfectosDrawerComponent {

  visible = model<boolean>(false)
  efecto = input<any | null>(null)
  placement: NzDrawerPlacement = 'left';
  onAddorUpdate = output()

  private apiService = inject(ApiService)

  readonly precioEfecto = signal<PrecioEfecto>({
    EfectoId: null,
    EfectoEfectoIndividualId: null,
    Importe: null,
    FechaDesde: new Date(),
  })
  readonly formPrecioEfecto = form(this.precioEfecto)

  descripcion = signal<string>('')
  importeVigente = signal<number | null>(null)

  // Al abrir el drawer se carga el efecto seleccionado en la grilla
  private readonly sincronizarEfecto = effect(() => {
    if (!this.visible()) return

    const efecto = this.efecto()
    this.descripcion.set(efecto?.EfectoDescripcionCompleto ?? '')
    this.importeVigente.set(efecto?.Importe ?? null)
    this.precioEfecto.set({
      EfectoId: efecto?.EfectoId ?? null,
      EfectoEfectoIndividualId: efecto?.EfectoEfectoIndividualId ?? null,
      Importe: null,
      FechaDesde: new Date(),
    })
  })

  async save() {
    await submit(this.formPrecioEfecto, async (form) => {
      const values: PrecioEfecto = form().value()
      try {
        await firstValueFrom(this.apiService.modificarValorPrecioEfecto(values))
        this.onAddorUpdate.emit()
        this.visible.set(false)
      } catch (e) {

      }
    })
  }
}
