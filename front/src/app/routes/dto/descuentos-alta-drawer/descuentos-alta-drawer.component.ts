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
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';

@Component({
    selector: 'app-descuentos-alta-drawer',
    templateUrl: './descuentos-alta-drawer.component.html',
    styleUrl: './descuentos-alta-drawer.component.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, PersonalSearchComponent, ObjetivoSearchComponent],
    providers: [AngularUtilService]
})
export class DescuentosAltaDrawerComponent {
    isLoading = signal(false);
    visibleAltaDesc = model<boolean>(false)
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
        DescuentoId: 0, PersonalId:0, ObjetivoId:0, AplicaEl:new Date(), Cuotas:null, Importe:null,
    })

    $optionsDescuento = this.searchService.getDecuentosOptions();

    $listaDecuentosPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            return this.searchService.getDescuentosByPersonalId(this.PersonalId(), this.anio(), this.mes())
        })
    );

    PersonalId():number {
        const value = this.formAltaDesc.get("PersonalId")?.value
        if (value) {
          return value
        }
        return 0
    }

    anio():number {
        const value = this.formAltaDesc.get("AplicaEl")?.value
        if(value) return value.getFullYear()
        return 0
    }

    mes():number {
        const value = this.formAltaDesc.get("AplicaEl")?.value
        if(value) return value.getMonth()+1
        return 0
    }

    async ngOnInit(){}

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async onDescuentosChange(event:any){
        this.selectedPersonalIdChange$.next('');
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