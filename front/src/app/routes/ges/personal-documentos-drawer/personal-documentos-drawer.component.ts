import { Component, inject, signal, model, computed, ViewEncapsulation, input } from '@angular/core';
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
import { NgForm, FormArray, FormBuilder } from '@angular/forms';

@Component({
    selector: 'app-personal-documentos-drawer',
    templateUrl: './personal-documentos-drawer.component.html',
    styleUrl: './personal-documentos-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalDocumentosDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleDocumentos = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';

    constructor(
        private searchService: SearchService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaDocumentosPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getDocumentosByPersonal(Number(this.PersonalId()))
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