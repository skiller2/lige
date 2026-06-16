import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { BehaviorSubject, Observable, debounceTime, firstValueFrom, noop, switchMap, tap } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { doOnSubscribe } from '../../services/api.service';
import { SearchService } from '../../services/search.service';

interface ActaSearch {
  ActaId: number;
  ActaNroActa: number;
  ActaDescripcion: string;
  ActaFechaActa: string;
  label: string;
}

@Component({
  selector: 'app-acta-search',
  templateUrl: './acta-search.component.html',
  styleUrls: ['./acta-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ActaSearchComponent),
      multi: true,
    },
  ],
  imports: [...SHARED_IMPORTS, CommonModule]
})
export class ActaSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any;
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('asc') asc!: NzSelectComponent;

  private _selectedId: any = '';
  _selected = signal<any>('');
  extendedOption: ActaSearch = { ActaId: 0, ActaNroActa: 0, ActaDescripcion: '', ActaFechaActa: '', label: '' };

  private propagateTouched: () => void = noop;
  private propagateChange: (_: any) => void = noop;
  controlDisabled = signal(false);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<ActaSearch[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getActaFromName(Number(value) ? 'ActaNroActa' : 'ActaDescripcion', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  );

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn;
  }

  onBlur() {
    this.propagateTouched();
  }

  get selectedId() {
    return this._selectedId;
  }

  set selectedId(val: string) {
    val = (val === null || val === undefined || val == '0') ? '' : val;
    const selectedValue: any = val === '' ? '' : Number(val);

    if (selectedValue !== this._selectedId) {
      this._selectedId = selectedValue;

      if (this._selectedId == '') {
        this.extendedOption = { ActaId: 0, ActaNroActa: 0, ActaDescripcion: '', ActaFechaActa: '', label: '' };
        this.valueExtendedEmitter.emit({});
        this._selected.set('');
        this.propagateChange(this._selectedId);
        return;
      }

      firstValueFrom(
        this.searchService
          .getActaFromName('ActaId', String(this._selectedId))
          .pipe(tap(res => {
            if (res[0]?.ActaId) {
              this.extendedOption = res[0];
              this._selected.set(this._selectedId);
              this.valueExtendedEmitter.emit(this.extendedOption);
              this.propagateChange(this._selectedId);
            }
          }))
      );
    }
  }

  writeValue(value: any) {
    if (value !== this._selectedId) {
      this.selectedId = value;
    }
  }

  modelChange(val: string) {
    this.selectedId = val;
  }

  search(value: string): void {
    this.extendedOption = { ActaId: 0, ActaNroActa: 0, ActaDescripcion: '', ActaFechaActa: '', label: '' };
    this.$searchChange.next(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }
}
