import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import {
  noop,
} from 'rxjs';
import { SearchService } from '../../services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-tipo-asociado-categoria-search',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './tipo-asociado-categoria-search.html',
  styleUrl: './tipo-asociado-categoria-search.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TipoAsociadoCategoriaSearchComponent),
      multi: true,
    },
  ],
})
export class TipoAsociadoCategoriaSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent

  options: { value: string, label: string }[] = []
  listOfSelectedValue: string[] = []
  isLoading = false

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  ngOnInit() {
    this.isLoading = true
    this.searchService.getCategoriaPersonalOptions().subscribe({
      next: (data) => {
        this.options = data
        this.isLoading = false
      },
      error: () => {
        this.isLoading = false
      }
    })
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      this.listOfSelectedValue = value.split(';').filter((v: string) => v.trim() !== '')
    } else {
      this.listOfSelectedValue = []
    }
  }

  modelChange(values: string[]) {
    const joinedValue = values.join(';')
    const labels = values.map(v => {
      const opt = this.options.find(o => o.value === v)
      return opt ? opt.label : v
    })
    const joinedLabel = labels.join(';')

    this.valueExtendedEmitter.emit({ fullName: joinedLabel })
    this.propagateChange(joinedValue)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  }

}
