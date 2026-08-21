import { Component, EventEmitter, Output, forwardRef, inject, input, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { toSignal } from '@angular/core/rxjs-interop'
import { noop, Observable } from 'rxjs'
import { SHARED_IMPORTS } from '@shared'
import { SearchService } from '../../services/search.service'

// Opciones de /api/productos/options => { value: ProductoCodigo, label: Nombre }
export type ProductoOption = { value: string; label: string }

@Component({
  selector: 'app-producto-search',
  templateUrl: './producto-search.component.html',
  styleUrls: ['./producto-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductoSearchComponent),
      multi: true
    }
  ],
  imports: [...SHARED_IMPORTS]
})
export class ProductoSearchComponent implements ControlValueAccessor {

  // Emite el producto completo, para poder guardar también el nombre
  @Output('valueExtendedChange') valueExtendedEmitter = new EventEmitter<ProductoOption | null>()

  private searchService = inject(SearchService)

  productos = toSignal(this.searchService.getProductos() as Observable<ProductoOption[]>, {
    initialValue: [] as ProductoOption[]
  })

  // Bloqueo desde la pantalla, independiente del disabled del FormControl
  bloqueado = input(false)

  selectedId = signal<string>('')
  isDisabled = signal(false)

  private propagateChange: (_: any) => void = noop
  private propagateTouched: () => void = noop

  writeValue(value: any): void {
    this.selectedId.set(value ?? '')
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }

  onBlur() {
    this.propagateTouched()
  }

  modelChange(value: string) {
    this.selectedId.set(value ?? '')
    this.propagateChange(this.selectedId())
    this.valueExtendedEmitter.emit((this.productos() ?? []).find(p => p.value === value) ?? null)
  }
}
