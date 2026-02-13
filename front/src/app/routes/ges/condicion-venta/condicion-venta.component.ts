import { ChangeDetectionStrategy, Component, inject, input, model, OnInit, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { I18nPipe, SettingsService } from '@delon/theme';
import { TableCondicionVentaComponent } from '../table-condicion-venta/table-condicion-venta.component';
import { AngularUtilService } from 'angular-slickgrid';
import { CondicionVentaFormComponent } from '../condicion-venta-form/condicion-venta-form.component';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-condicion-venta',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, I18nPipe, TableCondicionVentaComponent, CondicionVentaFormComponent],
  templateUrl: './condicion-venta.component.html',
  styleUrl: './condicion-venta.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondicionVentaComponent implements OnInit {

  periodo = signal<Date>(new Date())
  codobj = model<string>('');
  isEdit = model<boolean>(false);
  objetivoId = model<number>(0);
  childIsPristine = signal(true)
  viewListado = model<boolean>(true)
  childAlta = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormAlta')
  childDetalle = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormDetalle')
  childEditar = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormEditar')
  childTableCondicionVenta = viewChild<TableCondicionVentaComponent>('tableCondicionVenta')
  PeriodoDesdeAplica = model<string>('');

  refreshCondVenta = signal<number>(0)

  condicionesSeleccionadas = model<any[]>([])
  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)
  }

  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.codobj.set('')
    this.viewListado.set(true)
    this.PeriodoDesdeAplica.set('')
  }



  onAddClick(): void {
    this.isEdit.set(false);
    const savedCodobj = this.codobj();
    const savedObjetivoId = this.objetivoId();

    try {
      const child = this.childAlta();
      if (child.formCondicionVenta.invalid || child.formCondicionVenta.pristine) {
        child.clearForm();
      }
    } catch (e) {
    }
    this.childTableCondicionVenta()?.clearSelection();

    if (savedCodobj) {
      this.codobj.set(savedCodobj);
      this.objetivoId.set(savedObjetivoId);
    }
  }

  async handleAddOrUpdate() {
    //this.childTableCondicionVenta().RefreshCondVenta.set(true)
  }

  onTabsetChange(_event: any) {
    
    console.log("_event.index ", _event.index)
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

  async autorizarCondicionVenta() {
    const condiciones = this.condicionesSeleccionadas();
    
    if (condiciones.length === 0) {
      return;
    }

    var result = await firstValueFrom(
      this.apiService.autorizarCondicionVentaMultiple(condiciones)
    );
    
    if (result.status === 'ok') {
      this.refreshCondVenta.update(v => v + 1)
      this.condicionesSeleccionadas.set([]);
    }
  }

  async rechazarCondicionVenta() {
    const condiciones = this.condicionesSeleccionadas();
    
    if (condiciones.length === 0) {
      return;
    }

    await firstValueFrom(
      this.apiService.rechazarCondicionVentaMultiple(condiciones)
    );
    
    this.refreshCondVenta.update(v => v + 1)
    this.condicionesSeleccionadas.set([]);
  }

}
