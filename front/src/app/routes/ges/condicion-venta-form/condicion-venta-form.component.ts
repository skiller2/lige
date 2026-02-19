import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, model, output, computed, input, OnInit, effect, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { periodValidator, parsePeriod, periodToText } from '../../../shared/period-utils/period-utils';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { firstValueFrom, Subscription, distinctUntilChanged } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from '@delon/abc/loading';
import { DEFAULT_DECIMAL_MARKER, DEFAULT_THOUSAND_SEPARATOR } from 'src/app/app.config.defaults';

@Component({
  selector: 'app-condicion-venta-form',
  imports: [SHARED_IMPORTS, CommonModule, ObjetivoSearchComponent],
  templateUrl: './condicion-venta-form.component.html',
  styleUrl: './condicion-venta-form.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CondicionVentaFormComponent implements OnInit, OnDestroy {
  private readonly loadingSrv = inject(LoadingService);
  private apiService = inject(ApiService);
  private searchService = inject(SearchService);
  private decimalMarker = inject(DEFAULT_DECIMAL_MARKER);
  private thousandSeparator = inject(DEFAULT_THOUSAND_SEPARATOR);
  private periodoSubscription?: Subscription;
  private isNormalizingPeriodo = false;
  refreshCondVenta = model<number>(0);
  /*pristineChange = output<boolean>()*/
  isEdit = model(false);
  CondicionVentaId = model<number>(0);
  onAddorUpdate = output<('save' | 'delete')>();
  isLoading = signal(false);
  objetivoExtended = signal<any>(null);
  codobjId = model<string>('');
  objetivoId = model<number>(0);
  PeriodoDesdeAplica = model('');
  periodo = input<Date>();
  clienteId = signal<number>(0);
  $optionsTipoProducto = this.searchService.getTipoProductoSearch();

  $optionsTipoCantidad = this.searchService.getTipoCantidadSearch();
  $optionsTipoImporte = this.searchService.getTipoImporteSearch();
  mensajesHoras = signal<string>('');
  mensajesImporteLista = signal<Map<number, string>>(new Map());
  periodoFacturacionDescripcion = signal<string>('');

  textFacturaTemplate = 'Opciones: {Producto}; {PeriodoMes}; {PeriodoAnio}; {CantidadHoras}; {ImporteUnitario}; {ImporteTotal}';

  objProductos = {
    CondicionVentaProductoId: 0,
    ProductoCodigo: '',
    Cantidad: '',
    TipoImporte: '',
    TipoCantidad: '',
    ImporteUnitario: '',
    ImporteTotal: '',
    IndHorasAFacturar: null,
    TextoFactura: '',
    default: ''
  };


  fb = inject(FormBuilder)
  formCondicionVenta = this.fb.group({
    CondicionVentaId: 0,
    codobjId: '',
    ObjetivoId: 0,
    PeriodoDesdeAplica: '',
    PeriodoFacturacion: ['', [Validators.required, periodValidator({ min: '1D', max: '2A', allowedUnits: ['D', 'S', 'M', 'A'] })]],
    GeneracionFacturaDia: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1), Validators.max(31)]],
    GeneracionFacturaDiaComplemento: ['', [Validators.pattern('^[0-9]+$'), Validators.min(1), Validators.max(31)]],
    Observaciones: '',
    infoProductos: this.fb.array([this.fb.group({ ...this.objProductos })]),
    infoProductosOriginal: this.fb.array([this.fb.group({ ...this.objProductos })]),
  })


  constructor() {
    effect(() => {

      this.formCondicionVenta.patchValue({
        codobjId: this.codobjId(),
      });


    });

    effect(() => {
      const _codobj = this.codobjId();
      const _periodo = this.periodo();
      this.refrescarPreciosListaPrecios();
    });
  }

  infoProductos(): FormArray {
    return this.formCondicionVenta.get("infoProductos") as FormArray
  }

  addProductos(e?: MouseEvent): void {

    e?.preventDefault();
    const newGroup = this.fb.group({ ...this.objProductos });
    this.infoProductos().push(newGroup);
    newGroup.get('ImporteTotal')?.disable();

  }

  removeProductos(index: number, e: MouseEvent): void {

    e.preventDefault();
    if (this.infoProductos().length > 1) {
      this.infoProductos().removeAt(index)
    } else {
      this.infoProductos().clear();
      const newGroup = this.fb.group({ ...this.objProductos });
      this.infoProductos().push(newGroup);
      newGroup.get('ImporteTotal')?.disable();
    }
    this.formCondicionVenta.markAsDirty();
  }

  async newRecord() {

    if (this.codobjId() && this.PeriodoDesdeAplica()) {
      await this.load()
      //this.codobjId.set('')
      this.PeriodoDesdeAplica.set('')
      this.formCondicionVenta.patchValue({
        PeriodoDesdeAplica: '',
      });

    } else {
      //this.codobjId.set('')
      this.PeriodoDesdeAplica.set('')
      this.formCondicionVenta.enable()
      this.formCondicionVenta.reset();
      this.infoProductos().clear();
      const newGroup = this.fb.group({ ...this.objProductos });
      this.infoProductos().push(newGroup);
      newGroup.get('ImporteTotal')?.disable();
      this.formCondicionVenta.patchValue({
        ObjetivoId: this.objetivoId(),
      });
      this.formCondicionVenta.markAsPristine();
    }

  }



  async viewRecord(readonly: boolean) {
    if (this.codobjId() && this.PeriodoDesdeAplica())
      await this.load()
    if (readonly) {
      this.formCondicionVenta.disable()
      this.infoProductos().disable()
    } else {
      this.formCondicionVenta.enable()
      // Deshabilitar ImporteTotal después de habilitar el formulario
      this.infoProductos().controls.forEach(control => {
        control.get('ImporteTotal')?.disable();
      });
    }
    this.formCondicionVenta.markAsPristine()

  }

  async load() {

    let infoCliente = await firstValueFrom(this.searchService.getInfoCondicionVenta(this.codobjId(), this.PeriodoDesdeAplica()))
    // Limpiar el FormArray antes de agregar nuevos elementos
    this.infoProductos().clear();

    // Crear la cantidad correcta de grupos vacíos
    infoCliente.infoProductos.forEach(() => {
      this.infoProductos().push(this.fb.group({ ...this.objProductos }));
    });

    // Asegurar que siempre haya al menos un producto
    if (this.infoProductos().length === 0 && this.formCondicionVenta.enabled) {
      this.infoProductos().push(this.fb.group({ ...this.objProductos }));
    }

    this.formCondicionVenta.reset(infoCliente)

    // Limpiar mensajes de importes de lista de precios
    this.mensajesImporteLista.set(new Map());

    // Calcular totales, deshabilitar ImporteTotal y manejar tipo importe en un solo recorrido
    this.infoProductos().controls.forEach((control, index) => {
      const cantidad = control.get('Cantidad')?.value;
      const importeUnitario = control.get('ImporteUnitario')?.value;
      const tipoImporte = control.get('TipoImporte')?.value;

      if (cantidad && importeUnitario) {
        this.calcularTotal(index);
      } else {
        control.get('ImporteTotal')?.disable();
      }

      if (tipoImporte === 'LP') {
        control.get('ImporteUnitario')?.disable();
        this.obtenerPrecioListaPrecios(index);
      } else if (tipoImporte !== 'F') {
        control.get('ImporteUnitario')?.disable();
      }
    });

  }


  ngOnInit(): void {
    this.formCondicionVenta.patchValue({
      codobjId: this.codobjId(),
    });

    this.$optionsTipoProducto.subscribe(productos => {
      this.productosCache = productos;
    });

    this.formCondicionVenta.controls.PeriodoFacturacion.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(value => {
      const p = parsePeriod(value);
      this.periodoFacturacionDescripcion.set(p ? periodToText(p) : '');
    });

    // Suscribirse a cambios en PeriodoDesdeAplica para normalizar el valor
    const periodoControl = this.formCondicionVenta.get('PeriodoDesdeAplica');
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
      });
    }
  }

  ngOnDestroy(): void {
    if (this.periodoSubscription) {
      this.periodoSubscription.unsubscribe();
    }
  }

  objetivoDetalleChange(event: any) {
    if (event && event.clienteId && event.ClienteElementoDependienteId) {                                                                      
       this.codobjId.set(`${event.clienteId}/${event.ClienteElementoDependienteId}`);    
       this.clienteId.set(event.clienteId);
     } else {                                                                                                                                   
       this.codobjId.set('');                                                                                                                   
       this.clienteId.set(0);
    }
  }

  async save() {
    this.loadingSrv.open({ type: 'spin', text: '' });
    try {
      const formValue = this.formCondicionVenta.getRawValue();

      if (this.isEdit()) {
        //console.log("voy a actualizar condicion de venta")
        const result = await firstValueFrom(this.apiService.updateCondicionVenta(formValue, this.codobjId(), this.PeriodoDesdeAplica()));

      } else {
        // console.log("voy a insertar condicion de venta")
        const result = await firstValueFrom(this.apiService.addCondicionVenta(formValue));
        const clienteelementodependienteid = result.data.ClienteElementoDependienteId;
        const clienteid = result.data.ClienteId;
        this.codobjId.set(`${clienteid}/${clienteelementodependienteid}`);
        this.PeriodoDesdeAplica.set(result.data.PeriodoDesdeAplica);

        this.isEdit.set(true);

      }

      await this.load();
      this.onAddorUpdate.emit('save');
      this.formCondicionVenta.markAsUntouched();
      this.formCondicionVenta.markAsPristine();
    } catch (e) {
      console.error('Error al guardar condición de venta:', e);
    }
    this.loadingSrv.close();
    this.refreshCondVenta.update(v => v + 1)
  }

  calcularTotal(index: number) {
    const cantidad = this.infoProductos().at(index)?.get('Cantidad')?.value;
    const importeUnitario = this.infoProductos().at(index)?.get('ImporteUnitario')?.value;
    const importeTotal = Number(cantidad) * Number(importeUnitario);
    this.infoProductos().at(index)?.patchValue({
      ImporteTotal: importeTotal
    })
    this.infoProductos().at(index)?.get('ImporteTotal')?.disable();
  }

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

  async onTipoCantidadChange(tipoCantidad: string, index: number): Promise<void> {
    const cantidadControl = this.infoProductos().at(index)?.get('Cantidad')
    
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

  async obtenerMensajeHoras(tipoHoras: string, index: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getMensajeHoras(tipoHoras));
      // Actualizar el signal con el mensaje de respuesta
      this.mensajesHoras.set(response);
    } catch (error) {
      console.error('Error al obtener mensaje de horas:', error);
      this.mensajesHoras.set('Error al cargar mensaje');
    }
  }

  limpiarMensajeHoras(index: number): void {
    this.mensajesHoras.set('');
  }

  async obtenerPrecioListaPrecios(index: number): Promise<void> {
 
    const codobj = this.codobjId();
    

    if (!this.clienteId() || !this.periodo() ) {
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

  limpiarMensajeImporteLista(index: number): void {
    const newMap = new Map(this.mensajesImporteLista());
    newMap.delete(index);
    this.mensajesImporteLista.set(newMap);
  }

  private formatImporteSeparator2(value: number | string): string {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const sep = String(this.thousandSeparator);
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return intFormatted + String(this.decimalMarker) + decPart;
  }

  getMensajeImporteLista(index: number): string {
    return this.mensajesImporteLista().get(index) || '';
  }

  refrescarPreciosListaPrecios(): void {
    this.infoProductos().controls.forEach((control, index) => {
      if (control.get('TipoImporte')?.value === 'LP') {
        this.obtenerPrecioListaPrecios(index);
      }
    });
  }

  onProductoCodigoChange(productoCodigo: string, index: number): void {
    if (this.infoProductos().at(index)?.get('TipoImporte')?.value === 'LP') {
      this.obtenerPrecioListaPrecios(index);
    }
  }
  clearForm(): void {
    this.formCondicionVenta.reset()
    this.codobjId.set('')
    this.objetivoId.set(0)
    this.formCondicionVenta.patchValue({
      codobjId: '',
      ObjetivoId: 0,
    });

    this.PeriodoDesdeAplica.set('')
    this.infoProductos().clear()
    const newGroup = this.fb.group({ ...this.objProductos })
    this.infoProductos().push(newGroup)
    newGroup.get('ImporteTotal')?.disable()
    this.mensajesImporteLista.set(new Map())
    this.formCondicionVenta.markAsPristine()
  }

  private productosCache: any[] = [];

  getTextoFacturaPreview(index: number): string {
    const productoGroup = this.infoProductos().at(index);
    if (!productoGroup) return '';

    const textoFactura = (productoGroup.get('TextoFactura')?.value || '').trim();
    const productoCodigo = productoGroup.get('ProductoCodigo')?.value || '';
    const cantidad = productoGroup.get('Cantidad')?.value || '';
    const importeUnitario = productoGroup.get('ImporteUnitario')?.value || '';
    const importeTotal = productoGroup.get('ImporteTotal')?.value || '';

    let productoNombre = productoCodigo;
    if (this.productosCache && this.productosCache.length > 0) {
      const producto = this.productosCache.find((p: any) => p.ProductoCodigo === productoCodigo);
      productoNombre = producto?.Nombre || productoCodigo;
    }

    if (!textoFactura) {
      return productoNombre;
    }

    let periodoMes = '';
    let periodoAnio = '';
    
    if (this.periodo()) {
      const fecha = this.periodo();
      if (fecha && !isNaN(fecha.getTime())) {
        periodoMes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        periodoAnio = fecha.getFullYear().toString();
      }
    }

    // Reemplazar variables
    let preview = textoFactura
      .replace(/{Producto}/g, productoNombre)
      .replace(/{PeriodoMes}/g, periodoMes)
      .replace(/{PeriodoAnio}/g, periodoAnio)
      .replace(/{CantidadHoras}/g, cantidad)
      .replace(/{ImporteUnitario}/g, importeUnitario)
      .replace(/{ImporteTotal}/g, importeTotal);

    return preview;
  }

}
