
import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TablePersonalEfectoComponent } from '../table-personal-efecto/table-personal-efecto.component';
import { TableObjetivosEfectoComponent } from '../table-objetivos-efecto/table-objetivos-efecto.component';
import { TableEfectoDepositoComponent } from '../table-efecto-deposito/table-efecto-deposito';
import { TableEfectoProveedoresComponent } from '../table-efecto-proveedores/table-efecto-proveedores';
import { TableEfectoEfectosComponent } from '../table-efecto-efectos/table-efecto-efectos';
import { SettingsService } from '@delon/theme';
@Component({
  selector: 'app-efecto',
  imports: [
    SHARED_IMPORTS,
    NzMenuModule,
    TablePersonalEfectoComponent,
    TableObjetivosEfectoComponent,
    TableEfectoDepositoComponent,
    TableEfectoProveedoresComponent,
    TableEfectoEfectosComponent
  ],
  templateUrl: './efecto.component.html',
  styleUrl: './efecto.component.less',
})
export class EfectoComponent {
  private settingsService = inject(SettingsService)
  refreshPersonalEfecto = signal<number>(0)
  refreshObjetivoEfecto = signal<number>(0)
  refreshDepositoEfecto = signal<number>(0)
  refreshProveedoresEfecto = signal<number>(0)
  refreshEfectosEfecto = signal<number>(0)
  tabIndex = signal<number>(0)

  ngOnInit() {
    this.settingsService.setLayout('collapsed', true)
  }

  reloadGrid(){
    let num = 0
    switch (this.tabIndex()) {
      case 1:
        num = this.refreshPersonalEfecto()
        this.refreshPersonalEfecto.set(num+1)
        break;
      case 2:
        num = this.refreshObjetivoEfecto()
        this.refreshObjetivoEfecto.set(num+1)
        break;
      case 3:
        num = this.refreshDepositoEfecto()
        this.refreshDepositoEfecto.set(num+1)
        break;
      case 4:
        num = this.refreshProveedoresEfecto()
        this.refreshProveedoresEfecto.set(num+1)
        break;
      case 5:
        num = this.refreshEfectosEfecto()
        this.refreshEfectosEfecto.set(num+1)
        break;

      default:
        break;
    }
  }
}
