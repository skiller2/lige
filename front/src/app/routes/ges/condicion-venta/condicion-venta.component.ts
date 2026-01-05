import { ChangeDetectionStrategy, Component, model, OnInit, signal, viewChild } from '@angular/core';
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
export class CondicionVentaComponent implements OnInit {

  periodo = signal<Date>(new Date())
  codobj = model<string>(''); 
  childIsPristine = signal(true)
  viewListado = model<boolean>(true)
  childAlta = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormAlta')
  childDetalle = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormDetalle')
  childEditar = viewChild.required<CondicionVentaFormComponent>('condicionVentaFormEditar')
PeriodoDesdeAplica = model<string>('');

  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)
  }

  ngOnInit(): void {
    this.codobj.set('')
    this.viewListado.set(true)
    this.PeriodoDesdeAplica.set('')
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
        this.childDetalle().viewRecord(true)
        break;
      case 2: //EDIT
        this.childEditar().viewRecord(false)
        break;
        case 1: //list
        this.ngOnInit()
        break;
        default:
        break;
    }

  }

}
