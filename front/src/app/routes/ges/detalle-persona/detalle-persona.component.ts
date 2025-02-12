import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { AGEPipe } from "../../../shared/utils/age-pipe";

@Component({
    selector: 'app-detalle-persona',
    standalone: true,
    templateUrl: './detalle-persona.component.html',
    styleUrl: './detalle-persona.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, ViewResponsableComponent, AGEPipe]
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
  telefonos$: Observable<any> | undefined
  banco$: Observable<any> | undefined
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  visibleDrawer: boolean = false
  
  @Output() onClose = new EventEmitter<boolean>();

    
  @Input()
  set visible(value: boolean) {
    this.visibleDrawer = value;
    if (this.visibleDrawer)
      this.load()
  }

  get visible(): boolean {
    return this.visibleDrawer
  }


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
    this.telefonos$ = this.searchService.getTelefonosPersona(this.PersonalId)
    this.banco$ = this.searchService.getCuentasBancoPersona(this.PersonalId)
  }

  ngOnInit(): void {
//    this.load()
  }

  closeDrawer(): void {
    this.visible = false
    this.onClose.emit(this.visibleDrawer)
  }

  calculateDateDifference(date: Date): string {
    const endDate = new Date()
    const startDate = new Date(date)
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
  
    if (days < 0) {
      months -= 1;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }
  
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} años, ${months} meses, ${days} días`
  }
}
