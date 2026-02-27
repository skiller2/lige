import { ChangeDetectionStrategy, Component, inject, input, model, OnInit, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { I18nPipe, SettingsService } from '@delon/theme';
import { TableParametroVentaComponent } from '../table-parametro-venta/table-parametro-venta.component';
import { AngularUtilService } from 'angular-slickgrid';
import { ParametroVentaFormComponent } from '../parametro-venta-form/parametro-venta-form.component';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-parametro-venta',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule,I18nPipe, TableParametroVentaComponent, ParametroVentaFormComponent,],
  templateUrl: './parametro-venta.component.html',
  styleUrl: './parametro-venta.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametroVentaComponent implements OnInit {

  periodo = signal<Date>(new Date())
  isEdit = model<boolean>(false);
  objetivoId = model<number>(0);
  childIsPristine = signal(true)
  viewListado = model<boolean>(true)
  childAlta = viewChild.required<ParametroVentaFormComponent>('parametroVentaFormAlta')
  childDetalle = viewChild.required<ParametroVentaFormComponent>('parametroVentaFormDetalle')
  childEditar = viewChild.required<ParametroVentaFormComponent>('parametroVentaFormEditar')
  childTableParametroVenta = viewChild<TableParametroVentaComponent>('tableParametroVenta')
  PeriodoDesdeAplica = model<string>('');

  refreshCondVenta = signal<number>(0)

  parametrosSeleccionadas = model<any[]>([])
  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)
  }

  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.viewListado.set(true)
    this.PeriodoDesdeAplica.set('')
  }



  onAddClick(): void {
    this.isEdit.set(false);
    const savedObjetivoId = this.objetivoId();
    const savedPeriodo = this.PeriodoDesdeAplica();

    // Si hay un registro seleccionado (codobj + periodo), no limpiar el form
    // para que newRecord() cargue todos los datos como copia
    if (savedPeriodo) {
      return;
    }

    try {
      const child = this.childAlta();
//      if (child.formParametroVenta.invalid || child.formParametroVenta.pristine) {
//        child.clearForm();
//      }
//        child.ObjetivoId.set(savedObjetivoId);
    } catch (e) {
    }
  }


  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 4: //INSERT
        this.childAlta().newRecord()
        break
      case 3: //DETAIL
        this.childDetalle().viewRecord(true)
        break;
      case 2: //EDIT
        this.childEditar().viewRecord(false)
        break;
      default:
        break;
    }
  }

  async autorizarParametroVenta() {
    const condiciones = this.parametrosSeleccionadas();
    
    if (condiciones.length === 0) {
      return;
    }

    var result = await firstValueFrom(
      this.apiService.autorizarParametroVentaMultiple(condiciones)
    );
    
    if (result.status === 'ok') {
      this.refreshCondVenta.update(v => v + 1)
      this.parametrosSeleccionadas.set([]);
    }
  }

  refreshGridNow() {
    this.refreshCondVenta.update(v => v + 1)
  }

  async rechazarParametroVenta() {
    const condiciones = this.parametrosSeleccionadas();
    
    if (condiciones.length === 0) {
      return;
    }

    await firstValueFrom(
      this.apiService.rechazarParametroVentaMultiple(condiciones)
    );
    
    this.refreshCondVenta.update(v => v + 1)
    this.parametrosSeleccionadas.set([]);
  }

}
