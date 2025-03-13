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
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';

@Component({
    selector: 'app-descuentos-alta-drawer',
    templateUrl: './descuentos-alta-drawer.component.html',
    styleUrl: './descuentos-alta-drawer.component.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, PersonalSearchComponent],
    providers: [AngularUtilService]
})
export class DescuentosAltaDrawerComponent {
    isLoading = signal(false);
    visibleAltaDesc = model<boolean>(false)
    periodo = signal(new Date())
    placement: NzDrawerPlacement = 'left';
    // noOptions = signal<any[]>([])

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        // private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formAltaDesc = this.fb.group({
        DescuentoId: 0, PersonalId:0, AplicaEl:'', Cuotas:null, Importe:null,
    })

    $optionsDescuento = this.searchService.getDecuentosOptions();

    // $listaSitRevistaPer = this.selectedPersonalIdChange$.pipe(
    //     debounceTime(500),
    //     switchMap(() =>{
    //         setTimeout(async () => {
    //             const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
    //             this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
    //         }, 0);
    //         return this.searchService.getHistoriaSituacionRevistaPersona(
    //             Number(this.PersonalId())
    //         ).pipe(map(data => {
    //             let find = this.noOptions().find((obj:any) => {return obj.SituacionRevistaId == data[0]?.SituacionRevistaId})
    //             if (find){ this.formSitRevista.disable()}
    //             else { this.formSitRevista.enable() }

    //             data.map((obj:any) =>{
    //                 let inicio = new Date(obj.Desde)
    //                 let fin = obj.Hasta? new Date(obj.Hasta) : null
    //                 obj.Desde = `${inicio.getDate()}/${inicio.getMonth()+1}/${inicio.getFullYear()}`
    //                 obj.Hasta = fin? `${fin.getDate()}/${fin.getMonth()+1}/${fin.getFullYear()}` : fin
    //             })
    //             return data
    //         }))
    //     })
    // );

    PersonalId():number {
        const value = this.formAltaDesc.value.PersonalId
        if (value) {
          return value
        }
        return 0
    }

    anio():number{
        if(this.periodo() && this.periodo().getFullYear()) return this.periodo().getFullYear()
        return 0
    }

    mes():number{
        if(this.periodo() && this.periodo().getMonth()+1) return this.periodo().getMonth()+1
        return 0
    }

    async ngOnInit(){
        this.periodo.set(new Date())
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading.set(true)
        let values = this.formAltaDesc.value
        try {
            // await firstValueFrom(this.apiService.setSitRevista(this.PersonalId(), values))
            this.selectedPersonalIdChange$.next('')
            this.formAltaDesc.markAsUntouched()
            this.formAltaDesc.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

}