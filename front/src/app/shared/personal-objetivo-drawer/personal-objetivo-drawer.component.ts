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

@Component({
    selector: 'app-personal-objetivo-drawer',
    templateUrl: './personal-objetivo-drawer.component.html',
    styleUrl: './personal-objetivo-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalObjetivoDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    visibleObjetivo = model<boolean>(false)
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

    // $selectedObjetivoIdChange = new BehaviorSubject('');
    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaAsistenciaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getAsistenciaPersona(
                Number(this.PersonalId()),
                this.periodo().year,
                this.periodo().month
            )
        })
    );

    async ngOnInit(){
        const date:Date = new Date()
        this.periodo.set({ year: date.getFullYear(), month: date.getMonth()+1 })
        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }
}