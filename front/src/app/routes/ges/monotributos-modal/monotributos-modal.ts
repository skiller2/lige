import { Component, inject, model, signal, input, computed, effect } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { GrupoActividadSearchComponent } from '../../../shared/grupo-actividad-search/grupo-actividad-search.component';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-monotributos-modal',
  templateUrl: './monotributos-modal.html',
  imports: [
    NzSelectModule,
    NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    ClienteSearchComponent,
    PersonalSearchComponent,
    GrupoActividadSearchComponent,
  ],
})
export class MonotributosModalComponent {

  isVisible = model(false)
  selectedOption = model("T")

  ClienteIdWithSearch = model(0)
  SucursalIdWithSearch = model(0)
  PersonalIdWithSearch = model(0)
  GrupoIdWithSearch = model(0)
  ObjetivoIdWithSearch = model(0)
  grupoDetalle = signal('')

  periodo = input<Date>(new Date())
  desde = signal<Date>(new Date())
  hasta = signal<Date>(new Date())
  anio = computed(() => this.desde()? this.desde()!.getFullYear(): 0 )
  mes = computed(() => this.desde()? this.desde()!.getMonth()+1 : 0)

  changePeriodo = effect(() => {
      this.desde.set(new Date(this.periodo()));
  })

  public searchService = inject(SearchService);
  $optionsSucursales = this.searchService.getSucursales();

  onGrupoChange(ext: any) {
    this.grupoDetalle.set(ext?.GrupoActividadDetalle ?? '')
  }

  // Construye el body que consume handleDownloadComprobantesByFiltro:
  // { anio, mes, cantxpag, options: { filtros, sort } }.
  // Cada filtro usa un index existente en listaColumnas (impuestos-afip).
  buildBody() {
    const filtros: any[] = []
    switch (this.selectedOption()) {
      case "C":
        if (this.ClienteIdWithSearch())
          filtros.push({ index: 'ClienteId', operador: '=', condition: 'AND', valor: [String(this.ClienteIdWithSearch())] })
        break;
      case "S":
        if (this.SucursalIdWithSearch())
          filtros.push({ index: 'Sucursal', operador: '=', condition: 'AND', valor: [String(this.SucursalIdWithSearch())] })
        break;
      case "P":
        if (this.PersonalIdWithSearch())
          filtros.push({ index: 'PersonalId', operador: '=', condition: 'AND', valor: [String(this.PersonalIdWithSearch())] })
        break;
      case "G":
        if (this.grupoDetalle())
          filtros.push({ index: 'GrupoDetalleOBJ', operador: '=', condition: 'AND', valor: [this.grupoDetalle()] })
        break;
      // "T" -> sin filtros (todos)
    }
    return { desde: this.desde(), hasta: (this.selectedOption() != "P" ? null : this.hasta()), cantxpag: 1, options: { filtros, sort: [] } }
  }

}
