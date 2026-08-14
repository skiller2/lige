import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { ProductoSearchComponent } from '../../../shared/producto-search/producto-search.component';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-orden-venta-form',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, ProductoSearchComponent],
  templateUrl: './orden-venta-form.html',
  styleUrl: './orden-venta-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenVentaFormComponent {

  anio = input<number>(0)
  mes = input<number>(0)
  objetivoId = input<number>(0)

  // Ítems que vienen del detalle (/api/orden-venta/list)
  items = input<any[]>([])

  // Avisa al contenedor que el detalle cambió, para recalcular el total de la orden
  guardado = output<void>()
  detalleChange = output<any[]>()

  private fb = inject(FormBuilder)
  private destroyRef = inject(DestroyRef)

  // Un item por cada producto de la orden. Los campos son las columnas de la grilla
  // (/api/orden-venta/cols)
  formOrdenVenta = this.fb.group({
    items: this.fb.array([] as FormGroup[])
  })

  // Panel abierto del acordeón (uno solo a la vez, para no colapsar la vista)
  panelAbierto = signal<number>(0)

  private formValue = toSignal(this.formOrdenVenta.valueChanges, {
    initialValue: this.formOrdenVenta.getRawValue()
  })

  itemsValue = computed<any[]>(() => (this.formValue() as any)?.items ?? [])

  constructor() {
    // Carga el detalle recibido en el FormArray
    effect(() => {
      const items = this.items()

      this.itemsArray.clear({ emitEvent: false })
      for (const item of items) this.itemsArray.push(this.nuevoItem(item), { emitEvent: false })
      // Siempre hay al menos un ítem para cargar
      if (!this.itemsArray.length) this.itemsArray.push(this.nuevoItem(), { emitEvent: false })
      this.itemsArray.updateValueAndValidity()

      this.panelAbierto.set(0)
    })

    // El total de la orden se recalcula ante cualquier modificación del detalle
    effect(() => this.detalleChange.emit(this.itemsValue()))
  }

  get itemsArray(): FormArray {
    return this.formOrdenVenta.get('items') as FormArray
  }

  private nuevoItem(item: any = {}): FormGroup {
    const group = this.fb.group({
      id: item.id ?? 0,
      ProductoCodigo: item.ProductoCodigo ?? '',
      Producto: item.Producto ?? '',
      Cantidad: item.Cantidad ?? 0,
      ImporteUnitario: item.ImporteUnitario ?? 0,
      TextoFactura: item.TextoFactura ?? '',
      CantidadEnFactura: item.CantidadEnFactura ?? 0,
      ImporteTotal: item.ImporteTotal ?? 0
    })

    // Importe Total = Cantidad * Importe Unitario
    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(valor => {
      const total = Number(valor.Cantidad ?? 0) * Number(valor.ImporteUnitario ?? 0)
      if (Number(valor.ImporteTotal ?? 0) !== total)
        group.patchValue({ ImporteTotal: total }, { emitEvent: false })
    })

    return group
  }

  tituloItem(index: number): string {
    const item = this.itemsValue()[index] ?? {}
    const nombre = [item.ProductoCodigo, item.Producto].filter(Boolean).join(' - ')
    return `${index + 1}. ${nombre || 'Nuevo ítem'}`
  }

  importeItem(index: number): number {
    return Number(this.itemsValue()[index]?.ImporteTotal ?? 0)
  }

  // Al elegir el producto se guarda también el nombre, que es lo que se muestra en la grilla
  productoChange(index: number, producto: { value: string; label: string } | null) {
    this.itemsArray.at(index)?.patchValue({ Producto: producto?.label ?? '' })
  }

  addItem(event?: Event) {
    event?.preventDefault()
    this.itemsArray.push(this.nuevoItem())
    this.panelAbierto.set(this.itemsArray.length - 1)
    this.formOrdenVenta.markAsDirty()
  }

  removeItem(index: number, event?: Event) {
    event?.preventDefault()
    event?.stopPropagation()
    this.itemsArray.removeAt(index)
    // Nunca queda el detalle sin ítems
    if (!this.itemsArray.length) this.itemsArray.push(this.nuevoItem())
    this.panelAbierto.set(Math.min(index, this.itemsArray.length - 1))
    this.formOrdenVenta.markAsDirty()
  }

  save() {
    // TODO: falta el endpoint de alta/modificación en /api/orden-venta
    this.guardado.emit()
  }
}
