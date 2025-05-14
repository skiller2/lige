import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, output } from '@angular/core';
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
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';

@Component({
    selector: 'app-descuentos-objetivos-alta-drawer',
    templateUrl: './descuentos-objetivos-alta-drawer.component.html',
    styleUrl: './descuentos-objetivos-alta-drawer.component.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, ObjetivoSearchComponent],
    providers: [AngularUtilService]
})
export class DescuentosObjetivosAltaDrawerComponent {
    isLoading = signal(false);
    visibleDesc = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    descuentoId = model<number>(0);
    objetivoId = model<number>(0);
    disabled = input<boolean>(false);
    onAddorUpdate = output()

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        // private settingService: SettingsService,
    ) {
        effect(async() => { 
            const visible = this.visibleDesc()
            if (visible) {
                if (this.descuentoId() && this.objetivoId()) {
                    let infoDesc = await firstValueFrom(this.searchService.getDescuentoObjetivo(this.objetivoId(), this.descuentoId()))
                    this.formDesc.reset(infoDesc)
                    this.formDesc.markAsUntouched()
                    this.formDesc.markAsPristine()
                }

                if (this.disabled())
                    this.formDesc.disable()
                else
                    this.formDesc.enable()
                
            }
            else {
                this.formDesc.reset()
                this.formDesc.enable()
            }
        })
    }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formDesc = this.fb.group({
        id: 0,
        DescuentoId: 0, ObjetivoId:0, AplicaEl:new Date(),
        Cuotas:null, Importe:null, Detalle:''
    })

    $optionsDescuento = this.searchService.getDecuentosOptions();

    // $listaDecuentosPer = this.selectedPersonalIdChange$.pipe(
    //     debounceTime(500),
    //     switchMap(() =>{
    //         return this.searchService.getDescuentosByPersonalId(this.PersonalId(), this.anio(), this.mes())
    //     })
    // );

    id():number {
        const value = this.formDesc.get("id")?.value
        if (value) {
          return value
        }
        return 0
    }

    ObjetivoId():number {
        const value = this.formDesc.get("ObjetivoId")?.value
        if (value) {
          return value
        }
        return 0
    }

    anio():number {
        const value = this.formDesc.get("AplicaEl")?.value
        if(value) return value.getFullYear()
        return 0
    }

    mes():number {
        const value = this.formDesc.get("AplicaEl")?.value
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
        let values = this.formDesc.value
        try {
            if (values.id) {
                await firstValueFrom(this.apiService.updateDescuento(values))
            }else{
                const res = await firstValueFrom(this.apiService.addDescuento(values))
                if (res.data.id)
                    this.formDesc.patchValue({ id: res.data.id })
            }
            this.onAddorUpdate.emit()
            this.selectedPersonalIdChange$.next('')
            this.formDesc.markAsUntouched()
            this.formDesc.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

    resetForm() {
        this.formDesc.reset()
    }

}