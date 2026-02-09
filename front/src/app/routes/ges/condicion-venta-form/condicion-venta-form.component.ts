import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, model, output, computed, input, OnInit, effect, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { firstValueFrom, Subscription, distinctUntilChanged } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from '@delon/abc/loading';

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
  private periodoSubscription?: Subscription;
  private isNormalizingPeriodo = false;
  /*pristineChange = output<boolean>()*/

  CondicionVentaId = model<number>(0);
  onAddorUpdate = output<('save' | 'delete')>();
  isLoading = signal(false);
  objetivoExtended = signal<any>(null);
  codobjId = model<string>('');
  objetivoId = model<number>(0);
  PeriodoDesdeAplica = model('');
  periodo = input<Date>();
  $optionsTipoProducto = this.searchService.getTipoProductoSearch();

  $optionsTipoCantidad = this.searchService.getTipoCantidadSearch();
  $optionsTipoImporte = this.searchService.getTipoImporteSearch();

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
    PeriodoFacturacion: '',
    GeneracionFacturaDia: '',
    GeneracionFacturaDiaComplemento: '',
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

    // Calcular totales y deshabilitar ImporteTotal en un solo recorrido
    this.infoProductos().controls.forEach((control, index) => {
      const cantidad = control.get('Cantidad')?.value;
      const importeUnitario = control.get('ImporteUnitario')?.value;
      if (cantidad && importeUnitario) {
        this.calcularTotal(index);
      } else {
        control.get('ImporteTotal')?.disable();
      }
    });

  }


  ngOnInit(): void {
    this.formCondicionVenta.patchValue({
      codobjId: this.codobjId(),
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
  }

  async save() {
    this.loadingSrv.open({ type: 'spin', text: '' });
    try {
      const formValue = this.formCondicionVenta.getRawValue();

      if (this.codobjId()) {
        //console.log("voy a actualizar condicion de venta")
        const result = await firstValueFrom(this.apiService.updateCondicionVenta(formValue, this.codobjId(), this.PeriodoDesdeAplica()));

      } else {
        // console.log("voy a insertar condicion de venta")
        const result = await firstValueFrom(this.apiService.addCondicionVenta(formValue));
        const clienteelementodependienteid = result.data.ClienteElementoDependienteId;
        const clienteid = result.data.ClienteId;
        this.codobjId.set(`${clienteid}/${clienteelementodependienteid}`);
        this.PeriodoDesdeAplica.set(result.data.PeriodoDesdeAplica);

      }

      await this.load();
      this.onAddorUpdate.emit('save');
      this.formCondicionVenta.markAsUntouched();
      this.formCondicionVenta.markAsPristine();
    } catch (e) {
      console.error('Error al guardar condición de venta:', e);
    }
    this.loadingSrv.close();

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
    
    if (tipoImporte !== 'F') {
      // Si no es 'F', deshabilitar y limpiar el campo
      importeUnitarioControl?.setValue('');
      importeUnitarioControl?.disable();
    } else {
      // Si es 'F', habilitar el campo
      importeUnitarioControl?.enable();
    }

    // Actualizar el campo TextoFactura con el tipo de importe y el período
    await this.actualizarTextoFactura(tipoImporte, index);
  }

  onTipoCantidadChange(tipoCantidad: string, index: number): void {
    const cantidadControl = this.infoProductos().at(index)?.get('Cantidad');
    
    if (tipoCantidad !== 'F') {
      // Si no es 'F', deshabilitar y limpiar el campo
      cantidadControl?.setValue('');
      cantidadControl?.disable();
    } else {
      // Si es 'F', habilitar el campo
      cantidadControl?.enable();
    }
  }

  async actualizarTextoFactura(tipoImporte: string, index: number): Promise<void> {
    if (!tipoImporte) {
      return;
    }

    // Obtener el label del tipo de importe seleccionado
    const tiposImporte = await firstValueFrom(this.$optionsTipoImporte);
    const tipoImporteSeleccionado = tiposImporte.find((option: any) => option.value === tipoImporte);
    
    if (!tipoImporteSeleccionado) {
      return;
    }

    // Obtener el período seleccionado
    let periodoFormateado = '';
    
    if (this.periodo()) {
      const fecha = this.periodo();
     if (fecha && !isNaN(fecha.getTime())) {
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        periodoFormateado = `${mes}/${anio}`;
      }
    }

    // Construir el texto: "Tipo Importe - Período"
    const textoFactura = periodoFormateado 
      ? `${tipoImporteSeleccionado.label} - ${periodoFormateado}`
      : tipoImporteSeleccionado.label;

    // Actualizar el campo TextoFactura
    this.infoProductos().at(index)?.patchValue({
      TextoFactura: textoFactura
    });
  }

  clearForm(): void {
    this.formCondicionVenta.reset();
    this.codobjId.set('');
    this.formCondicionVenta.patchValue({
      codobjId: '',
      ObjetivoId: 0,
    });

    this.PeriodoDesdeAplica.set('');
    this.infoProductos().clear();
    const newGroup = this.fb.group({ ...this.objProductos });
    this.infoProductos().push(newGroup);
    newGroup.get('ImporteTotal')?.disable();
    this.formCondicionVenta.markAsPristine();
  }

}
