import { Component, computed, effect, inject, model, resource, signal, untracked } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';

interface IntercambioBancos {
  BancoId: number | null
  Opcion: string | null
}

@Component({
  selector: 'app-intercambio-bancos-modal',
  templateUrl: './intercambio-bancos-modal.html',
  imports: [
    ...SHARED_IMPORTS,
    NzSelectModule,
    NzModalModule,
    FormField,
  ],
})
export class IntercambioBancosModalComponent {
  private readonly searchService = inject(SearchService);

  isVisible = model(false)

  private readonly defaultIntercambioBancos: IntercambioBancos = {
    BancoId: null,
    Opcion: null,
  }

  readonly intercambioBancos = signal<IntercambioBancos>({ ...this.defaultIntercambioBancos })
  readonly formIntercambioBancos = form(this.intercambioBancos)

  optionsBancos = resource({
    params: () => this.isVisible() || undefined,
    loader: () => firstValueFrom(this.searchService.getBancosIntercambioOptions()),
    defaultValue: []
  }).value;

  // Opciones por banco (equivalentes a las del menú Acciones de Liquidaciones / Banco)
  private readonly opcionesComunes = [
    { value: 'G', label: 'Generación de archivos' },
    { value: 'E', label: 'Eliminar archivos pendientes' },
    { value: 'C', label: 'Consultar los archivos generados que se encuentren pendientes de confirmación' },
  ]

  private readonly opcionesPorBanco: Record<number, { value: string, label: string }[]> = {
    11: [...this.opcionesComunes],
    4: [...this.opcionesComunes],
    10: [
      ...this.opcionesComunes,
      { value: 'I', label: 'Importa Archivo CBU Banco Macro' },
    ],
    9: [...this.opcionesComunes],
  }

  readonly optionsOpciones = computed(() => {
    const BancoId = this.formIntercambioBancos.BancoId().value()
    return BancoId ? (this.opcionesPorBanco[BancoId] ?? []) : []
  })

  private readonly resetOpcion = effect(() => {
    this.formIntercambioBancos.BancoId().value()
    untracked(() => this.formIntercambioBancos.Opcion().value.set(null))
  })

}
