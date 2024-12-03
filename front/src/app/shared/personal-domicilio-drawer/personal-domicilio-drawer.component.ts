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
    selector: 'app-personal-domicilio-drawer',
    templateUrl: './personal-domicilio-drawer.component.html',
    styleUrl: './personal-domicilio-drawer.component.less',
    standalone: true,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService],
})
  
export class PersonalDomicilioDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleDomicilio = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute,
        private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    fb = inject(FormBuilder)
    formDom = this.fb.group({
        calle:'', numero:'', piso:'', departamento:'', esquinaA:'', esquinaB:'',
        bloque:'', edificio:'', cuerpo:'', codPostal:'', paisId:0, provinciaId:0,
        localidadId:0, barrioId:0
    })

    paisId():number {
        const value = this.formDom.get("paisId")?.value
        if(value) return value
        else return 0
    }
    provinciaId():number {
        const value = this.formDom.get("provinciaId")?.value
        if(value) return value
        else return 0
    }
    // localidadId():number {
    //     const value = this.formDom.get("localidadId")?.value
    //     if(value) return value
    //     else return 0
    // }

    $selectedObjetivoIdChange = new BehaviorSubject('');
    selectedPersonalIdChange$ = new BehaviorSubject('');

    $optionsPais = this.searchService.getPaises();
    // $optionsProvincia = this.searchService.getProvinciasByPais(this.paisId());
    $optionsLocalidad = this.searchService.getLocalidadesByProvincia(this.paisId(), this.provinciaId());

    $optionsProvincia = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            return this.searchService.getProvinciasByPais(this.paisId())
        })
    );

    async ngOnInit(){
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading.set(true)
        const form = this.formDom.value
        console.log('value', form);
        try {

        } catch (e) {
            
        }
        this.isLoading.set(false)
    }

}