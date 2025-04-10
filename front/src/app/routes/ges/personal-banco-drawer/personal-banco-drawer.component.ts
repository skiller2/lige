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
    selector: 'app-personal-banco-drawer',
    templateUrl: './personal-banco-drawer.component.html',
    styleUrl: './personal-banco-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalBancoDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading1 = signal(false);
    isLoading2 = signal(false);
    visibleBanco = model<boolean>(false)
    periodo = signal(new Date())
    placement: NzDrawerPlacement = 'left';

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formPerBanco = this.fb.group({
        BancoId: 0, CBU:'', Desde:new Date()
    })

    $optionsBanco = this.searchService.getBancosOptions();
    $listaBancoPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getHistorialPersonalBanco(
                Number(this.PersonalId())
            ).pipe(map(data => {
                data.map((obj:any) =>{
                    let inicio = new Date(obj.Desde)
                    let fin = obj.Hasta? new Date(obj.Hasta) : null
                    obj.Desde = `${inicio.getDate()}/${inicio.getMonth()+1}/${inicio.getFullYear()}`
                    obj.Hasta = fin? `${fin.getDate()}/${fin.getMonth()+1}/${fin.getFullYear()}` : fin
                })
                return data
            }))
        })
    );

    async ngOnInit(){
        this.periodo.set(new Date())
        
        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading1.set(true)
        let values = this.formPerBanco.value
        try {
            await firstValueFrom(this.apiService.setPersonalBanco(this.PersonalId(), values))
            this.selectedPersonalIdChange$.next('')
            this.formPerBanco.markAsUntouched()
            this.formPerBanco.markAsPristine()
        } catch (e) {

        }
        this.isLoading1.set(false)
    }

    async unsubscribeCBUs() {
        this.isLoading2.set(true)
        try {
            await firstValueFrom(this.apiService.unsubscribeCBUs(this.PersonalId()))
            this.selectedPersonalIdChange$.next('')
            this.formPerBanco.markAsUntouched()
            this.formPerBanco.markAsPristine()
        } catch (e) {

        }
        this.isLoading2.set(false)
    }

}