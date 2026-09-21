import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
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
  tap
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

@Component({
  selector: 'app-addr-search',
  standalone: true,
  imports: [
    CommonModule,
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

  private propagateTouched: () => void = () => { };
  private propagateChange: (_: any) => void = () => { };

  private async buscarProvincia(nombre: string, paisId: number): Promise<number|null> {
    try {
      const res = await firstValueFrom(
        this.searchService.getProvinciaFromName('Descripcion', nombre, paisId)
      );

      return res.length ? res[0].ProvinciaId : null;

    } catch (error) {
      console.error('Error buscando provincia:', error);
      return null;
    }
  }

  private async buscarLocalidad(nombre:string, provinciaId:number, paisId:number): Promise<number|null> {

    if (!provinciaId) return null;

    try {

      let array:any[] = nombre.split(" ")
      const res = await firstValueFrom(
        this.searchService.getLocalidadFromName('Descripcion', array[array.length-1], provinciaId, paisId)
      );
      
      return res.length ? res[0].LocalidadId : null;

    } catch (error) {
      console.error('Error buscando localidad:', error);
      return null;
    }
  }

  private async buscarBarrio(nombre:string, localidadId:number, provinciaId:number, paisId:number): Promise<number|null> {

    if (!localidadId) return null;

    try {
      let array:any[] = nombre.split(" ")
      const res = await firstValueFrom(
        this.searchService.getBarrioFromName('Descripcion', array[array.length-1], localidadId, provinciaId, paisId)
      );

      return res.length ? res[0].BarrioId : null;

    } catch (error) {
      console.error('Error buscando barrio:', error);
      return null;
    }
  }

  readonly options = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(500),
      distinctUntilChanged(),

      tap(() => this.loading.set(true)),

      switchMap(term =>
        this.searchService.getDireccionNominatim(term)
      ),

      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      }),

      takeUntilDestroyed(this.destroyRef)
    ),
    {
      initialValue: []
    }
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

    this.selectedItem.set(value ?? null);

    if (!value) {
      return;
    }

    const current = this.options();

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
    // console.log('modelChange: ',value);
    if (!value) {
      this.selectedItem.set(null);
      this.propagateChange(null);
      return;
    }

    const PaisId = 1;
    let ProvinciaId:number|null = null;
    let LocalidadId:number|null = null;
    let BarrioId:number|null = null;
    // Validar el address
    if (value?.address) {
      const address = value.address
      
      // Provincia
      if (address.state) {
        ProvinciaId = await this.buscarProvincia(address.state, PaisId);
      }

      // Localidad
      const localidadNombre = address.state_district ?? address.city;
      if (ProvinciaId && localidadNombre) {
        LocalidadId = await this.buscarLocalidad(localidadNombre, ProvinciaId, PaisId);
      }

      // Barrio
      if (ProvinciaId && LocalidadId && address.town) {
        BarrioId = await this.buscarBarrio(address.town, LocalidadId, ProvinciaId, PaisId);
      }

    }

    value = {
      ...value,
      verAddress: {
        PaisId,
        ProvinciaId,
        LocalidadId,
        BarrioId
      }
    };
    
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

  compareByPlaceId = (a: any, b: any) => a?.place_id === b?.place_id;

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

}