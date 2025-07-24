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
import { DescuentosCargaMasivaComponent } from '../descuentos-carga-masiva/descuentos-carga-masiva.component';

@Component({
    selector: 'app-descuentos',
    templateUrl: './descuentos.component.html',
    styleUrls: ['./descuentos.component.less'],
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, TableDescuentosPersonalComponent,
        TableDescuentosObjetivosComponent, DescuentosCargaMasivaComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescuentosComponent {
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)
    reload = signal<number>(0)
    loadingCuo = signal(false)

    private apiService = inject(ApiService)

    async addCuotaReg() {
        this.loadingCuo.set(true)
        try {
            const res: any = await firstValueFrom(this.apiService.descuentoAddCuota({ year: this.anio(), month: this.mes() }))
            let newReload = this.reload()+1
            this.reload.set(newReload)
        } catch (error) {
            console.log(error);
        }
        this.loadingCuo.set(false)
    }
}