
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
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
    styleUrls: ['./descuentos.component.scss'],
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, TableDescuentosPersonalComponent, TableDescuentosObjetivosComponent, DescuentosImportacionMasivaComponent, DescuentosCargaManualComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescuentosComponent {
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)
    reloadObj = signal<number>(0)
    reloadPer = signal<number>(0)
    loadingCuo = model<boolean>(false)
    selectedPeriod = { year: 0, month: 0 };
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);
    private settingsService = inject(SettingsService)

    async jobGenCuotasOtroDescuento() {
        this.loadingSrv.open({ type: 'spin', text: '' })
        try {
            const res: any = await firstValueFrom(this.apiService.jobGenCuotasOtroDescuento({ year: this.anio(), month: this.mes() }))
            this.reloadPer.update(x => x + 1)
        } catch (error) {
        }
        this.loadingSrv.close()
    }

    async jobGenCuotasDescuento() {
        this.loadingSrv.open({ type: 'spin', text: '' })
        try {
            const res: any = await firstValueFrom(this.apiService.jobGenCuotasDescuento({ year: this.anio(), month: this.mes() }))
            this.reloadPer.update(x => x + 1)
        } catch (error) {
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
        if (!result)
            return
        this.selectedPeriod.year = result.getFullYear();
        this.selectedPeriod.month = result.getMonth() + 1;
        console.log('this.selectedPeriod: ', this.selectedPeriod);
        console.log('this.periodo: ', this.periodo());
    
        localStorage.setItem('anio', String(this.selectedPeriod.year));
        localStorage.setItem('mes', String(this.selectedPeriod.month));
    }
    
}