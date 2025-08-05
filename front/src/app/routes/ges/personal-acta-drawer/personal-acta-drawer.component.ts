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
    selector: 'app-personal-acta-drawer',
    templateUrl: './personal-acta-drawer.component.html',
    styleUrl: './personal-acta-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalActaDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleActa = model<boolean>(false)
    periodo = signal(new Date())
    placement: NzDrawerPlacement = 'left';
    noOptions = signal<any[]>([])

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formActa = this.fb.group({
        ActaId:0, TipoActa:0, PersonalActaDescripcion:'',
        ActaFechaActa:'', PersonalSituacionRevistaId:0
    })

    optionsNroActa:any[] = []
    $optionsTipoActa = this.searchService.getTipoPersonalActaOptions();
    $optionsSitRevsitaAsoc = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            return this.searchService.getSitRevsitaAsocByPersonalId(this.PersonalId());
        })
    );
    
    // $optionsTipoPersonalActa = this.searchService.getTipoPersonalActaOptions(); 
    $listaPersonalActa = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getHistorialPersonalActa(
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
        this.optionsNroActa = await firstValueFrom(this.searchService.getNroActaOptions())
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading.set(true)
        let values = this.formActa.value
        try {
            await firstValueFrom(this.apiService.addPersonalActa(this.PersonalId(), values))
            this.selectedPersonalIdChange$.next('')
            this.formActa.markAsUntouched()
            this.formActa.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

    selectedNroActaChange(event: any):void{
        let acta = this.optionsNroActa.find(acta => acta.value == event)
        if (acta?.ActaFechaActa) {
            this.formActa.get('ActaFechaActa')?.setValue(acta.ActaFechaActa)
        }
    }

}