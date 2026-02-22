import { Component, inject, signal, model, computed, ViewEncapsulation, input } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';

@Component({
    selector: 'app-personal-domicilio-drawer',
    templateUrl: './personal-domicilio-drawer.component.html',
    styleUrl: './personal-domicilio-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalDomicilioDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleDomicilio = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';

    constructor(
        private searchService: SearchService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaDomicilioPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getDomicilioByPersonal(Number(this.PersonalId()))
        })
    );

    async ngOnInit(){
        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }
}