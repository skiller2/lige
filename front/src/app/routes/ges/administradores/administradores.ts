
import { Component, inject, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AdministradoresListadoTableComponent } from '../administradores-listado-table/administradores-listado-table';
import { AdministradoresClientesTableComponent } from '../administradores-clientes-table/administradores-clientes-table';
import { AdministradoresFormComponent } from './administradores-form/administradores-form';

@Component({
  selector: 'app-administradores',
  imports: [AdministradoresListadoTableComponent, AdministradoresClientesTableComponent, AdministradoresFormComponent, SHARED_IMPORTS],
  templateUrl: './administradores.html',
  styleUrl: './administradores.less'
})

export class AdministradoresComponent {
  tabIndex = signal<number>(0)
  administradorId = signal(0)
  childIsPristine = signal(true)
  loadingD = signal(false)

  private apiService = inject(ApiService)

  childAdminsTable = viewChild.required<AdministradoresListadoTableComponent>('adminsTable')
  childClisTable = viewChild.required<AdministradoresClientesTableComponent>('clisTable')
  childAdmEdit = viewChild.required<AdministradoresFormComponent>('admEdit')
  childAdmDetail = viewChild.required<AdministradoresFormComponent>('admDetail')

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

  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 4: //EDIT
        this.childAdmEdit().load()
        break;
    
      case 5: //DETALLE
        this.childAdmDetail().load()
        break;
      default:
        break;
    }
  }

  async deleteItem() {
    this.loadingD.set(true)
    try {
      
      await firstValueFrom(this.apiService.deleteAdministrador(this.administradorId()));
      this.administradorId.set(0);
      this.refreshGrid();
      
    } catch (error) {}
    finally {
      this.loadingD.set(false)
    }
  }
}
