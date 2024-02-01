import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";

@Component({
    selector: 'app-detalle-persona',
    standalone: true,
    templateUrl: './detalle-persona.component.html',
    styleUrl: './detalle-persona.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, ViewResponsableComponent]
})
export class DetallePersonaComponent {
  personalDetalleCategorias$: Observable<any> | undefined
  personalDetalleLicencias$: Observable<any> | undefined
  personalDetalleSitRevista$: Observable<any> | undefined
  personalApellidoNombre: any;
  personalDetalleResponsables$: Observable<any> | undefined
  personalDetalle$: Observable<any> | undefined
  objetivos$: Observable<any> | undefined
  habilitaciones$: Observable<any> | undefined
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  @Input() anio!: number
  @Input() mes!: number
  @Input() SucursalId!: number
  @Input() PersonalId!: number

  load(): void {
    this.personalDetalle$ = this.searchService.getPersonalById(this.PersonalId)
    this.personalDetalleSitRevista$ = this.apiService.getPersonaSitRevista(this.PersonalId, this.anio, this.mes)
    this.personalDetalleCategorias$ = this.searchService.getCategoriasPersona(this.PersonalId, this.anio, this.mes, this.SucursalId)
    this.personalDetalleLicencias$ = this.searchService.getLicenciasPersona(this.PersonalId, this.anio, this.mes)
    this.personalDetalleResponsables$ = this.apiService.getPersonaResponsables(this.PersonalId, this.anio, this.mes)
    this.objetivos$ = this.searchService.getAsistenciaPersona(this.PersonalId, this.anio, this.mes)
    this.habilitaciones$ = this.searchService.getHabilitacionesPersona(this.PersonalId, this.anio, this.mes)
  }

  ngOnInit(): void {
    this.load()
  }


}
