import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-personal-situacionrevista-drawer',
    templateUrl: './personal-situacionrevista-drawer.component.html',
    styleUrl: './personal-situacionrevista-drawer.component.less',
    standalone: true,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
  
export class PersonalSituacionRevistaDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleSitRevista = model<boolean>(false)
    periodo = signal({ year: 0, month: 0 });
    placement: NzDrawerPlacement = 'left';

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute,
        private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formSitRevista = this.fb.group({
        SituacionId: 0, Motivo:''
    })

    $optionsSitRevista = this.searchService.getSitRevistaOptions();
    $listaSitRevistaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getHistoriaSituacionRevistaPersona(
                Number(this.PersonalId())
            ).pipe(map(data => {
                data.map((obj:any) =>{
                    let inicio = new Date(obj.Desde)
                    let fin = obj.Hasta? new Date(obj.Hasta) : null
                    obj.Desde = `${inicio.getDate()}/${inicio.getDate()+1}/${inicio.getFullYear()}`
                    obj.Hasta = fin? `${fin.getDate()}/${fin.getDate()+1}/${fin.getFullYear()}` : fin
                })
                return data
            }))
        })
    );

    async ngOnInit(){
        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading.set(true)
        let values = this.formSitRevista.value
        try {
            await firstValueFrom(this.apiService.setSitRevista(this.PersonalId(), values))
            this.selectedPersonalIdChange$.next('')
            this.formSitRevista.markAsUntouched()
            this.formSitRevista.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

}