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
import { applyEach, disabled, form, FormField, required, submit } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

function numeroRequerido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value
  if (valor == null || String(valor).trim() === '') return { required: true }
  return Number.isFinite(Number(String(valor).replace(/\./g, '').replace(',', '.'))) ? null : { numero: true }
}

function vacioSiCero(valor: any): number | null {
  return valor == null || String(valor).trim() === '' || Number(valor) === 0 ? null : valor
}

// Valor de un input enmascarado como número, o null si todavía no se cargó
function aNumero(valor: any): number | null {
  if (valor == null || String(valor).trim() === '') return null
  const texto = String(valor)
  // Con coma decimal el texto trae también separador de miles
  const numero = Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto)
  return Number.isFinite(numero) ? numero : null
}

const TIPO_CANTIDAD_MANUAL = 'V'
const TIPO_IMPORTE_LISTA_PRECIO = 'LP'
const TIPO_IMPORTE_MANUAL = 'V'

// Productos que facturan las horas 'A' y 'B' cargadas en la asistencia
const PRODUCTO_HORAS_A = 'SSF'
const PRODUCTO_HORAS_B = 'SSFB'
const PRODUCTOS_HORAS = [PRODUCTO_HORAS_A, PRODUCTO_HORAS_B]

// Estados (por descripción) en los que la orden ya no se modifica: el detalle se abre sólo para
// consulta, igual que valida el back al guardar
const ESTADOS_NO_MODIFICABLES = ['A FACTURAR', 'FACTURADO']

export const ordenVentaNoModificable = (descripcionEstado: any): boolean =>
  ESTADOS_NO_MODIFICABLES.includes(String(descripcionEstado ?? '').trim().toUpperCase())

// Cantidades guardadas de los productos de horas, o null si la orden no los incluye
export interface HorasAFacturar {
  A: number | null
  B: number | null
}

export interface Producto {
  id: number,
  ProductoCodigo: string,
  Producto: string,
  Cantidad: string,
  ImporteUnitario: string,
  PrecioDeLista: number,
  TextoFactura: string,
  CantidadEnFactura: string,
  // Ocultos en la pantalla: van con valor fijo
  TipoCantidad: string,
  TipoImporte: string,
  CantidadEstandar: number,
  Bonificacion: number
}

export interface Comprobante {
  ComprobanteTipoCodigo: string;
  ComprobanteNro: string;
  ImporteTotal:string;
}

export interface OrdenVentaForm {
  NroOrdenVenta: number;
  PeriodoMes: 0,
  PeriodoAnio: 0,
  ClienteId: 0,
  ClienteElementoDependienteId: 0,  
  EstadoOrdenVentaCodigo: '',
  Observaciones: string;
  items: Producto[];
  comprobantes: Comprobante[]
}


@Component({
  selector: 'app-orden-venta-form',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, FormsModule, FormField],
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

  // En consulta el detalle se muestra completo pero no se edita
  soloLectura = input<boolean>(false)

  // Comprobantes que ya tiene la orden, de la cabecera (/api/orden-venta/cabecera)
  comprobantesOrden = input<any[]>([])


  // Desde dónde se abrió el detalle. El drawer de la carga de asistencia y la pantalla de órdenes
  // de venta comparten este formulario, pero no muestran los mismos campos.
  origenCrud = input<boolean>(false)


  // Estado elegido a mano en la pantalla de órdenes de venta. Sin estado el back lo resuelve por
  // los comprobantes, que es como se guarda desde la carga de asistencia.
  estadoOrdenVentaCodigo = input<string | null>(null)

  detalleImportado = input<boolean>(false)

  // "Nueva sin plantilla": el guardado tiene que dar de alta otra orden, aunque el objetivo ya
  // tenga una en el período
  nuevaOrden = input<boolean>(false)

  // Orden del período que se está editando. En cero el back graba sobre la última, que es lo que
  // hacían las pantallas cuando el período tenía una sola.
  nroOrdenVenta = input<number>(0)

  // Horas a Facturar 'A' y 'B' de la carga de asistencia, tomadas al abrir el drawer
  horasAFacturarA = input<number>(0)
  horasAFacturarB = input<number>(0)

  // Período cerrado en la asistencia: los ítems de los productos de horas no se pueden editar
  horasAFacturarABloqueada = input<boolean>(false)
  horasAFacturarBBloqueada = input<boolean>(false)

  // Avisa al contenedor que el detalle cambió, para recalcular el total de la orden
  // Cantidades guardadas de los productos de horas, o null si la orden no los incluye
  guardado = output<HorasAFacturar>()
  detalleChange = output<any[]>()

  // Cantidad de los productos de horas mientras se edita, para que la carga de asistencia
  // muestre las horas a facturar 'A' / 'B' actualizadas sin esperar el guardado
  horasAFacturarChange = output<HorasAFacturar>()


  private destroyRef = inject(DestroyRef)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private cdr = inject(ChangeDetectorRef)
  private notification = inject(NzNotificationService)

  optionsTipoCantidad = toSignal(this.searchService.getTipoCantidadSearch(), { initialValue: [] })
  optionsTipoImporte = toSignal(this.searchService.getTipoImporteSearch(), { initialValue: [] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] })
  optionsTipoProducto = toSignal(this.searchService.getTipoProductoSearch(), { initialValue: [] })


  private readonly defaultProducto: Producto = {
    id: 0,
    ProductoCodigo: '',
    Cantidad: '',
    CantidadEstandar: 0,
    PrecioDeLista: 0,
    Producto: '',
    TipoImporte: '',
    TipoCantidad: '',
    ImporteUnitario: '',
    TextoFactura: '',
    CantidadEnFactura: '',
    Bonificacion: 0
  };

  private readonly defaultComprobante: Comprobante = {
    ComprobanteNro: '',
    ComprobanteTipoCodigo: '',
    ImporteTotal:''
  };

  private readonly defaultOrdenVenta: OrdenVentaForm = {
    NroOrdenVenta: 0,
    PeriodoMes: 0,
    PeriodoAnio: 0,
    EstadoOrdenVentaCodigo: '',
    ClienteId: 0,
    ClienteElementoDependienteId: 0,
    Observaciones: '',
    items: [structuredClone(this.defaultProducto)],
    comprobantes: [structuredClone(this.defaultComprobante)],
  }

  readonly ordenVenta = signal<OrdenVentaForm>(this.defaultOrdenVenta);


  readonly formOrdenVenta = form(this.ordenVenta, (p) => {
    disabled(p, () => this.soloLectura())
    applyEach(p.items, (productoPath) => {
      required(productoPath.ProductoCodigo, { message: 'Código de producto es requerido',when: (ctx) => Number(ctx.valueOf(productoPath.Cantidad)) >0, });
      required(productoPath.Cantidad, { message: 'Cantidad es requerido',when: (ctx) => ctx.valueOf(productoPath.ProductoCodigo) !="", });
    });
    applyEach(p.comprobantes, (comprobantePath) => {
      required(comprobantePath.ComprobanteTipoCodigo, { message: 'Código comprobante requerido',when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteNro)!="", });
      required(comprobantePath.ComprobanteNro, { message: 'Número de comprobante requerido',when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) !="", });
    });

/*
    required(p.PeriodoFacturacion, { message: 'Periodo de facturación es requerido' });
    required(p.GeneracionFacturaDia, {
      message: 'Día de generación es requerido',
      when: (ctx) => ctx.valueOf(p.GeneracionFacturaReqCliente) === false,
    });

    periodRange(p.PeriodoFacturacion, {
      min: '1D',
      max: '2A',
      allowedUnits: ['D', 'S', 'M', 'A'],
      message: 'Formato inválido o fuera de rango (permitidos: D, S, M, A)',
    });

    numericRange(p.GeneracionFacturaDia, { min: 1, max: 29, message: 'Día entre 1 y 29', when: (ctx) => ctx.valueOf(p.GeneracionFacturaReqCliente) === false },);
    disabled(p.GeneracionFacturaDia, (ctx) => ctx.valueOf(p.GeneracionFacturaReqCliente) !== false);
    disabled(p.GeneracionFacturaDiaComplemento, (ctx) => ctx.valueOf(p.GeneracionFacturaReqCliente) !== false);
    //    hidden(p.PeriodoFacturacionInicio, (ctx) => this.periodoFacturacionDias()>=60);

*/
  })


  // los paneles del acordeón, así que va como señal y no como control del ítem: los paneles
  // muestran todos el mismo valor.

  // Panel abierto del acordeón (uno solo a la vez, para no colapsar la vista)
  panelAbierto = signal<number>(0)


  // Últimas horas a facturar avisadas al contenedor

  // Lo prende el guardado: la recarga del detalle que dispara no vuelve al primer panel
  private conservarPanel = false



  // El detalle tiene cambios sin guardar. dirty/pristine no son señales, así que el estado se
  // refleja acá para que un contenedor OnPush pueda habilitar su botón de guardar.

  titulos = computed(() =>
    this.ordenVenta().items.map(item => {
      // La cantidad en cero es un ítem recién creado, no se muestra
      const cantidad = Number(item?.Cantidad ?? 0) || ''
      return [cantidad, item?.ProductoCodigo, item?.Producto]
        .map(valor => String(valor ?? '').trim())
        .filter(Boolean)
        .join(' - ')
    })
  )

  importes = computed(() => this.ordenVenta().items.map(item => Number(item.Cantidad) * Number(item.ImporteUnitario)))

totalImporteOrdenVenta = computed(() => this.importes().reduce((sum, valor) => sum + valor, 0) );  
  /*
  // Comprobantes tal cual están en pantalla, para el contenedor
  private comprobanteValue = toSignal(this.formComprobante.valueChanges, {
    initialValue: this.formComprobante.getRawValue()
  })

  comprobantes = computed<any[]>(() => (this.comprobanteValue() as any)?.comprobantes ?? [])

  // Código de producto de horas de cada ítem, o '' si no es uno de ellos
  private codigoHorasItem = computed<string[]>(() =>
    this.itemsValue().map(item => {
      const codigo = String(item?.ProductoCodigo ?? '').trim().toUpperCase()
      return PRODUCTOS_HORAS.includes(codigo) ? codigo : ''
    })
  )

  // Los productos de horas los pone el sistema a partir de la asistencia: nunca se cambian a mano
  esProductoHoras = computed<boolean[]>(() => this.codigoHorasItem().map(codigo => !!codigo))

  // Cantidad cargada en el ítem de cada producto de horas, o null si la orden no lo incluye.
  // Es lo que la asistencia toma como horas a facturar 'A' / 'B'.
  horasEnDetalle = computed<HorasAFacturar>(() => {
    const codigos = this.codigoHorasItem()
    const items = this.itemsValue()

    const cantidadDe = (productoHoras: string) => {
      const indice = codigos.indexOf(productoHoras)
      return indice < 0 ? null : aNumero(items[indice]?.Cantidad)
    }

    return { A: cantidadDe(PRODUCTO_HORAS_A), B: cantidadDe(PRODUCTO_HORAS_B) }
  })

  // Con el período cerrado el resto del ítem tampoco se toca: su cantidad son las horas a
  // facturar 'A' / 'B' de la asistencia, que ya no admiten cambios
  horasBloqueadas = computed<boolean[]>(() =>
    this.codigoHorasItem().map(codigo =>
      codigo === PRODUCTO_HORAS_A ? this.horasAFacturarABloqueada()
        : codigo === PRODUCTO_HORAS_B ? this.horasAFacturarBBloqueada()
          : false)
  )
*/
  // Se prende al intentar guardar: recién ahí se señalan los ítems incompletos
  //validado = signal(false)

  // Ítems a los que les falta algún campo obligatorio

  // Un ítem sin producto ni cantidad todavía no se cargó: no se agrega otro hasta completarlo

  constructor() {
    // Carga el detalle recibido en el FormArray
/*
    effect(() => {
      const items = this.items()
      const horasAFacturarA = this.horasAFacturarA()
      const horasAFacturarB = this.horasAFacturarB()
      // Siempre hay al menos un ítem para cargar
      this.sincronizarItems(items.length ? items : [{}])
      // La recarga que sigue a un guardado deja abierto el panel que se estaba editando
      if (this.conservarPanel)
        this.panelAbierto.set(Math.min(this.panelAbierto(), this.itemsArray.length - 1))
      else
        this.panelAbierto.set(0)
      this.conservarPanel = false
      void this.agregarProductosHoras(horasAFacturarA, horasAFacturarB)
    })
*/
    // Carga los comprobantes que ya tiene la orden
    //effect(() => this.sincronizarComprobantes(this.comprobantesOrden()))

    // El total de la orden se recalcula ante cualquier modificación del detalle

    // Cambiar la cantidad de un producto de horas cambia las horas a facturar de la asistencia.
    // El detalle emite en cada tecla: sólo se avisa cuando alguna de las dos cantidades cambió.
    /*
    effect(() => {
      const horas = this.horasEnDetalle()
      if (this.horasEmitidas?.A === horas.A && this.horasEmitidas?.B === horas.B) return
      this.horasEmitidas = horas
      this.horasAFacturarChange.emit(horas)
    })

    effect(() => {
      const soloLectura = this.soloLectura()
      const bloqueadas = this.horasBloqueadas()
      // Se relee al recargar los comprobantes: las filas nuevas nacen habilitadas
      this.comprobantes()

      const aplicar = (control: AbstractControl, deshabilitar: boolean) => {
        if (deshabilitar && control.enabled) control.disable({ emitEvent: false })
        else if (!deshabilitar && control.disabled) control.enable({ emitEvent: false })
      }

      this.itemsArray.controls.forEach((item, indice) => {
        for (const [nombre, control] of Object.entries((item as FormGroup).controls))
          aplicar(control, soloLectura
            || nombre === 'ImporteUnitario'
            || (nombre === 'Cantidad' && !!bloqueadas[indice]))
      })

      for (const comprobante of this.comprobantesArray.controls)
        for (const control of Object.values((comprobante as FormGroup).controls))
          aplicar(control, soloLectura)
    })
*/
  }

/*
  get itemsArray(): FormArray {
    return this.formOrdenVenta.get('items') as FormArray
  }
*/
  private sincronizarItems(items: any[]) {
/*
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
*/
  }

  // Con horas a facturar 'A' y/o 'B' cargadas, la orden tiene que incluir los productos que las
  // facturan: si el detalle no los trae se agregan, aprovechando los ítems sin producto y sumando
  // los que falten al final.
  // Los dos ítems se crean primero, sin esperar nada: si se resolviera producto e importe de uno
  // antes de crear el otro, una recarga del detalle en el medio se llevaría puesto el segundo.
  private async agregarProductosHoras(horasAFacturarA: number, horasAFacturarB: number) {
    /*
    const secuencia = ++this.secuenciaHoras

    // Una orden de sólo consulta se muestra tal cual está grabada
    if (this.soloLectura()) return

    const codigoDe = (item: AbstractControl) =>
      String(item.getRawValue()?.ProductoCodigo ?? '').trim().toUpperCase()

    const agregados: { indice: number, productoHoras: string }[] = []

    const horasPorProducto: [string, number][] = [
      [PRODUCTO_HORAS_A, horasAFacturarA],
      [PRODUCTO_HORAS_B, horasAFacturarB]
    ]

    for (const [productoHoras, horasAFacturar] of horasPorProducto) {
      if (!horasAFacturar) continue
      if (this.itemsArray.controls.some(item => codigoDe(item) === productoHoras)) continue

      let indice = this.itemsArray.controls.findIndex(item => !codigoDe(item))
      if (indice < 0) {
        this.itemsArray.push(this.nuevoItem())
        indice = this.itemsArray.length - 1
      }

      // La cantidad son las horas a facturar que se cargaron en la asistencia
      this.itemsArray.at(indice).patchValue({
        ProductoCodigo: productoHoras,
        Cantidad: horasAFacturar
      })
      agregados.push({ indice, productoHoras })
    }

    if (!agregados.length) return

    this.panelAbierto.set(agregados[0].indice)
    this.formOrdenVenta.markAsDirty()

    // Los códigos salen de las mismas opciones que usa app-producto-search, para tomar el nombre
    const productos = await firstValueFrom(this.searchService.getProductos())
    // El detalle se recargó mientras tanto: los ítems de esta corrida ya no existen
    if (secuencia !== this.secuenciaHoras) return

    for (const { indice, productoHoras } of agregados) {
      const producto = (productos ?? []).find(
        (opcion: any) => String(opcion?.value ?? '').trim().toUpperCase() === productoHoras)

      const codigo = producto?.value ?? productoHoras
      this.itemsArray.at(indice)?.patchValue({ ProductoCodigo: codigo })

      // Trae el nombre del producto y el importe unitario vigente, igual que si se hubiera elegido a mano
      await this.productoChange(indice, { value: codigo, label: producto?.label ?? '' })
      if (secuencia !== this.secuenciaHoras) return
    }
      */
  }

/*
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
      ImporteUnitario: aNumero(item.ImporteUnitario) ?? 0,
      PrecioDeLista: precioDeLista,
      TextoFactura: item.TextoFactura ?? '',
      CantidadEnFactura: vacioSiCero(item.CantidadEnFactura),
      ImporteTotal: Number(item.ImporteTotal ?? 0),
      // Ocultos en la pantalla: van con valor fijo
      TipoCantidad: item.TipoCantidad || TIPO_CANTIDAD_MANUAL,
      TipoImporte: item.TipoImporte || (precioDeLista ? TIPO_IMPORTE_LISTA_PRECIO : TIPO_IMPORTE_MANUAL),
      CantidadEstandar: item.CantidadEstandar ?? null,
      Bonificacion: item.Bonificacion ?? null
    }
  }
*/
  addItem(e?: MouseEvent): void {
    e?.preventDefault();
    const newProducto = structuredClone(this.defaultProducto)
    this.ordenVenta.update(m => ({ ...m, items: [...m.items, newProducto]}));
  }

  // Al elegir el producto se guarda también el nombre, que es lo que se muestra en la grilla,
  // y se toma el importe unitario del precio vigente del cliente para el período.
  
  /*
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
    if (precio?.TextoFactura) item.patchValue({ TextoFactura: precio.TextoFactura })
    this.formOrdenVenta.markAsDirty()
  }
*/
  // El importe unitario no se edita en pantalla: o lo fija el precio vigente, o el ítem queda en
  // 0, que es un importe válido para grabar
  private aplicarPrecioDeLista(item: AbstractControl, importeUnitario: number | null) {
    const precioDeLista = importeUnitario != null

    item.patchValue({
      PrecioDeLista: precioDeLista,
      TipoImporte: precioDeLista ? TIPO_IMPORTE_LISTA_PRECIO : TIPO_IMPORTE_MANUAL,
      ImporteUnitario: precioDeLista ? Number(importeUnitario) : 0
    })
  }


  removeItem(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.ordenVenta.update(m => ({
      ...m,
      items: m.items.filter((_, i) => i !== index),
    }));

    if (this.ordenVenta().items.length == 0) {
      this.addItem(undefined)
    }

  }

  
  // Carga en el FormArray los comprobantes que ya tiene la orden. Siempre queda una fila, aunque
  // esté vacía: es donde se carga el primero.
  /*
  private sincronizarComprobantes(comprobantes: any[]) {
    const filas = comprobantes.length ? comprobantes : [{}]

    while (this.comprobantesArray.length > filas.length)
      this.comprobantesArray.removeAt(this.comprobantesArray.length - 1, { emitEvent: false })

    filas.forEach((comprobante, indice) => {
      if (indice < this.comprobantesArray.length)
        this.comprobantesArray.at(indice).setValue({
          ComprobanteTipoCodigo: comprobante.ComprobanteTipoCodigo ?? null,
          ComprobanteNro: comprobante.ComprobanteNro ?? '',
          ImporteTotal: comprobante.ImporteTotal ?? null
        }, { emitEvent: false })
      else
        this.comprobantesArray.push(this.nuevoComprobante(comprobante), { emitEvent: false })
    })

    // Lo recién traído todavía no tiene cambios del usuario
    this.formComprobante.markAsPristine()
    this.formComprobante.markAsUntouched()
    this.comprobantesArray.updateValueAndValidity()
  }
*/
  /*
  private nuevoComprobante(comprobante: any = {}): FormGroup {
    const group = this.fb.group({
      ComprobanteTipoCodigo: [comprobante.ComprobanteTipoCodigo ?? null, requeridoSiHayComprobante],
      ComprobanteNro: [comprobante.ComprobanteNro ?? '', requeridoSiHayComprobante],
      ImporteTotal: [comprobante.ImporteTotal ?? null, requeridoSiHayComprobante]
    })

    // Cada campo se valida contra sus hermanos: cargar uno obliga a revalidar los otros dos.
    // Sin onlySelf el estado sube hasta el grupo, que es lo que mira el guardado; emitEvent en
    // false evita que la revalidación se realimente.
    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      for (const control of Object.values(group.controls))
        control.updateValueAndValidity({ emitEvent: false })
    })

    return group
  }
    */

  // Un comprobante sin tipo ni número todavía no se cargó: no se agrega otro hasta completarlo
  /*
  hayComprobanteVacio = computed<boolean>(() =>
    this.comprobantes().some(comprobante =>
      !String(comprobante?.ComprobanteTipoCodigo ?? '').trim() &&
      !String(comprobante?.ComprobanteNro ?? '').trim()
    )
  )
    */

  addComprobante(e?: MouseEvent): void {
    e?.preventDefault();
    const newComprobante = structuredClone(this.defaultComprobante)
    this.ordenVenta.update(m => ({
      ...m,
      comprobantes: [...m.comprobantes, newComprobante],
    }));
  }

  removeComprobante(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.ordenVenta.update(m => ({
      ...m,
      comprobantes: m.comprobantes.filter((_, i) => i !== index),
    }));

    if (this.ordenVenta().comprobantes.length == 0) {
      this.addComprobante(undefined)
    }

  }

  // nz-form-control solo repinta el mensaje de error cuando el control emite statusChanges, y
  // markAsTouched no emite nada: hay que revalidar cada control para que se vea el "es requerido".
  
  /*
  private marcarInvalidos() {
    for (const item of this.itemsArray.controls) {
      for (const control of Object.values((item as FormGroup).controls)) {
        control.markAsTouched()
        control.markAsDirty()
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true })
      }
    }
  }

  private marcarComprobantesInvalidos() {
    for (const comprobante of this.comprobantesArray.controls) {
      for (const control of Object.values((comprobante as FormGroup).controls)) {
        control.markAsTouched()
        control.markAsDirty()
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true })
      }
    }
  }
*/
  private static readonly ETIQUETAS_COMPROBANTE: Record<string, string> = {
    ComprobanteTipoCodigo: 'Tipo de Comprobante',
    ComprobanteNro: 'Nro. de Comprobante',
    ImporteTotal: 'Importe Total'
  }

  // Qué le falta a cada comprobante empezado, para avisarlo junto con los carteles de cada campo
  /*
  private mensajeComprobantes(): string {
    const detalle: string[] = []

    this.comprobantesArray.controls.forEach((comprobante, indice) => {
      if (comprobante.valid) return

      const campos = Object.entries((comprobante as FormGroup).controls)
        .filter(([, control]) => control.invalid)
        .map(([nombre]) => OrdenVentaFormComponent.ETIQUETAS_COMPROBANTE[nombre] ?? nombre)

      detalle.push(`Comprobante ${indice + 1}: ${campos.join(', ')}`)
    })

    return `Complete los datos del comprobante. ${detalle.join(' | ')}`
  }
    */

  // Nombre visible de cada campo obligatorio, para el mensaje de error
  private static readonly ETIQUETAS: Record<string, string> = {
    ProductoCodigo: 'Producto',
    Cantidad: 'Cantidad',
    ImporteUnitario: 'Importe Unitario',
    TipoCantidad: 'Tipo Cantidad',
    TipoImporte: 'Tipo Importe'
  }

  // Qué le falta a cada ítem cargado, para avisarlo junto con los carteles de cada campo
  /*
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
*/
  // Devuelve true si la orden quedó grabada. En silencioso (autoguardado al pasar de un campo a
  // otro) un detalle incompleto no se graba ni se marca: se sigue cargando sin carteles de error.
  async save(opciones: { silencioso?: boolean } = {}) {
    if (this.soloLectura() ) return undefined

    await submit(this.formOrdenVenta, async (form) => {
      try {
        const formValue = form().value();
        const respuesta = await firstValueFrom(this.apiService.setOrdenVenta(formValue))

        this.notification.success('Orden de venta', respuesta?.msg ?? 'Grabación exitosa')



      } catch (e: any) {
          return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      return undefined

    })
  }

  clearForm(): void {
    this.ordenVenta.set(this.defaultOrdenVenta)
    this.formOrdenVenta().reset();
  }




/*
    const items = this.itemsArray.getRawValue()

    // Todos los ítems tienen que estar completos, incluida la fila que quedó abierta sin producto.
    // Se marcan todos para que cada panel muestre sus faltantes, y se abre el primero incompleto.
    const incompleto = this.itemsArray.controls.findIndex(item => item.invalid)

    if (opciones.silencioso && (incompleto >= 0
      || (this.origenCrud() && this.comprobantesArray.controls.some(comprobante => comprobante.invalid))))
      return false

    if (incompleto >= 0) {
      this.validado.set(true)
      this.marcarInvalidos()
      this.panelAbierto.set(incompleto)
      this.cdr.markForCheck()
      this.notification.error('Orden de venta', this.mensajeFaltantes())
      return false
    }

    // Los comprobantes van completos o vacíos: cargar uno de los tres campos obliga a los otros dos
    if (this.origenCrud() && this.comprobantesArray.controls.some(comprobante => comprobante.invalid)) {
      this.validado.set(true)
      this.marcarComprobantesInvalidos()
      this.cdr.markForCheck()
      this.notification.error('Orden de venta', this.mensajeComprobantes())
      return false
    }

    this.guardando.set(true)
    try {
      const respuesta = await firstValueFrom(this.apiService.setOrdenVenta({
        ObjetivoId: this.objetivoId(),
        anio: this.anio(),
        mes: this.mes(),
        ClienteId: this.clienteId(),
        ClienteElementoDependienteId: this.clienteElementoDependienteId(),
        EstadoOrdenVentaCodigo: this.estadoOrdenVentaCodigo(),
        // Sin la marca el back graba sobre la orden del período, que es lo de siempre
        ...(this.nuevaOrden() ? { NuevaOrden: true } : {}),
        ...(this.nroOrdenVenta() ? { NroOrdenVenta: this.nroOrdenVenta() } : {}),
        // La lista va completa: el back reescribe los comprobantes de la orden con lo que llega.
        // Sin la sección en pantalla no se manda nada, así los comprobantes quedan intactos.
        ...(this.origenCrud()
          ? {
            comprobantes: this.comprobantesArray.getRawValue().map((comprobante: any) => ({
              ComprobanteTipoCodigo: comprobante.ComprobanteTipoCodigo,
              ComprobanteNro: String(comprobante.ComprobanteNro ?? '').trim(),
              ImporteTotal: aNumero(comprobante.ImporteTotal)
            }))
          }
          : {}),
        items
      }))

      this.formOrdenVenta.markAsPristine()
      this.formComprobante.markAsPristine()

      this.notification.success('Orden de venta', respuesta?.msg ?? 'Grabación exitosa')

      // Recarga el detalle: los ítems nuevos vuelven con su ItemOrdenVentaCodigo. Las horas
      // guardadas son las del detalle, que la asistencia persiste como horas a facturar.
      this.conservarPanel = true
      this.guardado.emit(this.horasEnDetalle())
      return true
    } catch (_e) {
      // El error del back ya lo muestra la notificación del ApiService
      return false
    } finally {
      this.guardando.set(false)
    }
  }
  */
}
