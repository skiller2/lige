import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { TableDescuentosPersonalComponent } from '../table-descuentos-personal/table-descuentos-personal.component';
import { TableDescuentosObjetivosComponent } from '../table-descuentos-objetivos/table-descuentos-objetivos.component';
import { TableDescuentosPrepagaComponent } from '../table-descuentos-prepaga/table-descuentos-prepaga.component';


@Component({
    selector: 'app-descuentos',
    templateUrl: './descuentos.component.html',
    styleUrls: ['./descuentos.component.less'],
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, TableDescuentosPersonalComponent,
        TableDescuentosObjetivosComponent, TableDescuentosPrepagaComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescuentosComponent {
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)

    childTablePersonal = viewChild.required<TableDescuentosPersonalComponent>('descPersonal')
    childTableObjetivo = viewChild.required<TableDescuentosObjetivosComponent>('descObjetivos')
    childTablePrepaga = viewChild.required<TableDescuentosPrepagaComponent>('descPrepaga')

    onTabsetChange(_event: any) {
        console.log('_event: ', _event);
        
        switch (_event.index) {
          case 0: //EDIT
            // this.childTablePersonal().listDescuento('')
            break;
          case 1: //DETALLE
            // this.childTableObjetivo().listDescuento('')
            break
          case 2: //EDIT
            
            break;
          case 3: 
            // this.childTablePrepaga().listDescuento('')
            break;
          default:
            break;
        }
    }

}