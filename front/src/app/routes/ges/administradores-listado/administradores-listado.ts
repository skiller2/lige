
import { Component, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AdministradoresListadoTableComponent } from '../administradores-listado-table/administradores-listado-table';
import { AdministradoresClientesTableComponent } from '../administradores-clientes-table/administradores-clientes-table';

@Component({
  selector: 'app-administradores-listado',
  imports: [AdministradoresListadoTableComponent, AdministradoresClientesTableComponent, SHARED_IMPORTS],
  templateUrl: './administradores-listado.html',
  styleUrl: './administradores-listado.less'
})

export class AdministradoresListadoComponent {
  tabIndex = signal<number>(0)
  editAdministradorId = signal(0)
  childIsPristine = signal(true)

  childAdminsTable = viewChild.required<AdministradoresListadoTableComponent>('adminsTable')
  childClisTable = viewChild.required<AdministradoresClientesTableComponent>('clisTable')

  refreshGrid(){
    switch (this.tabIndex()) {
      case 1:
        this.childAdminsTable().gridData.reload()
        break;
      case 2:
        this.childClisTable().gridData.reload()
        break;
    
      default:
        break;
    }
  }
}
