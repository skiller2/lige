import { ChangeDetectionStrategy, Component, inject, model, OnInit, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
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
  imports: [SHARED_IMPORTS,
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
  childTableCondicionVenta = viewChild<TableCondicionVentaComponent>('tableCondicionVenta')
  PeriodoDesdeAplica = model<string>('');
  RefreshCondVenta = model<boolean>(false)
  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)
  }

  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.codobj.set('')
    this.viewListado.set(true)
    this.PeriodoDesdeAplica.set('')
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
    var result = await firstValueFrom(this.apiService.autorizarCondicionVenta(this.codobj(), this.PeriodoDesdeAplica()))
    
    if (result.status === 'ok') 
         this.RefreshCondVenta.set(true);
    
  }

  async rechazarCondicionVenta() {
    await firstValueFrom(this.apiService.rechazarCondicionVenta(this.codobj(), this.PeriodoDesdeAplica()))
    this.RefreshCondVenta.set(true)

  }

}
