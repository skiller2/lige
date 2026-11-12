import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  switchMap,
  tap, filter, catchError, finalize, of, map, pipe
} from 'rxjs';

import {
  takeUntilDestroyed,
  toObservable,
  toSignal
} from '@angular/core/rxjs-interop';

import { NzSelectComponent } from 'ng-zorro-antd/select';
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { EnvironmentOutline } from '@ant-design/icons-angular/icons';

import { SearchService } from '../../services/search.service';
import { SHARED_IMPORTS } from '@shared';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AddressFormComponent } from '../addr-form/addr-form';

@Component({
  selector: 'app-addr-search',
  standalone: true,
  imports: [
    CommonModule, AddressFormComponent,
    ...SHARED_IMPORTS
  ],
  templateUrl: './addr-search.html',
  styleUrls: ['./addr-search.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddrSearchComponent),
      multi: true
    },
    provideNzIconsPatch([EnvironmentOutline])
  ]
})
export class AddrSearchComponent
  implements ControlValueAccessor, AfterViewInit {

  // TODO: Unificar el valor del control para recibir el texto registrado y los datos de ubicacion sin un input domicilioCompleto separado.
  // - Adaptar la carga de los formularios para que el buscador resuelva la presentacion cuando falta DomicilioJson y existe DomicilioCompleto.
  // - Distinguir el texto registrado de una direccion seleccionada; no generar un JSON ficticio para superar la validacion.
  // - Mantener la validacion en el backend y pedir una nueva seleccion cuando falten los datos necesarios para normalizar la direccion.

  // - Habilitar el mapa solo con coordenadas validas y retirar el JSON de depuracion del drawer.

  private readonly searchService = inject(SearchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly dsc = viewChild<NzSelectComponent>('dsc');

  /**
   * Valor seleccionado
   */
  readonly selectedItem = model<any | null>(null);
  
  readonly visibleDrawer = signal(false);

  readonly loading = signal(false);

  private readonly searchTerm = signal('');

  readonly searchCount = signal(0);
  // Tras 5 busquedas, o si la direccion actual ya es manual (para corregirla)
  readonly showManualOption = computed(
    () => this.searchCount() >= 5 || this.selectedItem()?.source === 'manual'
  );
  readonly visibleManualModal = signal(false);
  readonly MANUAL_OPTION = '__MANUAL_ADDRESS__';

  private propagateTouched: () => void = () => { };
  private propagateChange: (_: any) => void = () => { };

  readonly options = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(500),
      map(term => term.trim()),
      distinctUntilChanged(),
      
      switchMap(term => {
        if (!term) {
          this.loading.set(false);
          return of([]);
        }
        this.searchCount.update(count => count + 1);
        this.loading.set(true);
      
        // this.searchService.getDireccionNominatim(term)
        return this.searchService.getDireccionAPIFY(term)
      }),
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      }),
      takeUntilDestroyed(this.destroyRef)
    ),
    { initialValue: [] }
  );

  private readonly keydownHandler = (
    event: KeyboardEvent
  ): void => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter'
    ) {
      event.stopImmediatePropagation();
    }
  };

  ngAfterViewInit(): void {
    const select = this.dsc();

    if (!select) {
      return;
    }

    select.originElement.nativeElement.addEventListener(
      'keydown',
      this.keydownHandler
    );
  }

  ngOnDestroy(): void {
    const select = this.dsc();

    if (!select) {
      return;
    }

    select.originElement.nativeElement.removeEventListener(
      'keydown',
      this.keydownHandler
    );
  }

  // ======================
  // ControlValueAccessor
  // ======================

  async writeValue(value: any): Promise<void> {

    // if (value?.display_name) {
    //   const arrResult = await this.searchService.getDireccionNominatim(value.display_name)
    //   if (arrResult[0])
    //     value = arrResult[0]
    // }

    // reinicia el contador de busquedas
    if (value !== this.selectedItem()) this.searchCount.set(0);

    this.selectedItem.set(value ?? null);

    if (!value) {
      return;
    }

    const current: any[] = this.options();

    const found = current.some(
      (x: any) => x.place_id === value.place_id
    );

    if (!found) {
      current.unshift(value);
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.dsc()?.setDisabledState(disabled);
  }

  // ======================
  // Eventos
  // ======================

  onBlur(): void {
    this.propagateTouched();
  }

  search(value: string): void {
    // console.log('search: ',value);
    this.searchTerm.set(value);
  }

  async modelChange(value: any | null): Promise<void> {
    // El usuario eligió ingresar una dirección manualmente.
    if (value === this.MANUAL_OPTION) {
      // El combo vuelve a la direccion previa para poder elegir la opcion de nuevo
      this.dsc()?.writeValue(this.selectedItem());
      this.openManualModal();
      return;
    }
    
    // console.log('modelChange: ',value);
    if (typeof value === 'string') return;

    if (!value) {
      this.selectedItem.set(null);
      this.propagateChange(null);
      return;
    }
    
    this.selectedItem.set(value);
    this.propagateChange(this.selectedItem());
  }

  onRemove(): void {
    this.selectedItem.set(null);
    this.propagateChange(this.selectedItem());
  }

  focus(): void {
    this.dsc()?.focus();
  }

  openDrawer(): void {
    this.visibleDrawer.set(true);
  }

  closeDrawer(): void {
    this.visibleDrawer.set(false);
  }

  compareByPlaceId = (a: any, b: any) =>
    typeof a === 'string' || typeof b === 'string' ? a === b : a?.place_id === b?.place_id;

  readonly mapUrl = computed<SafeResourceUrl>(() => {

    const item = this.selectedItem();

    if (!item?.lat || !item?.lon) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        'about:blank'
      );
    }

    const lat = Number(item.lat);
    const lon = Number(item.lon);

    const bbox = [
      lon - 0.005,
      lat - 0.005,
      lon + 0.005,
      lat + 0.005
    ].join(',');

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
    );
  });

  openManualModal(): void {
    this.visibleManualModal.set(true);
  }

  onManualAddressSaved(address: any): void {
    this.selectedItem.set(address);
    this.propagateChange(address);
  }

}
