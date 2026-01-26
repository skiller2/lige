import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, ChangeDetectionStrategy, ViewChild } from '@angular/core';
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
import { NgForm } from '@angular/forms';

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
    placement: NzDrawerPlacement = 'left';
    @ViewChild('personalObjetivoDrawerForm') personalObjetivoDrawerForm?: NgForm;
    anio = signal(0);
    mes = signal(0);
    periodo: Date | null = null;

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
            return this.searchService.getPersonalAsistencia(
                Number(this.PersonalId()),
                this.anio(),
                this.mes()
            )
        })
    );

    ngOnInit(){
            const now = new Date(); //date
            const anio =
                Number(localStorage.getItem('anio')) > 0
                    ? Number(localStorage.getItem('anio'))
                    : now.getFullYear();
            const mes =
                Number(localStorage.getItem('mes')) > 0
                    ? Number(localStorage.getItem('mes'))
                    : now.getMonth() + 1;

            this.anio.set(anio);
            this.mes.set(mes);
            this.periodo = new Date(anio, mes - 1, 1); 
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    selectedValueChange(event: any): void {
       
            this.anio.set(event.getFullYear());
            this.mes.set(event.getMonth() + 1);
            this.periodo = event;
            localStorage.setItem('anio', String(this.anio()));
            localStorage.setItem('mes', String(this.mes()));
            this.selectedPersonalIdChange$.next(this.PersonalId().toString());
    }
}