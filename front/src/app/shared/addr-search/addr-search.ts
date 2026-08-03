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
    }
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
  readonly selectedItem = model<any | null>({});


  readonly visibleDrawer = signal(false);

  readonly loading = signal(false);

  private readonly searchTerm = signal('');

  private propagateTouched: () => void = () => { };
  private propagateChange: (_: any) => void = () => { };

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

    if (value?.display_name) {
      const arrResult = await this.searchService.getDireccionNominatim(value.display_name)
      if (arrResult[0])
        value = arrResult[0]
    }

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
    this.searchTerm.set(value);
  }

  async modelChange(value: any | null): Promise<void> {
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