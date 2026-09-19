import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { applyEach, disabled, form, FormField, required, submit } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { NzCollapsePanelComponent } from 'ng-zorro-antd/collapse';

const TIPO_CANTIDAD_MANUAL = 'V'
const TIPO_IMPORTE_LISTA_PRECIO = 'LP'
const TIPO_IMPORTE_MANUAL = 'V'

// Productos que facturan las horas 'A' y 'B' cargadas en la asistencia
const PRODUCTO_HORAS_A = 'SSF'
const PRODUCTO_HORAS_B = 'SSFB'
const PRODUCTOS_HORAS = [PRODUCTO_HORAS_A, PRODUCTO_HORAS_B]

// Código del estado "Facturado": pasar a él obliga a tener un comprobante completo
export const ESTADO_FACTURADO = 'FAC'

// Estados (por descripción) en los que la orden ya no se modifica: el detalle se abre sólo para
// consulta, igual que valida el back al guardar
const ESTADOS_NO_MODIFICABLES = ['A FACTURAR', 'FACTURADO']

// Cantidades guardadas de los productos de horas, o null si la orden no los incluye
export interface HorasAFacturar {
  A: number | null
  B: number | null
}

export interface Producto {
  ItemOrdenVentaCodigo: number,
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
  ImporteTotal: string;
}

export interface OrdenVentaForm {
  NroOrdenVenta: number;
  PeriodoMes: number,
  PeriodoAnio: number,
  ClienteId: number,
  ClienteElementoDependienteId: number,
  EstadoOrdenVentaCodigo: string,
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
//  changeDetection: ChangeDetectionStrategy.OnPush
})


export class OrdenVentaFormComponent {

  anio = input<number>(0)
  mes = input<number>(0)

  ClienteId = input<number | null>(null)
  ClienteElementoDependienteId = input<number | null>(null)

  soloLectura = input<boolean>(false)
  origenCrud = input<boolean>(false)

  NroOrdenVenta = input<number>(0)

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)

  optionsTipoCantidad = toSignal(this.searchService.getTipoCantidadSearch(), { initialValue: [] })
  optionsTipoImporte = toSignal(this.searchService.getTipoImporteSearch(), { initialValue: [] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] })
  optionsTipoProducto = toSignal(this.searchService.getTipoProductoSearch(), { initialValue: [] })

  private readonly defaultProducto: Producto = {
    ItemOrdenVentaCodigo: 0,
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
    ImporteTotal: ''
  };

  private readonly defaultOrdenVenta: OrdenVentaForm = {
    NroOrdenVenta: 0,
    PeriodoMes: Number(this.anio()),
    PeriodoAnio: Number(this.mes()),
    EstadoOrdenVentaCodigo: '',
    ClienteId: Number(this.ClienteId()),
    ClienteElementoDependienteId: Number(this.ClienteElementoDependienteId()),
    Observaciones: '',
    items: [structuredClone(this.defaultProducto)],
    comprobantes: [structuredClone(this.defaultComprobante)],
  }

  readonly ordenVenta = signal<OrdenVentaForm>(this.defaultOrdenVenta);

  readonly formOrdenVenta = form(this.ordenVenta, (p) => {
    disabled(p, () => this.soloLectura())
    applyEach(p.items, (productoPath) => {
      required(productoPath.ProductoCodigo, { message: 'Código de producto es requerido', when: (ctx) => Number(ctx.valueOf(productoPath.Cantidad)) > 0, });
      required(productoPath.Cantidad, { message: 'Cantidad es requerido', when: (ctx) => ctx.valueOf(productoPath.ProductoCodigo) != "", });
    });
    // Con "Facturado" los tres datos del comprobante son obligatorios; si no, van los tres juntos
    // o ninguno
    applyEach(p.comprobantes, (comprobantePath) => {
      required(comprobantePath.ComprobanteTipoCodigo, { message: 'Código comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteNro) != "" });
      required(comprobantePath.ComprobanteNro, { message: 'Número de comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) != "" });
      //required(comprobantePath.ImporteTotal, { message: 'Importe total del comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) != "" || ctx.valueOf(comprobantePath.ComprobanteNro) != "" || this.esFacturado(), });
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

  titulos = computed(() =>
    this.ordenVenta().items.map(item => {
      // La cantidad en cero es un ítem recién creado, no se muestra
      const cantidad = Number(item?.Cantidad ?? 0) || ''
      return [cantidad, item.ProductoCodigo, this.optionsTipoProducto().find((p: any) => p.ProductoCodigo === item.ProductoCodigo)?.Nombre]
        .map(valor => String(valor ?? '').trim())
        .filter(Boolean)
        .join(' - ')
    })
  )

  importes = computed(() => this.ordenVenta().items.map(item => Number(item.Cantidad) * Number(item.ImporteUnitario)))
  totalImporteOrdenVenta = computed(() => this.importes().reduce((sum, valor) => sum + valor, 0));

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
    this.ordenVenta.update(m => ({ ...m, items: [...m.items, newProducto] }));
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

    const nextIdx = Math.min(this.panels().length - 1, index)
    setTimeout(() => { this.panels().at(nextIdx)?.active.set(true) }, 100);
  }

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

  /*
    private static readonly ETIQUETAS_COMPROBANTE: Record<string, string> = {
      ComprobanteTipoCodigo: 'Tipo de Comprobante',
      ComprobanteNro: 'Nro. de Comprobante',
      ImporteTotal: 'Importe Total'
    }
  */

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
  async load(NroOrdenVenta: number) {
    const ordenVenta = await firstValueFrom(this.apiService.getOrdenVenta(NroOrdenVenta))
    this.ordenVenta.update(m => ({ ...m, ...ordenVenta }))
    if (this.ordenVenta().items.length == 0)
      this.addItem()
    if (this.ordenVenta().comprobantes.length == 0)
      this.addComprobante()

    setTimeout(() => { this.formOrdenVenta().reset() }, 0);   // Hack para resetear el estado de dirty/pristine después de cargar los datos, ya que el form no detecta que se cargaron nuevos datos y queda dirty
  }

  async loadPlantilla() {
    console.log('Cargo Plantilla OV')
  }


  async save(opciones: { silencioso?: boolean } = {}) {
    if (this.soloLectura() || this.formOrdenVenta().submitting() || this.formOrdenVenta().dirty() == false || this.formOrdenVenta().valid() == false) return undefined

    await submit(this.formOrdenVenta, async (form) => {
      try {
        const formValue = form().value();
        const respuesta = await firstValueFrom(this.apiService.setOrdenVenta(formValue))
        //TODO: Actualizar formularios con los valores devuelvos

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

  private lastNroOrdenVenta = -5
  private effecto = effect(() => {

    const NroOrdenVenta = this.NroOrdenVenta()
    console.log('cambio this.NroOrdenVenta', NroOrdenVenta)
    if (this.lastNroOrdenVenta !== NroOrdenVenta) {
      if (NroOrdenVenta > 0) {
        this.load(NroOrdenVenta);
      } else if (NroOrdenVenta == -2) {
        this.loadPlantilla();
      } else {
        this.clearForm()
      }
      this.lastNroOrdenVenta = NroOrdenVenta
    }
  })


  readonly panels = viewChildren(NzCollapsePanelComponent);



  panelActive = computed(() =>
    this.ordenVenta().items.map(
      (_, index, items) => index === items.length - 1
    )
  );

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
