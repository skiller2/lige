import { ChangeDetectionStrategy, Component, model, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { I18nPipe, SettingsService } from '@delon/theme';
import { TableCondicionVentaComponent } from '../table-condicion-venta/table-condicion-venta.component';
import { AngularUtilService } from 'angular-slickgrid';
import { CondicionVentaFormComponent } from '../condicion-venta-form/condicion-venta-form.component';
@Component({
  selector: 'app-condicion-venta',
  standalone: true,
  providers: [AngularUtilService],
  imports: [ SHARED_IMPORTS,
    CommonModule,
    I18nPipe,
   TableCondicionVentaComponent,
    CondicionVentaFormComponent,
  ],
  templateUrl: './condicion-venta.component.html', 
  styleUrl: './condicion-venta.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondicionVentaComponent {

  periodo = signal<Date>(new Date())
  CondicionVentaId = model(0); 
  childIsPristine = signal(true)
  viewListado = model<boolean>(true)
  childAlta = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormAlta')
  childDetalle = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormDetalle')
  childEditar = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormEditar')


  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)
  }


  async handleAddOrUpdate(){
    //this.childTableCondicionVenta().RefreshCondVenta.set(true)
  }

  onTabsetChange(_event: any) {
    console.log("_event.index ", _event.index)
    switch (_event.index) {
      case 4: //INSERT
       // this.childAlta().newRecord()
        break
      case 3: //DETAIL
       // this.childDetalle().viewRecord(true)
        break;
      case 2: //EDIT
       // this.childEditar().viewRecord(false)
        break;
        default:
        break;
    }

  }

}
