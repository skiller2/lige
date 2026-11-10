import { ChangeDetectionStrategy, Component, model, output, signal, inject, resource } from '@angular/core';
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
  readonly direccion = signal<DireccionManual>(this.defaultAddress);
  readonly formDirecciones = form(this.direccion)

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

  close(): void {
    this.visible.set(false);
  }

  save() {
    const values: any = this.formDirecciones().value()

    // Simular direccion de Geoapify para que sea compatible con el backend
    values.lat = ''
    values.lon = ''
    values.iso3166_2 = values.Provincia?.iso3166_2 || '';
    values.state = values.Provincia?.label || '';
    values.county = (values.Localidad?.label) || '';
    values.suburb = (values.Barrio?.label) || '';
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
    this.visible.set(false);
    this.formDirecciones().reset(this.defaultAddress);
  }
}