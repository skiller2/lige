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
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
@Component({
    selector: 'app-descuentos-personal-alta-drawer',
    templateUrl: './descuentos-personal-alta-drawer.component.html',
    styleUrl: './descuentos-personal-alta-drawer.component.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, PersonalSearchComponent],
    providers: [AngularUtilService]
})
export class DescuentosPersonalAltaDrawerComponent {
    isLoading = signal(false);
    visibleDesc = model<boolean>(false)
    descuentoId = model<number>(0);
    personalId = model<number>(0);
    disabled = input<boolean>(false);
    cancelDesc = input<boolean>(false);
    isAnulacion = input<boolean>(false);
    placement: NzDrawerPlacement = 'left';
    onAddorUpdate = output()

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        // private settingService: SettingsService,
    ) {
        effect(async() => { 
            const visible = this.visibleDesc()
          
            if (visible) {
                if (this.descuentoId() && this.personalId()) {
                    let infoDes = await firstValueFrom(this.searchService.getDescuentoPersona(this.personalId(), this.descuentoId()))
                    this.formDesc.reset(infoDes)
                    // console.log('infoDes: ', infoDes);
                    this.importeCuotaChange()
                    this.formDesc.markAsUntouched()
                    this.formDesc.markAsPristine()
                }

                if (this.disabled())  {
                    this.formDesc.disable();
                    
                    if (this.isAnulacion()) {
                      this.formDesc.get('DetalleAnulacion')?.enable(); 
                    }
                } else {
                    this.formDesc.enable()
                }
                
            } else {
                this.formDesc.reset()
                this.formDesc.enable()
            }
        })
    }
    
    private destroy$ = new Subject();
    $selectedPersonalIdChange = new BehaviorSubject('');
    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formDesc = this.fb.group({
        id: 0,
        DescuentoId: 0, PersonalId:0, AplicaEl:new Date(),
        Cuotas:null, Importe:null, Detalle:'',
        DetalleAnulacion:'', importeCuota: '',
        FechaAnulacion: null
    })

    


    $sitrevista = this.formDesc.get('PersonalId')!.valueChanges.pipe(
        debounceTime(500),
        switchMap(() =>
          this.apiService
            .getPersonaSitRevista(
              Number(this.PersonalId()),
              this.anio(),
              this.mes()
            )
        )
    )

    $optionsTipo = this.searchService.getDecuentosTipoOptions();

    $listaDecuentosPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            return this.searchService.getDescuentosByPersonalId(this.PersonalId(), this.anio(), this.mes())
        })
    );

    id():number {
        const value = this.formDesc.get("id")?.value
        if (value) {
          return value
        }
        return 0
    }

    PersonalId():number {
        const value = this.formDesc.get("PersonalId")?.value
        if (value) {
          return value
        }
        return 0
    }

    anio():number {
        const value = this.formDesc.get("AplicaEl")?.value
        if(value){
            const date = new Date(value)
            return date.getFullYear()
        }
        return 0
    }

    mes():number {
        const value = this.formDesc.get("AplicaEl")?.value
        if(value) {
            const date = new Date(value)
            return date.getMonth()+1
        }
        return 0
    }

    Importe():number {
        const value = this.formDesc.get("Importe")?.value
        if (value) return value
        return 0
    }

    Cuotas():number {
        const value = this.formDesc.get("Cuotas")?.value
        if (value) return value
        return 0
    }

    DetalleAnulacion():string {
        const value = this.formDesc.get("DetalleAnulacion")?.value
        if (value?.length) return value
        return ''
    }

    FechaAnulacion():Date | null {
        const value = this.formDesc.get("FechaAnulacion")?.value
        if(value){
            const date = new Date(value)
            return date
        }
        return null
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
        let values = this.formDesc.getRawValue()
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

    importeCuotaChange(){
        if (this.Importe() && this.Cuotas())
            this.formDesc.get('importeCuota')?.setValue((this.Importe() / this.Cuotas()).toString())
        else
            this.formDesc.get('importeCuota')?.setValue('')
    }

    async cancel(){
        this.isLoading.set(true)
        let values = this.formDesc.getRawValue()
        try {
            if (this.descuentoId() && this.personalId()) {
                await firstValueFrom(this.apiService.cancellationPersonalOtroDescuento(values))
                this.onAddorUpdate.emit()
                this.selectedPersonalIdChange$.next('')
                this.formDesc.markAsUntouched()
                this.formDesc.markAsPristine()
            }
        } catch (e) {}
        this.isLoading.set(false)
    }

}