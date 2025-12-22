import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, model, output, computed, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { firstValueFrom } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-condicion-venta-form',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './condicion-venta-form.component.html',
  styleUrl: './condicion-venta-form.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CondicionVentaFormComponent {
 /* private readonly loadingSrv = inject(LoadingService);
  private apiService = inject(ApiService);
  private searchService = inject(SearchService);
  private fb = inject(FormBuilder);
  /*pristineChange = output<boolean>()*/

  /*CondicionVentaId = model<number>(0);
  /*onAddorUpdate = output<('save' | 'delete')>();
  isLoading = signal(false);
  objetivoExtended = signal<any>(null);*/
  CondicionVentaIdForEdit = model(0);
  viewListado = input<boolean>(false)

  /*formCondicionVenta: FormGroup = this.fb.group({
    id: 0,
    ClienteId: 0,
    ClienteElementoDependienteId: 0,
    ObjetivoId: 0, 
    PeriodoDesdeAplica: null as Date | null,
    PeriodoFacturacion: '',
    GeneracionFacturaDia: null as number | null,
    GeneracionFacturaDiaComplemento: null as number | null,
    Observaciones: '',
  });

  checkPristine() {
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

  onPeriodoDesdeAplicaChange(date: Date | null): void {
    if (date) {
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      this.formCondicionVenta.patchValue({
        PeriodoDesdeAplica: normalizedDate,
      });
    } else {
      this.formCondicionVenta.patchValue({
        PeriodoDesdeAplica: null,
      });
    }
  }

  async save() {
    this.loadingSrv.open({ type: 'spin', text: '' });
    try {
      const formValue = this.formCondicionVenta.getRawValue();
      
      // Normalizar PeriodoDesdeAplica antes de guardar

    
      // TODO: Implementar guardado en API
      // if (this.CondicionVentaId()) {
      //   await firstValueFrom(this.apiService.updateCondicionVenta(dataToSave, this.CondicionVentaId()));
      // } else {
      //   const result = await firstValueFrom(this.apiService.addCondicionVenta(dataToSave));
      //   this.CondicionVentaId.set(result.data.id);
      // }
      
      // await this.load();
      this.onAddorUpdate.emit('save');
      this.formCondicionVenta.markAsUntouched();
      this.formCondicionVenta.markAsPristine();
    } catch (e) {
      console.error('Error al guardar condición de venta:', e);
    }
    this.loadingSrv.close();
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

  async deleteRecord() {
    // TODO: Implementar eliminación
    // await firstValueFrom(this.apiService.deleteCondicionVenta(this.CondicionVentaId()));
    // this.CondicionVentaId.set(0);
    // this.onAddorUpdate.emit('delete');
  }

  async viewRecord(readonly: boolean) {
    if (this.CondicionVentaIdForEdit())
     // await this.load()
    if (readonly)
      this.formCondicionVenta.disable()
    else
      this.formCondicionVenta.enable()
    this.formCondicionVenta.get('id')?.disable()
    this.formCondicionVenta.markAsPristine()

  }
  */
}
