import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';
import { TableDescuentosPersonalComponent } from '../table-descuentos-personal/table-descuentos-personal.component';


@Component({
    selector: 'app-descuentos',
    templateUrl: './descuentos.component.html',
    styleUrls: ['./descuentos.component.less'],
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, TableDescuentosPersonalComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescuentosComponent {
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)

}