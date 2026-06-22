import { Component, inject, signal, model, resource, input, computed, effect, output } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FormBuilder, FormArray } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit, disabled } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

export interface PersonalBanco {
    PersonalId: number,
    BancoId: number, 
    CBU: string, 
    Desde: Date|null
}

@Component({
    selector: 'app-personal-banco-drawer',
    templateUrl: './personal-banco-drawer.component.html',
    styleUrl: './personal-banco-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, PersonalSearchComponent, FormField, FormsModule],
    providers: [AngularUtilService]
})
  
export class PersonalBancoDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleBanco = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    onAddorUpdate = output()

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    private readonly defaultPersonalBancoForm: PersonalBanco = { 
        PersonalId: 0,
        BancoId: 0, 
        CBU: '', 
        Desde: new Date()
    }
    
    readonly personalBanco = signal<PersonalBanco>(this.defaultPersonalBancoForm)
    readonly formPersonalBanco = form(this.personalBanco, (p) => {
        disabled(p.PersonalId, () => this.PersonalId()? true : false)
    })

    effect = effect(async () => {
        if (!this.visibleBanco()) return
        this.personalBanco.set({...this.defaultPersonalBancoForm, PersonalId: this.PersonalId()});
    })
    // this.personalBanco().Desde
    anio = computed(() => (this.personalBanco().Desde)? this.personalBanco().Desde!.getFullYear(): 0);
    mes = computed(() => (this.personalBanco().Desde)? (this.personalBanco().Desde!.getMonth()+1): 0);
    formPersonalId = computed(() => this.personalBanco().PersonalId);

    optionsBanco = toSignal(this.searchService.getBancosOptions())
    listaBancoPer = resource({
        params: () => ({ PersonalId: this.formPersonalId() }),
        loader: async ({ params }) => {
        let response = []
        try {
            const personal = await firstValueFrom(this.searchService.getPersonalById(params.PersonalId))
            if (personal.PersonalApellido && personal.PersonalNombre) {
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            } else {
                this.PersonalNombre.set('')
            }
            
            response = await firstValueFrom(this.searchService.getHistorialPersonalBanco(
                params.PersonalId
            ).pipe(map(data => {
                data.map((obj:any) =>{
                    obj.id = `${params.PersonalId}-${obj.PersonalBancoId}`
                    let inicio = new Date(obj.Desde)
                    let fin = obj.Hasta? new Date(obj.Hasta) : null
                    obj.Desde = `${inicio.getDate()}/${inicio.getMonth()+1}/${inicio.getFullYear()}`
                    obj.Hasta = fin? `${fin.getDate()}/${fin.getMonth()+1}/${fin.getFullYear()}` : fin
                })
                return data
            })));
        } catch (_e) { }

        return response || [];
        },

        defaultValue: []
    });

    async ngOnInit(){
    }


    async save() {
        await submit(this.formPersonalBanco, async (form) => {
            const values: PersonalBanco = form().value()
            try {
                const res = await firstValueFrom(this.apiService.setPersonalBanco(values))
                
                this.listaBancoPer.reload()
                
                this.onAddorUpdate.emit()
            } catch (e) {

            }
        })
    }

    async unsubscribeCBUs() {
        this.isLoading.set(true)
        try {
            await firstValueFrom(this.apiService.unsubscribeCBUs(this.formPersonalId()))
            this.listaBancoPer.reload()
            this.onAddorUpdate.emit()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

}