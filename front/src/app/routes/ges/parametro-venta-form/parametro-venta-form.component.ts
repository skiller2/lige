import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, model, output, computed, input, OnInit, effect, OnDestroy, untracked, linkedSignal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { periodValidator, parsePeriod, periodToText, toApproxDays, PeriodUnit } from '../../../shared/period-utils/period-utils';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { firstValueFrom, Subscription, distinctUntilChanged } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from '@delon/abc/loading';
import { DEFAULT_DECIMAL_MARKER, DEFAULT_THOUSAND_SEPARATOR } from 'src/app/app.config.defaults';
import { applyEach, disabled, form, FormField, hidden, required, submit, validateTree } from '@angular/forms/signals';


export interface Producto {
  ParametroVentaProductoId: number;
  ProductoCodigo: string;
  CantidadHoras: string;
  TipoImporte: string;
  TipoCantidad: string;
  ImporteUnitario: string;
  ImporteTotal: string;
  IndHorasAFacturar: boolean | null;
  TextoFactura: string;
  default: string;
}

export interface ParametroVentaForm {
  ParametroVentaId: number;
  ObjetivoId: number;
  ClienteId: number;
  ClienteElementoDependienteId: number;
  PeriodoDesdeAplica: string;
  PeriodoFacturacion: string;
  PeriodoFacturacionInicio: string;
  GeneracionFacturaDia: number;             // 1..31
  GeneracionFacturaReqCliente: boolean;
  GeneracionFacturaDiaComplemento: number;  // 1..31 opcional
  UnificacionFactura: boolean;
  Observaciones: string;
  infoProductos: Producto[];
  infoProductosOriginal: Producto[];
}


import { SchemaPathTree, validate, pattern } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';




export function periodRange(
  path: SchemaPathTree<string>,
  opts: { min: string; max: string; allowedUnits: PeriodUnit[]; message?: string }
) {
  validate(path, (ctx) => {
    const v = (ctx.value() ?? '').trim();
    if (!v) return null; // 'required' se ocupa del vacío

    const parsed = parsePeriod(v);
    if (!parsed) return { kind: 'period_format', message: opts.message ?? 'Periodo inválido' };
    if (!opts.allowedUnits.includes(parsed.unit)) {
      return { kind: 'period_unit', message: opts.message ?? 'Unidad no permitida' };
    }
    const minP = parsePeriod(opts.min)!;
    const maxP = parsePeriod(opts.max)!;
    const days = toApproxDays({ value: parsed.value, unit: parsed.unit });
    const minDays = toApproxDays({ value: minP.value, unit: minP.unit });
    const maxDays = toApproxDays({ value: maxP.value, unit: maxP.unit });
    if (days < minDays || days > maxDays) {
      return { kind: 'period_range', message: opts.message ?? `Debe estar entre ${opts.min} y ${opts.max}` };
    }
    return null;
  });

  // Si querés además forzar el patrón de formato:
  pattern(path, /^[0-9]+[DSMA]$/, { message: 'Use número seguido de unidad (D,S,M,A), p. ej. 10D' });
}

export function numericRange(
  path: SchemaPathTree<number | null>,
  opts: {
    min: number; max: number; optional?: boolean; message?: string;
    when: (ctx: any) => boolean;      // <- condición para ejecutar la validación
  }
) {
  validate(path, (ctx) => {

    if (!opts.when(ctx)) return null;

    const v = ctx.value();
    if (v == null || (v as any) === '') {
      return opts.optional ? null : { kind: 'required', message: opts.message ?? 'Requerido' };
    }
    const n = Number(v);
    if (Number.isNaN(n)) return { kind: 'number', message: opts.message ?? 'Debe ser numérico' };
    if (n < opts.min || n > opts.max) {
      return { kind: 'range', message: opts.message ?? `Entre ${opts.min} y ${opts.max}` };
    }
    return null;
  });
}

@Component({
  selector: 'app-parametro-venta-form',
  imports: [SHARED_IMPORTS, CommonModule, ObjetivoSearchComponent, FormField, FormsModule,
  ],
  templateUrl: './parametro-venta-form.component.html',
  styleUrl: './parametro-venta-form.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ParametroVentaFormComponent implements OnInit, OnDestroy {
  private readonly loadingSrv = inject(LoadingService);
  private apiService = inject(ApiService);
  private searchService = inject(SearchService);
  refreshCondVenta = model<number>(0);
  isEdit = model(false);
  ParametroVentaId = model<number>(0);

  // Signals para manejar la carga pendiente en modo view/edit
  private pendingViewLoad = signal<boolean>(false);
  private viewReadonly = signal<boolean>(false);
  objetivoExtended = signal<any>(null);

  ClienteId = input<number>(0);
  ClienteElementoDependienteId = input<number>(0);
  PeriodoDesdeAplica = input<Date>(new Date());

  periodo = input<Date>(new Date());
  
  optionsTipoProducto = toSignal(this.searchService.getTipoProductoSearch(),{initialValue: []})

  optionsTipoCantidad = toSignal(this.searchService.getTipoCantidadSearch(),{initialValue: []})
  optionsTipoImporte = toSignal(this.searchService.getTipoImporteSearch(), { initialValue: [] })


  mensajesHoras = signal<Map<number, string>>(new Map());
  mensajesImporteLista = signal<Map<number, string>>(new Map());

  periodoFacturacionDescripcion = computed(() => { return periodToText(parsePeriod(this.parametroVenta().PeriodoFacturacion)) });
  periodoFacturacionDias = computed(() => { return toApproxDays(parsePeriod(this.parametroVenta().PeriodoFacturacion)) });
  textFacturaTemplate = 'Opciones: {Producto}; {PeriodoMes}; {PeriodoAnio}; {CantidadHoras}; {ImporteUnitario}; {ImporteTotal}';

  private readonly defaultProducto: Producto = {
    ParametroVentaProductoId: 0,
    ProductoCodigo: '',
    CantidadHoras: '',
    TipoImporte: '',
    TipoCantidad: '',
    ImporteUnitario: '',
    ImporteTotal: '',
    IndHorasAFacturar: null,
    TextoFactura: '',
    default: '',
  };

  private readonly defaultFormParamVenta: ParametroVentaForm = {
    ParametroVentaId: 0,
    ObjetivoId: 0,
    ClienteId: 0,
    ClienteElementoDependienteId: 0,
    PeriodoDesdeAplica: '',
    PeriodoFacturacion: '',
    PeriodoFacturacionInicio: '',
    GeneracionFacturaDia: 0,
    GeneracionFacturaReqCliente: false,
    GeneracionFacturaDiaComplemento: 0,
    UnificacionFactura: false,
    Observaciones: '',
    infoProductos: [structuredClone(this.defaultProducto)],
    infoProductosOriginal: [structuredClone(this.defaultProducto)],
  }

  readonly parametroVenta = signal<ParametroVentaForm>(this.defaultFormParamVenta);

  readonly formParametroVenta = form(this.parametroVenta, (p) => {
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


    applyEach(p.infoProductos, (productoPath) => {
      required(productoPath.ProductoCodigo, { message: 'Código de producto es requerido' });
      required(productoPath.TipoImporte, { message: 'Tipo de importe es requerido' });
      required(productoPath.TipoCantidad, { message: 'Tipo de cantidad es requerido' });
    });
  })


  infoProductos(): FormArray<any> {
    //    return this.formParametroVenta.get("infoProductos") as FormArray
    return new FormArray<any>([])
  }


  addProductos(e?: MouseEvent): void {

    e?.preventDefault();

    const newProducto = structuredClone(this.defaultProducto)

    this.parametroVenta.update(m => ({
      ...m,
      infoProductos: [...m.infoProductos, newProducto],
    }));

  }

  removeProductos(index: number, e: MouseEvent): void {

    e.preventDefault();

    if (this.parametroVenta().infoProductos.length == 0)

      this.parametroVenta.update(m => ({
        ...m,
        infoProductos: m.infoProductos.filter((_, i) => i !== index),
      }));

    if (this.parametroVenta().infoProductos.length == 0) {
      this.addProductos(undefined)
    }

    this.formParametroVenta().markAsDirty();
  }

  async newRecord() {
    this.formParametroVenta().reset(this.defaultFormParamVenta)
//    this.parametroVenta.set(this.defaultFormParamVenta)

    if (this.ClienteId() && this.ClienteElementoDependienteId() && this.PeriodoDesdeAplica()) {
      await this.load()

      const tmp = this.parametroVenta()
      tmp.ParametroVentaId = 0;
      tmp.ClienteId = this.ClienteId();
      tmp.ClienteElementoDependienteId = this.ClienteElementoDependienteId();
      tmp.PeriodoDesdeAplica = '';
      tmp.infoProductos = tmp.infoProductos.map(p => ({ ...p, ParametroVentaProductoId: 0 }));

      this.parametroVenta.update(m => ({
        ...m, tmp
      }));

    } else {

      this.parametroVenta.update(m => ({
        ...m, ClienteId: this.ClienteId()|0, ClienteElementoDependienteId: this.ClienteElementoDependienteId()|0, PeriodoDesdeAplica: ''
      }));

    }

  }


//TODO: No es necesario
  async viewRecord(readonly: boolean) {
    this.viewReadonly.set(readonly);

    if (this.ClienteId() && this.PeriodoDesdeAplica() && this.ClienteElementoDependienteId()) {
      await this.load();
      this.applyViewMode(readonly);
    } else {
      this.pendingViewLoad.set(true);
    }
  }

  private applyViewMode(readonly: boolean): void {
    /*
    if (readonly) {
  this.formParametroVenta.disable();
  this.infoProductos().disable();
  } else {
  this.formParametroVenta.enable();
  // Deshabilitar ImporteTotal después de habilitar el formulario
  this.infoProductos().controls.forEach(control => {
    control.get('ImporteTotal')?.disable();
  });
  }
  this.formParametroVenta.markAsPristine();
  */
  }

  /*
  private async executeViewLoad(): Promise<void> {
  await this.load();
  this.applyViewMode(this.viewReadonly());
  }
  */

  async load() {
    if (!this.ClienteId() || !this.ClienteElementoDependienteId() || !this.PeriodoDesdeAplica()) {
      return;
    }

    const paramtroVenta = await firstValueFrom(this.searchService.getInfoParametroVenta(this.ClienteId(),this.ClienteElementoDependienteId(), this.PeriodoDesdeAplica()))
    this.formParametroVenta().reset(paramtroVenta)
  }


  ngOnInit(): void {
    //this.parametroVenta.patchValue({
    //codobjId: this.codobjId(),
    //});

    //this.$optionsTipoProducto.subscribe(productos => {
    //this.productosCache = productos;
    //});
    /*
        this.formParametroVenta.controls.PeriodoFacturacion.valueChanges.pipe(
          distinctUntilChanged()
        ).subscribe(value => {
          const p = parsePeriod(value);
          this.periodoFacturacionDescripcion.set(p ? periodToText(p) : '');
    
          // Mostrar PeriodoFacturacionInicio si el período es mayor a 1 mes (aprox 30 días)
          const esMayorAUnMes = p && toApproxDays(p) > 30;
          this.mostrarPeriodoFacturacionInicio.set(!!esMayorAUnMes);
    
          // Si se muestra y no tiene valor, establecer el valor por defecto de PeriodoDesdeAplica
          if (esMayorAUnMes && !this.formParametroVenta.get('PeriodoFacturacionInicio')?.value) {
            const periodoDesdeAplica = this.formParametroVenta.get('PeriodoDesdeAplica')?.value;
            if (periodoDesdeAplica) {
              this.formParametroVenta.patchValue({ PeriodoFacturacionInicio: periodoDesdeAplica });
            }
          }
        });
    
        // Suscribirse a cambios en GeneracionFacturaReqCliente
        this.reqClienteSubscription = this.formParametroVenta.controls.GeneracionFacturaReqCliente.valueChanges.subscribe(checked => {
          this.applyReqClienteState(!!checked);
        });
    
        // Suscribirse a cambios en PeriodoDesdeAplica para normalizar el valor
        const periodoControl = this.formParametroVenta.get('PeriodoDesdeAplica');
        if (periodoControl) {
          this.periodoSubscription = periodoControl.valueChanges.pipe(
            distinctUntilChanged()
          ).subscribe((value: string | Date | null) => {
            if (!this.isNormalizingPeriodo && value) {
              const date = value instanceof Date ? value : new Date(value);
              if (!isNaN(date.getTime())) {
                const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
                // Solo normalizar si la fecha no está ya normalizada (no es el primer día del mes)
                if (date.getDate() !== 1 || date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0) {
                  this.isNormalizingPeriodo = true;
                  periodoControl.setValue(normalizedDate.toISOString(), { emitEvent: false });
                  this.isNormalizingPeriodo = false;
                }
              }
            }
            this.refrescarPreciosListaPrecios();
          });
        }
        */
  }

  ngOnDestroy(): void {
    /*
    if (this.periodoSubscription) {
      this.periodoSubscription.unsubscribe();
    }
    if (this.reqClienteSubscription) {
      this.reqClienteSubscription.unsubscribe();
    }
    */
  }
  /*
    private applyReqClienteState(checked: boolean): void {
      const diaControl = this.formParametroVenta.get('GeneracionFacturaDia');
      const diaComplementoControl = this.formParametroVenta.get('GeneracionFacturaDiaComplemento');
      if (checked) {
        diaControl?.setValue('', { emitEvent: false });
        diaComplementoControl?.setValue('', { emitEvent: false });
        diaControl?.disable({ emitEvent: false });
        diaComplementoControl?.disable({ emitEvent: false });
        diaControl?.clearValidators();
        diaControl?.updateValueAndValidity({ emitEvent: false });
      } else {
        diaControl?.enable({ emitEvent: false });
        diaComplementoControl?.enable({ emitEvent: false });
        diaControl?.setValidators([Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1), Validators.max(31)]);
        diaControl?.updateValueAndValidity({ emitEvent: false });
      }
    }
  */
   

  async save() {
    await submit(this.formParametroVenta, async (form) => {
      try {
        const formValue = form().value;

        if (this.isEdit()) {
          //console.log("voy a actualizar condicion de venta")
          const result = await firstValueFrom(this.apiService.updateParametroVenta(formValue));

        } else {
          // console.log("voy a insertar condicion de venta")
          await firstValueFrom(this.apiService.addParametroVenta(formValue));
          this.isEdit.set(true);

        }

        await this.load();
        //      this.formParametroVenta.markAsUntouched();
        //      this.formParametroVenta.markAsPristine();
        this.refreshCondVenta.update(v => v + 1)

      } catch (e) {
        console.error('Error al guardar condición de venta:', e);
      } finally {
        //        this.loadingSrv.close();
      }
    })
  }

  calcularTotal(index: number) {
    const cantidad = this.infoProductos().at(index)?.get('CantidadHoras')?.value;
    const importeUnitario = this.infoProductos().at(index)?.get('ImporteUnitario')?.value;
    const importeTotal = Number(cantidad) * Number(importeUnitario);
    this.infoProductos().at(index)?.patchValue({
      ImporteTotal: importeTotal
    })
    this.infoProductos().at(index)?.get('ImporteTotal')?.disable();
  }
/*
  async onTipoImporteChange(tipoImporte: string, index: number): Promise<void> {
    const importeUnitarioControl = this.infoProductos().at(index)?.get('ImporteUnitario');

    if (tipoImporte === 'LP') {
      importeUnitarioControl?.setValue('');
      importeUnitarioControl?.disable();
      await this.obtenerPrecioListaPrecios(index);
    } else if (tipoImporte !== 'F') {
      importeUnitarioControl?.setValue('');
      importeUnitarioControl?.disable();
      this.limpiarMensajeImporteLista(index);
    } else {
      importeUnitarioControl?.enable();
      this.limpiarMensajeImporteLista(index);
    }

  }
*/
/*
  async onTipoCantidadChange(tipoCantidad: string, index: number): Promise<void> {
    const cantidadControl = this.infoProductos().at(index)?.get('CantidadHoras')

    if (tipoCantidad === 'A' || tipoCantidad === 'B') {

      cantidadControl?.setValue('')
      cantidadControl?.disable()
      await this.obtenerMensajeHoras(tipoCantidad, index)

    } else if (tipoCantidad !== 'F') {
      cantidadControl?.setValue('')
      cantidadControl?.disable()
      // Limpiar mensaje si existe
      this.limpiarMensajeHoras(index)
    } else {
      cantidadControl?.enable()
      // Limpiar mensaje si existe
      this.limpiarMensajeHoras(index)
    }
  }
*/
/*
  async obtenerMensajeHoras(tipoHoras: string, index: number): Promise<void> {
    const objetivoId = this.parametroVenta().ObjetivoId;
    const periodo = this.periodo();

    if (!objetivoId || !periodo) {
      const newMap = new Map(this.mensajesHoras());
      newMap.set(index, 'Debe completar Objetivo y Período');
      this.mensajesHoras.set(newMap);
      return;
    }

    const anio = periodo.getFullYear();
    const mes = periodo.getMonth() + 1;

    try {
      const response = await firstValueFrom(this.apiService.getMensajeHoras(tipoHoras, objetivoId, anio, mes));
      if response.data.mensaje
      const newMap = new Map(this.mensajesHoras());
      newMap.set(index, response);
      this.mensajesHoras.set(newMap);
    } catch (error) {
      console.error('Error al obtener mensaje de horas:', error);
      const newMap = new Map(this.mensajesHoras());
      newMap.set(index, 'Error al cargar mensaje');
      this.mensajesHoras.set(newMap);
    }
  }
*/
  limpiarMensajeHoras(index: number): void {
    const newMap = new Map(this.mensajesHoras());
    newMap.delete(index);
    this.mensajesHoras.set(newMap);
  }

  getMensajeHoras(index: number): string {
    return this.mensajesHoras().get(index) || '';
  }


  /*
  async obtenerPrecioListaPrecios(index: number): Promise<void> {

    const codobj = this.codobjId();


    if (!this.clienteId() || !this.periodo()) {
      const newMap = new Map(this.mensajesImporteLista());
      newMap.set(index, 'Debe completar Objetivo, Período y Producto para consultar lista de precios');
      this.mensajesImporteLista.set(newMap);
      return;
    }

    try {
      const productoCodigo = this.infoProductos().at(index)?.get('ProductoCodigo')?.value || '';

      const anio = this.periodo()?.getFullYear() || 0;
      const mes = this.periodo() ? this.periodo()!.getMonth() + 1 : 0;

      const response = await firstValueFrom(this.apiService.getPrecioListaPrecios(this.clienteId(), this.periodo(), productoCodigo));
      const newMap = new Map(this.mensajesImporteLista());
      if (response && response.encontrado) {
        newMap.set(index, `${this.formatImporteSeparator2(response.importe)} - Período ${anio}/${mes}`);
      } else {
        newMap.set(index, `Sin importe cargado en lista de precios para período ${anio}/${mes}`);
      }
      this.mensajesImporteLista.set(newMap);
    } catch (error) {
      console.error('Error al obtener precio lista de precios:', error);
      const newMap = new Map(this.mensajesImporteLista());
      newMap.set(index, 'Error al consultar lista de precios');
      this.mensajesImporteLista.set(newMap);
    }
  }
*/
  limpiarMensajeImporteLista(index: number): void {
    const newMap = new Map(this.mensajesImporteLista());
    newMap.delete(index);
    this.mensajesImporteLista.set(newMap);
  }

  getMensajeImporteLista(index: number): string {
    return this.mensajesImporteLista().get(index) || '';
  }
/*
  refrescarPreciosListaPrecios(): void {
    this.infoProductos().controls.forEach((control, index) => {
      if (control.get('TipoImporte')?.value === 'LP') {
        this.obtenerPrecioListaPrecios(index);
      }
    });
  }
*/
  /*
  refrescarMensajesHoras(): void {
    this.infoProductos().controls.forEach((control, index) => {
      const tipoCantidad = control.get('TipoCantidad')?.value;
      if (tipoCantidad === 'A' || tipoCantidad === 'B') {
        this.obtenerMensajeHoras(tipoCantidad, index);
      }
    });
  }
  */
/*
  onProductoCodigoChange(productoCodigo: string, index: number): void {
    if (this.infoProductos().at(index)?.get('TipoImporte')?.value === 'LP') {
      this.obtenerPrecioListaPrecios(index);
    }
  }
*/
  clearForm(): void {
    this.formParametroVenta().reset(this.defaultFormParamVenta)
  }

  getCantidad = computed(() => {
    return this.parametroVenta().infoProductos.map(async producto => {
      const TipoCantidad = producto.TipoCantidad || '';
      const ClienteId = this.parametroVenta().ClienteId || 0;
      const ClienteElementoDependienteId = this.parametroVenta().ClienteElementoDependienteId || 0;

      switch (TipoCantidad) {
        case 'A':
        case 'B':
          const response = await firstValueFrom(this.apiService.getMensajeHoras(TipoCantidad, ClienteId, ClienteElementoDependienteId, this.periodo().getFullYear(), this.periodo().getMonth() + 1));
          return response
          
        case 'F':
          return '';
        default:
          return '';
      }
    })
  })



  getImporteUnitario = computed(() => {
    return this.parametroVenta().infoProductos.map(async producto => {
      const tipoImporte = producto.TipoImporte || '';
      const productoCodigo = producto.ProductoCodigo || '';
      const ClienteId = this.parametroVenta().ClienteId || 0;
      const ClienteElementoDependienteId = this.parametroVenta().ClienteElementoDependienteId || 0;

      switch (tipoImporte) {
        case 'LP':
          const precio = await firstValueFrom(this.apiService.getPrecioListaPrecios(ClienteId,ClienteElementoDependienteId, this.periodo().getFullYear(), this.periodo().getMonth() + 1, productoCodigo));
          if (precio.PeriodoDesdeAplica) { 
            return precio.Importe
          }
          return 0;
        default:
          return producto.ImporteUnitario || 0;
      }
    })
  })

  getTextoFacturaPreview = computed(() => {
    
    return this.parametroVenta().infoProductos.map(producto => {
      let textoFactura = (producto.TextoFactura || '').trim();
      const productoCodigo = producto.ProductoCodigo || '';
      if (!productoCodigo) return ''

      const periodoMes = (this.periodo().getMonth() + 1).toString().padStart(2, '0') || '';
      const periodoAnio = this.periodo().getFullYear().toString() || '';

      const productoNombre = this.optionsTipoProducto().find((p: { ProductoCodigo: string; }) => p.ProductoCodigo === productoCodigo)?.Nombre || productoCodigo;

      //TODO: pendiente verificar los tipos de importe y cantidad,  por si las tengo que ir a buscar 
      const importeUnitario = producto.ImporteUnitario || '';
      const cantidad = producto.CantidadHoras || '';

      if (!textoFactura)
        textoFactura = '{Producto} {PeriodoMes}/{PeriodoAnio}'

      


      const preview = textoFactura
        .replace(/{Producto}/g, productoNombre)
        .replace(/{PeriodoMes}/g, periodoMes)
        .replace(/{PeriodoAnio}/g, periodoAnio)
        .replace(/{CantidadHoras}/g, cantidad || 'N/A')
        .replace(/{ImporteUnitario}/g, importeUnitario || 'N/A')
        .replace(/{ImporteTotal}/g, cantidad && importeUnitario ? (Number(cantidad) * Number(importeUnitario)).toFixed(2) : 'N/A');

      return preview;

    });
    
  });

}
