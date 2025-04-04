import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TableGrupoActividadGruposComponent } from '../table-grupo-actividad-grupos/table-grupo-actividad-grupos.component'
import { TableGrupoActividadResponsablesComponent } from '../table-grupo-actividad-responsables/table-grupo-actividad-responsables.component'
import { TableGrupoActividadObjetivosComponent } from '../table-grupo-actividad-objetivos/table-grupo-actividad-objetivos.component'
import { TableGrupoActividadPersonalComponent } from '../table-grupo-actividad-personal/table-grupo-actividad-personal.component'


@Component({
    selector: 'app-grupo-actividad',
    imports: [
        SHARED_IMPORTS,
        CommonModule,
        TableGrupoActividadGruposComponent,
        TableGrupoActividadResponsablesComponent,
        TableGrupoActividadObjetivosComponent,
        TableGrupoActividadPersonalComponent
    ],
    templateUrl: './grupo-actividad.component.html',
    styleUrl: './grupo-actividad.component.less'
})
  
export class GrupoActividadComponent {
}
