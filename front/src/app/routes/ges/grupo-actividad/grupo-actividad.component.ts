import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { SettingsService } from '@delon/theme';
import { TableGrupoActividadGruposComponent } from '../../../shared/table-grupo-actividad-grupos/table-grupo-actividad-grupos.component'
import { TableGrupoActividadResponsablesComponent } from '../../../shared/table-grupo-actividad-responsables/table-grupo-actividad-responsables.component'



@Component({
  selector: 'app-grupo-actividad',
  standalone: true,
  imports: [
    SHARED_IMPORTS, 
    CommonModule, TableGrupoActividadGruposComponent, TableGrupoActividadResponsablesComponent
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupo-actividad.component.html',
  styleUrl: './grupo-actividad.component.less'
})
export class GrupoActividadComponent {

}
