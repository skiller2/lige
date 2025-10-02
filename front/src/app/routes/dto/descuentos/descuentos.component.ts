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
import { DescuentosImportacionMasivaComponent } from '../descuentos-importacion-masiva/descuentos-importacion-masiva.component';
import { LoadingService } from '@delon/abc/loading';
import { SettingsService } from '@delon/theme';
import { DescuentosCargaManualComponent } from '../descuentos-carga-manual/descuentos-carga-manual';
@Component({
    selector: 'app-descuentos',
    templateUrl: './descuentos.component.html',
    styleUrls: ['./descuentos.component.less'],
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, TableDescuentosPersonalComponent,
        TableDescuentosObjetivosComponent, DescuentosImportacionMasivaComponent, DescuentosCargaManualComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescuentosComponent {
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)
    reload = signal<number>(0)
    loadingCuo = model<boolean>(false)
    reloadGrid = model<boolean>(false)
    selectedPeriod = { year: 0, month: 0 };
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);
    private settingsService = inject(SettingsService)

    async addCuotaReg() {
        this.loadingSrv.open({ type: 'spin', text: '' })
        try {
            const res: any = await firstValueFrom(this.apiService.descuentoAddCuota({ year: this.anio(), month: this.mes() }))
            let newReload = this.reload()+1
            this.reload.set(newReload)
        } catch (error) {
            console.log(error);
        }
        this.loadingSrv.close()
    }

    ngOnInit() {
        this.selectedDate()
        this.settingsService.setLayout('collapsed', true)
    }

    selectedDate (){
        const now = new Date(); //date
        const anio =
          Number(localStorage.getItem('anio')) > 0
            ? Number(localStorage.getItem('anio'))
            : now.getFullYear();
        const mes =
          Number(localStorage.getItem('mes')) > 0
            ? Number(localStorage.getItem('mes'))
            : now.getMonth() + 1;
        this.periodo.set(new Date(anio, mes - 1, 1))
        this.selectedPeriod = { year: anio, month: mes }
    }

    dateChange(result: Date): void {
        this.selectedPeriod.year = result.getFullYear();
        this.selectedPeriod.month = result.getMonth() + 1;
        console.log('this.selectedPeriod: ', this.selectedPeriod);
        console.log('this.periodo: ', this.periodo());
    
        localStorage.setItem('anio', String(this.selectedPeriod.year));
        localStorage.setItem('mes', String(this.selectedPeriod.month));
      }
    
}