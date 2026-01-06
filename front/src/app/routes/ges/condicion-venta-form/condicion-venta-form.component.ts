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
  PeriodoDesdeAplica = model('');

  $optionsTipoProducto = this.searchService.getTipoProductoSearch();

  objProductos = {
    Cantidad: '',
    ImporteFijo: null,
    IndCantidadHorasVenta: null,
    IndImporteAcuerdoConCliente: null,
    IndImporteListaPrecio: null,
    ProductoCodigo: '',
    TextoFactura: ''
  }


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
    this.infoProductos().push(this.fb.group({ ...this.objProductos }))

  }

  removeProductos(index: number, e: MouseEvent): void {

    e.preventDefault();
    if (this.infoProductos().length > 1) {
      this.infoProductos().removeAt(index)
    } else {
      this.infoProductos().clear()
      this.infoProductos().push(this.fb.group({ ...this.objProductos }))
    }
    this.formCondicionVenta.markAsDirty();
  }


   /*checkPristine() {
    this.pristineChange.emit(this.formCondicionVenta.pristine);
  }




  objetivoDetalleChange(event: any) {
    if (event && event.clienteId && event.ClienteElementoDependienteId !== undefined) {
      this.objetivoExtended.set(event);
      this.formCondicionVenta.patchValue({
        ClienteId: event.clienteId,
        ClienteElementoDependienteId: event.ClienteElementoDependienteId,
        ObjetivoId: event.objetivoId || 0,
      });
    } else {
      this.objetivoExtended.set(null);
      this.formCondicionVenta.patchValue({
        ClienteId: 0,
        ClienteElementoDependienteId: 0,
        ObjetivoId: 0,
      });
    }
  }


  async newRecord() {
    this.formCondicionVenta.reset({
      id: 0,
      ClienteId: 0,
      ClienteElementoDependienteId: 0,
      ObjetivoId: 0,
      PeriodoDesdeAplica: null,
      PeriodoFacturacion: '',
      GeneracionFacturaDia: null,
      GeneracionFacturaDiaComplemento: null,
      Observaciones: '',
    });
    this.CondicionVentaId.set(0);
    this.objetivoExtended.set(null);
    this.formCondicionVenta.markAsPristine();
  }
*/
  

  async viewRecord(readonly: boolean) {
    if (this.codobjId() && this.PeriodoDesdeAplica())
      await this.load()
    if (readonly){
      this.formCondicionVenta.disable()
    }else{
      this.formCondicionVenta.enable()
      this.formCondicionVenta.get('PeriodoDesdeAplica')?.disable()
      this.formCondicionVenta.get('ObjetivoId')?.disable()
    }
    this.formCondicionVenta.markAsPristine()

  }

  async load() {

    let infoCliente = await firstValueFrom(this.searchService.getInfoCondicionVenta( this.codobjId(), this.PeriodoDesdeAplica()))
    console.log("infoCliente ", infoCliente)

    // Limpiar el FormArray antes de agregar nuevos elementos
    this.infoProductos().clear();

   infoCliente.infoProductos.forEach((obj: any) => {
     this.infoProductos().push(this.fb.group({ ...this.objProductos }))
   });
console.log("infoProductos", this.infoProductos())
   this.formCondicionVenta.reset(infoCliente)

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
      
      // Normalizar PeriodoDesdeAplica antes de guardar

      console.log(formValue)
     
       if (this.CondicionVentaId()) {
        //await firstValueFrom(this.apiService.updateCondicionVenta(dataToSave, this.CondicionVentaId()));
      } else {
         const result = await firstValueFrom(this.apiService.addCondicionVenta(formValue));
        this.CondicionVentaId.set(result.data.id);
      }
      
     //await this.load();
      this.onAddorUpdate.emit('save');
      this.formCondicionVenta.markAsUntouched();
      this.formCondicionVenta.markAsPristine();
    } catch (e) {
      console.error('Error al guardar condición de venta:', e);
    }
    this.loadingSrv.close();

  }

  async deleteRecord() {
    // TODO: Implementar eliminación
    // await firstValueFrom(this.apiService.deleteCondicionVenta(this.CondicionVentaId()));
    // this.CondicionVentaId.set(0);
    // this.onAddorUpdate.emit('delete');
  }

}
