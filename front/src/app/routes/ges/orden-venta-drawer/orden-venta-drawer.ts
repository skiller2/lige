import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { HorasAFacturar, OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-orden-venta-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, OrdenVentaFormComponent,DecimalPipe],
  templateUrl: './orden-venta-drawer.html'
})
export class OrdenVentaDrawerComponent {
  anio = input<number>(0)
  mes = input<number>(0)
  ClienteId = input<number>(0)
  ClienteElementoDependienteId = input<number>(0)
  ordenVentaChange = output<HorasAFacturar>()
  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'right';
  cabecera = signal<any>({})
  ordenVentaSeleccionada = signal<number>(0)

  private apiService = inject(ApiService)
  private ordenVentaForm = viewChild.required<OrdenVentaFormComponent>('ordenVentaForm')

  private effecto = effect(() => {

      const anio = this.anio()
      const mes = this.mes()
      const ClienteId = this.ClienteId()
      const ClienteElementoDependienteId = this.ClienteElementoDependienteId()
      const visible = this.visible()

      if (ClienteId > 0 && anio > 0 && mes > 0 && visible) {
        
        this.getCabecera(ClienteId, ClienteElementoDependienteId,anio, mes)
      } else {
        this.cabecera.set({})
      }
  })

  titulo = input<string>('N/D')
  TotalHorasReales = input<number>(0)
  // No hay botón de guardar: al cerrar se graba lo pendiente. Si no se pudo grabar (detalle
  // incompleto o error) el drawer queda abierto con los errores a la vista.
  async cerrar() {
    try {
    this.ordenVentaForm().save()
    this.visible.set(false)
    } catch (e){}
  }

  ordenVentaGuardada(data:any) {
    this.ordenVentaChange.emit(data)
    this.getCabecera(this.ClienteId(), this.ClienteElementoDependienteId(), this.anio(), this.mes())
  }


  async getCabecera(ClienteId: number, ClienteElementoDependienteId: number, anio: number, mes: number) {
    try {
      const cabecera = await firstValueFrom(this.apiService.getOrdenVentaCabecera(ClienteId, ClienteElementoDependienteId, anio, mes))
      this.cabecera.set(cabecera ?? {})
    } finally {
    }
  }

  

}
