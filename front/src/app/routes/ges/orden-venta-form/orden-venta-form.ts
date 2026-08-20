import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { ProductoSearchComponent } from '../../../shared/producto-search/producto-search.component';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

function numeroRequerido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value
  if (valor == null || String(valor).trim() === '') return { required: true }
  return Number.isFinite(Number(String(valor).replace(/\./g, '').replace(',', '.'))) ? null : { numero: true }
}

function vacioSiCero(valor: any): number | null {
  return valor == null || String(valor).trim() === '' || Number(valor) === 0 ? null : valor
}

const TIPO_CANTIDAD_MANUAL = 'V'
const TIPO_IMPORTE_LISTA_PRECIO = 'LP'
const TIPO_IMPORTE_MANUAL = 'V'

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

  // Salen de la cabecera. El back valida que el objetivo pertenezca a este cliente antes de guardar
  clienteId = input<number | null>(null)
  clienteElementoDependienteId = input<number | null>(null)

  // Ítems que vienen del detalle (/api/orden-venta/list)
  items = input<any[]>([])

  // Avisa al contenedor que el detalle cambió, para recalcular el total de la orden
  guardado = output<void>()
  detalleChange = output<any[]>()

  private fb = inject(FormBuilder)
  private destroyRef = inject(DestroyRef)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private cdr = inject(ChangeDetectorRef)
  private notification = inject(NzNotificationService)

  optionsTipoCantidad = toSignal(this.searchService.getTipoCantidadSearch(), { initialValue: [] })
  optionsTipoImporte = toSignal(this.searchService.getTipoImporteSearch(), { initialValue: [] })

  // Un item por cada producto de la orden. Los campos son las columnas de la grilla
  // (/api/orden-venta/cols)
  formOrdenVenta = this.fb.group({
    items: this.fb.array([] as FormGroup[])
  })

  // Panel abierto del acordeón (uno solo a la vez, para no colapsar la vista)
  panelAbierto = signal<number>(0)

  guardando = signal(false)

  private formValue = toSignal(this.formOrdenVenta.valueChanges, {
    initialValue: this.formOrdenVenta.getRawValue()
  })

  itemsValue = computed<any[]>(() => (this.formValue() as any)?.items ?? [])

  titulos = computed<string[]>(() =>
    this.itemsValue().map(item => {
      // La cantidad en cero es un ítem recién creado, no se muestra
      const cantidad = Number(item?.Cantidad ?? 0) || ''
      return [cantidad, item?.ProductoCodigo, item?.Producto]
        .map(valor => String(valor ?? '').trim())
        .filter(Boolean)
        .join(' - ')
    })
  )

  importes = computed<number[]>(() => this.itemsValue().map(item => Number(item?.ImporteTotal ?? 0)))

  // Ítems cuyo importe unitario sale de la lista de precios del cliente: no se editan
  precioDeLista = computed<boolean[]>(() => this.itemsValue().map(item => !!item?.PrecioDeLista))

  // Se prende al intentar guardar: recién ahí se señalan los ítems incompletos
  validado = signal(false)

  // Ítems a los que les falta algún campo obligatorio
  faltantes = computed<boolean[]>(() =>
    this.itemsValue().map(item =>
      !String(item?.ProductoCodigo ?? '').trim() ||
      String(item?.Cantidad ?? '').trim() === '' ||
      String(item?.ImporteUnitario ?? '').trim() === ''
    )
  )

  // Un ítem sin producto ni cantidad todavía no se cargó: no se agrega otro hasta completarlo
  hayItemVacio = computed<boolean>(() =>
    this.itemsValue().some(item =>
      !String(item?.ProductoCodigo ?? '').trim() && !Number(item?.Cantidad ?? 0)
    )
  )

  constructor() {
    // Carga el detalle recibido en el FormArray
    effect(() => {
      const items = this.items()
      // Siempre hay al menos un ítem para cargar
      this.sincronizarItems(items.length ? items : [{}])
      this.panelAbierto.set(0)
    })

    // El total de la orden se recalcula ante cualquier modificación del detalle
    effect(() => this.detalleChange.emit(this.itemsValue()))
  }

  get itemsArray(): FormArray {
    return this.formOrdenVenta.get('items') as FormArray
  }

  private sincronizarItems(items: any[]) {
    while (this.itemsArray.length > items.length)
      this.itemsArray.removeAt(this.itemsArray.length - 1, { emitEvent: false })

    items.forEach((item, indice) => {
      if (indice < this.itemsArray.length)
        this.actualizarItem(this.itemsArray.at(indice) as FormGroup, item)
      else
        this.itemsArray.push(this.nuevoItem(item), { emitEvent: false })
    })

    // El detalle recién traído todavía no tiene cambios del usuario
    this.validado.set(false)
    this.formOrdenVenta.markAsPristine()
    this.formOrdenVenta.markAsUntouched()
    this.itemsArray.updateValueAndValidity()
  }

  private actualizarItem(group: FormGroup, item: any) {
    group.setValue(OrdenVentaFormComponent.valoresItem(item), { emitEvent: false })
  }

  // Valores iniciales de un ítem, para crearlo o para refrescar uno ya existente
  private static valoresItem(item: any = {}) {
    // Con precio de lista vigente el importe unitario lo fija la lista y no se puede editar.
    // Sin precio se arrastra el del mes anterior y queda a mano.
    const precioDeLista = !!Number(item.PrecioDeLista ?? 0)

    return {
      // id = ItemOrdenVentaCodigo. En cero es un ítem nuevo, todavía sin persistir.
      id: item.id ?? 0,
      ProductoCodigo: item.ProductoCodigo ?? '',
      Producto: item.Producto ?? '',
      Cantidad: vacioSiCero(item.Cantidad),
      ImporteUnitario: vacioSiCero(item.ImporteUnitario),
      PrecioDeLista: precioDeLista,
      TextoFactura: item.TextoFactura ?? '',
      CantidadEnFactura: vacioSiCero(item.CantidadEnFactura),
      ImporteTotal: vacioSiCero(item.ImporteTotal),
      // Ocultos en la pantalla: van con valor fijo
      TipoCantidad: item.TipoCantidad || TIPO_CANTIDAD_MANUAL,
      TipoImporte: item.TipoImporte || (precioDeLista ? TIPO_IMPORTE_LISTA_PRECIO : TIPO_IMPORTE_MANUAL),
      CantidadEstandar: item.CantidadEstandar ?? null,
      Bonificacion: item.Bonificacion ?? null
    }
  }

  private nuevoItem(item: any = {}): FormGroup {
    const valores = OrdenVentaFormComponent.valoresItem(item)

    const group = this.fb.group({
      id: valores.id,
      ProductoCodigo: [valores.ProductoCodigo, Validators.required],
      Producto: valores.Producto,
      Cantidad: [valores.Cantidad, numeroRequerido],
      ImporteUnitario: [valores.ImporteUnitario, numeroRequerido],
      PrecioDeLista: valores.PrecioDeLista,
      TextoFactura: valores.TextoFactura,
      CantidadEnFactura: valores.CantidadEnFactura,
      ImporteTotal: valores.ImporteTotal,
      // Ocultos en la pantalla: van con valor fijo
      TipoCantidad: [valores.TipoCantidad, Validators.required],
      TipoImporte: [valores.TipoImporte, Validators.required],
      CantidadEstandar: valores.CantidadEstandar,
      Bonificacion: valores.Bonificacion
    })

    // Importe Total = Cantidad * Importe Unitario
    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(valor => {
      const total = Number(valor.Cantidad ?? 0) * Number(valor.ImporteUnitario ?? 0)
      if (Number(valor.ImporteTotal ?? 0) !== total)
        group.patchValue({ ImporteTotal: total }, { emitEvent: false })
    })

    return group
  }

  // Al elegir el producto se guarda también el nombre, que es lo que se muestra en la grilla,
  // y se toma el importe unitario del precio vigente del cliente para el período.
  async productoChange(index: number, producto: { value: string; label: string } | null) {
    const item = this.itemsArray.at(index)
    if (!item) return

    item.patchValue({ Producto: producto?.label ?? '' })

    const productoCodigo = producto?.value ?? ''
    if (!productoCodigo || !this.objetivoId() || !this.anio() || !this.mes())
      return this.aplicarPrecioDeLista(item, null)

    const precio = await firstValueFrom(
      this.apiService.getPrecioProductoOrdenVenta(this.objetivoId(), this.anio(), this.mes(), productoCodigo)
    )

    if (String(item.getRawValue()?.ProductoCodigo ?? '') !== productoCodigo) return

    this.aplicarPrecioDeLista(item, precio?.ImporteUnitario ?? null)
    this.formOrdenVenta.markAsDirty()
  }

  private aplicarPrecioDeLista(item: AbstractControl, importeUnitario: number | null) {
    const precioDeLista = importeUnitario != null

    item.patchValue({
      PrecioDeLista: precioDeLista,
      TipoImporte: precioDeLista ? TIPO_IMPORTE_LISTA_PRECIO : TIPO_IMPORTE_MANUAL,
      ...(precioDeLista ? { ImporteUnitario: Number(importeUnitario) } : {})
    })
  }

  addItem(event?: Event) {
    event?.preventDefault()
    if (this.hayItemVacio()) return
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

  // nz-form-control solo repinta el mensaje de error cuando el control emite statusChanges, y
  // markAsTouched no emite nada: hay que revalidar cada control para que se vea el "es requerido".
  private marcarInvalidos() {
    for (const item of this.itemsArray.controls) {
      for (const control of Object.values((item as FormGroup).controls)) {
        control.markAsTouched()
        control.markAsDirty()
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true })
      }
    }
  }

  // Nombre visible de cada campo obligatorio, para el mensaje de error
  private static readonly ETIQUETAS: Record<string, string> = {
    ProductoCodigo: 'Producto',
    Cantidad: 'Cantidad',
    ImporteUnitario: 'Importe Unitario',
    TipoCantidad: 'Tipo Cantidad',
    TipoImporte: 'Tipo Importe'
  }

  // Qué le falta a cada ítem cargado, para avisarlo junto con los carteles de cada campo
  private mensajeFaltantes(): string {
    const detalle: string[] = []

    this.itemsArray.controls.forEach((item, indice) => {
      const valor = item.getRawValue()
      if (item.valid) return

      const campos = Object.entries((item as FormGroup).controls)
        .filter(([, control]) => control.invalid)
        .map(([nombre]) => OrdenVentaFormComponent.ETIQUETAS[nombre] ?? nombre)

      const producto = String(valor?.ProductoCodigo ?? '').trim()
      detalle.push(`Ítem ${indice + 1}${producto ? ` (${producto})` : ''}: ${campos.join(', ')}`)
    })

    return detalle.length ? `Complete los campos requeridos. ${detalle.join(' | ')}` : 'Complete los campos requeridos'
  }

  async save() {
    if (this.guardando()) return

    const items = this.itemsArray.getRawValue()

    // Todos los ítems tienen que estar completos, incluida la fila que quedó abierta sin producto.
    // Se marcan todos para que cada panel muestre sus faltantes, y se abre el primero incompleto.
    const incompleto = this.itemsArray.controls.findIndex(item => item.invalid)

    if (incompleto >= 0) {
      this.validado.set(true)
      this.marcarInvalidos()
      this.panelAbierto.set(incompleto)
      this.cdr.markForCheck()
      this.notification.error('Orden de venta', this.mensajeFaltantes())
      return
    }

    this.guardando.set(true)
    try {
      await firstValueFrom(this.apiService.setOrdenVenta({
        ObjetivoId: this.objetivoId(),
        anio: this.anio(),
        mes: this.mes(),
        ClienteId: this.clienteId(),
        ClienteElementoDependienteId: this.clienteElementoDependienteId(),
        items
      }))

      this.formOrdenVenta.markAsPristine()
      // Recarga el detalle: los ítems nuevos vuelven con su ItemOrdenVentaCodigo
      this.guardado.emit()
    } finally {
      this.guardando.set(false)
    }
  }
}
