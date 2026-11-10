import { ChangeDetectionStrategy, Component, model, output, input, linkedSignal, inject, resource, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '@shared';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../services/search.service';
import { firstValueFrom } from 'rxjs';

interface DireccionManual {
  source: 'manual';
  street: string;
  housenumber: string;
  postcode: string;
  Provincia: any;
  Localidad: any;
  Barrio: any;
  display_name: string;
}

@Component({
  selector: 'app-addr-form',
  standalone: true,
  imports: [
    CommonModule, FormField, NzSelectComponent, NzModalModule,
    ...SHARED_IMPORTS
  ],
  templateUrl: './addr-form.html',
  styleUrl: './addr-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent {

  private searchService = inject(SearchService)

  readonly visible = model(false);
  readonly addressSaved = output<DireccionManual>();
  private readonly defaultAddress: DireccionManual = {
    source: 'manual',
    street: '', housenumber: '', postcode: '', display_name: '',
    Provincia: {}, Localidad: {}, Barrio: {}
  }
  // Direccion seleccionada en el buscador: si es manual, se precarga para corregirla
  readonly direccionActual = input<any>(null);
  private readonly valorInicial = computed<DireccionManual>(() => {
    const dir = this.direccionActual()
    if (dir?.source !== 'manual') return this.defaultAddress
    return {
      ...this.defaultAddress,
      street: dir.street || '', housenumber: dir.housenumber || '', postcode: dir.postcode || '',
      Provincia: dir.ProvinciaId ? { value: dir.ProvinciaId, label: dir.state, iso3166_2: dir.iso3166_2 } : {},
      Localidad: dir.LocalidadId ? { value: dir.LocalidadId, label: dir.county } : {},
      Barrio: dir.BarrioId ? { value: dir.BarrioId, label: dir.suburb } : {},
    }
  })
  readonly direccion = linkedSignal<DireccionManual>(() => this.valorInicial());
  readonly formDirecciones = form(this.direccion)
  // Los combos comparan por ID: la opcion precargada no es el mismo objeto que el de la lista
  readonly compareByValue = (a: any, b: any) => a?.value === b?.value

  optionsProvincia = toSignal(this.searchService.getProvinciasByPais(1), { initialValue: [] })
  optionsLocalidad = resource({
    params: () => ({
      Provincia: this.direccion().Provincia,
    }),
    loader: async ({ params }) => {
      if (!params.Provincia?.value) return [];
      return await firstValueFrom(this.searchService.getLocalidadesByProvincia(1, params.Provincia.value))
    },
    defaultValue: []
  });
  optionsBarrio = resource({
    params: () => ({
      Provincia: this.direccion().Provincia,
      Localidad: this.direccion().Localidad,
    }),
    loader: async ({ params }) => {
      if (!params.Provincia?.value || !params.Localidad?.value) return [];
      return await firstValueFrom(this.searchService.getBarriosByLocalidad(1, params.Provincia.value, params.Localidad.value))
    },
    defaultValue: []
  });

  constructor() {
    // Si la Localidad no pertenece a la Provincia elegida se vacian Localidad y Barrio
    effect(() => {
      if (this.optionsLocalidad.status() !== 'resolved') return
      const ids = this.optionsLocalidad.value().map((o: any) => o.value)
      untracked(() => {
        const id = this.direccion().Localidad?.value
        if (id && !ids.includes(id)) this.direccion.update(d => ({ ...d, Localidad: {}, Barrio: {} }))
      })
    })
    // Si el Barrio no pertenece a la Localidad elegida se vacia
    effect(() => {
      if (this.optionsBarrio.status() !== 'resolved') return
      const ids = this.optionsBarrio.value().map((o: any) => o.value)
      untracked(() => {
        const id = this.direccion().Barrio?.value
        if (id && !ids.includes(id)) this.direccion.update(d => ({ ...d, Barrio: {} }))
      })
    })
  }

  close(): void {
    this.visible.set(false);
    // Al cerrar (cancelar o guardar) vuelve a la direccion guardada, o vacio si no habia manual
    this.formDirecciones().reset(this.valorInicial());
  }

  save() {
    // Copia: no modificar el objeto del formulario
    const values: any = { ...this.formDirecciones().value() }

    // Simular direccion de Geoapify para que sea compatible con el backend
    values.lat = ''
    values.lon = ''
    values.iso3166_2 = values.Provincia?.iso3166_2 || '';
    values.state = values.Provincia?.label || '';
    values.county = (values.Localidad?.label) || '';
    values.suburb = (values.Barrio?.label) || '';
    // IDs elegidos en los combos: el back los usa sin buscar por texto
    values.ProvinciaId = values.Provincia?.value || null;
    values.LocalidadId = values.Localidad?.value || null;
    values.BarrioId = values.Barrio?.value || null;
    values.display_name = [
      [values.street, values.housenumber].filter(Boolean).join(" "),
      values.postcode,
      values.suburb,
      values.county,
      values.state
    ].filter(Boolean).join(", ");
    delete values.Provincia;
    delete values.Localidad;
    delete values.Barrio;

    this.addressSaved.emit(values);
    this.close();
  }
}