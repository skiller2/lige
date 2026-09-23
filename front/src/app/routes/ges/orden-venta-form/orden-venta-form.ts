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


// Productos que facturan las horas 'A' y 'B' cargadas en la asistencia
const PRODUCTO_HORAS_A = 'SSF'
const PRODUCTO_HORAS_B = 'SSFB'
const PRODUCTOS_HORAS = [PRODUCTO_HORAS_A, PRODUCTO_HORAS_B]


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
  Periodo: Date | null,
  ObjetivoId: number,
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
})


export class OrdenVentaFormComponent {

  anio = input<number>(0)
  mes = input<number>(0)

  ClienteId = input<number | null>(null)
  ClienteElementoDependienteId = input<number | null>(null)

  soloLectura = input<boolean>(false)
  origenCrud = input<boolean>(false)

  NroOrdenVenta = input<number>(0)


  ordenVentaGuardada = output<number>()

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  readonly panels = viewChildren(NzCollapsePanelComponent);

  optionsTipoCantidad = toSignal(this.searchService.getTipoCantidadSearch(), { initialValue: [] })
  optionsTipoImporte = toSignal(this.searchService.getTipoImporteSearch(), { initialValue: [] })
  optionsComprobanteTipo = toSignal(this.searchService.getComprobanteTipoSearch(), { initialValue: [] })
  optionsTipoProducto = toSignal(this.searchService.getTipoProductoSearch(), { initialValue: [] })
  optionsEstado = toSignal(this.searchService.getEstadoOrdenVenta(), { initialValue: [] })

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
    Periodo: new Date(this.anio(),this.mes()-1,1),
    ObjetivoId: 0,

    EstadoOrdenVentaCodigo: '',
    ClienteId: Number(this.ClienteId()),
    ClienteElementoDependienteId: Number(this.ClienteElementoDependienteId()),
    Observaciones: '',
    items: [structuredClone(this.defaultProducto)],
    comprobantes: [structuredClone(this.defaultComprobante)],
  }

  readonly ordenVenta = signal<OrdenVentaForm>(this.defaultOrdenVenta);

  readonly formOrdenVenta = form(this.ordenVenta, (p) => {
    disabled(p, () => {return (this.soloLectura() )})
    //disabled(p, () => {return (this.soloLectura() || (String(p.EstadoOrdenVentaCodigo)=='FAC'))})
    applyEach(p.items, (productoPath) => {
      required(productoPath.ProductoCodigo, { message: 'Código de producto es requerido', when: (ctx) => Number(ctx.valueOf(productoPath.Cantidad)) > 0, });
      required(productoPath.Cantidad, { message: 'Cantidad es requerido', when: (ctx) => ctx.valueOf(productoPath.ProductoCodigo) != "", });

      disabled(productoPath.ImporteUnitario)
    });
    // Con "Facturado" los tres datos del comprobante son obligatorios; si no, van los tres juntos
    // o ninguno
    applyEach(p.comprobantes, (comprobantePath) => {
      required(comprobantePath.ComprobanteTipoCodigo, { message: 'Código comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteNro) != "" });
      required(comprobantePath.ComprobanteNro, { message: 'Número de comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) != "" });
      //required(comprobantePath.ImporteTotal, { message: 'Importe total del comprobante requerido', when: (ctx) => ctx.valueOf(comprobantePath.ComprobanteTipoCodigo) != "" || ctx.valueOf(comprobantePath.ComprobanteNro) != "" || this.esFacturado(), });
    });

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

  addItem(e?: MouseEvent): void {
    e?.preventDefault();
    const newProducto = structuredClone(this.defaultProducto)
    this.ordenVenta.update(m => ({ ...m, items: [...m.items, newProducto] }));
  }

  /*
  private aplicarPrecioDeLista(item: AbstractControl, importeUnitario: number | null) {
    const precioDeLista = importeUnitario != null

    item.patchValue({
      PrecioDeLista: precioDeLista,
      TipoImporte: precioDeLista ? TIPO_IMPORTE_LISTA_PRECIO : TIPO_IMPORTE_MANUAL,
      ImporteUnitario: precioDeLista ? Number(importeUnitario) : 0
    })
  }
  */


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
    const plantilla = await firstValueFrom(this.apiService.getPlantillaOrdenVenta(Number(this.ClienteId()), Number(this.ClienteElementoDependienteId()), this.anio(), this.mes()))
    this.ordenVenta.update(m => ({ ...m, ...plantilla }))
    if (this.ordenVenta().items.length == 0)
      this.addItem()
    if (this.ordenVenta().comprobantes.length == 0)
      this.addComprobante()

//    setTimeout(() => { this.formOrdenVenta().reset() }, 0);   // Hack para resetear el estado de dirty/pristine después de cargar los datos, ya que el form no detecta que se cargaron nuevos datos y queda dirty
  }


  async save(opciones: { silencioso?: boolean } = {}) {
    if (this.soloLectura() || this.formOrdenVenta().submitting() || this.formOrdenVenta().dirty() == false || this.formOrdenVenta().valid() == false) return undefined

    await submit(this.formOrdenVenta, async (form) => {
      try {
        const formValue = form().value();
        const respuesta = await firstValueFrom(this.apiService.setOrdenVenta(formValue))
        await this.load(respuesta.data.NroOrdenVenta)
        this.ordenVentaGuardada.emit(respuesta.data.NroOrdenVenta)
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      return undefined

    })
  }

  clearForm(): void {
    const newOrdenVenta = structuredClone(this.defaultOrdenVenta)
    newOrdenVenta.ClienteElementoDependienteId=Number(this.ClienteElementoDependienteId())
    newOrdenVenta.ClienteId=Number(this.ClienteId())
    if (this.anio()>0 && this.mes()>0)
      newOrdenVenta.Periodo=new Date(this.anio(),this.mes()-1,1)
    else 
      newOrdenVenta.Periodo=null
    newOrdenVenta.NroOrdenVenta=0
    newOrdenVenta.EstadoOrdenVentaCodigo='PEN'
    this.ordenVenta.set(newOrdenVenta)
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

  auditoria = signal<any>(null)

  // Se pide al abrir el popover: así muestra la última modificación, aunque se acabe de guardar
  async loadAuditoria() {
    // Se limpia para que no se vea la auditoría de la orden abierta antes
    this.auditoria.set(null)
    if (!this.NroOrdenVenta()) return
    this.auditoria.set(await firstValueFrom(this.searchService.getOrdenVentaAuditoria(this.NroOrdenVenta())))
  }
}
