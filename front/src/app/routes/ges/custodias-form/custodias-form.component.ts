import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';


@Component({
    selector: 'app-custodias-form',
    templateUrl: './custodias-form.component.html',
    styleUrls: ['./custodias-form.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, DetallePersonaComponent, NzAutocompleteModule],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CustodiaFormComponent {

    isLoading = signal(false);
    periodo = signal({ year: 0, month: 0 });
    objPersonal = { personalId: 0, importe: null }
    objVehiculo = { patente: '', duenoId: 0, importe: null, peaje: null }
    personalId = signal(0);
    custodiaId = model(0);
    edit = model(true)

    optionsDescRequirente: Array<any> = []

    private apiService = inject(ApiService)
    private searchService = inject(SearchService)
    private injector = inject(Injector)

    fb = inject(FormBuilder)
    formCus = this.fb.group({ id: 0, responsable: '', clienteId: 0, descRequirente: '',
        descripcion: '', fechaInicio: '', origen: '', fechaFinal: '', destino: '',
        personal: this.fb.array([this.fb.group({...this.objPersonal}),this.fb.group({...this.objPersonal})]),
        vehiculos: this.fb.array([this.fb.group({...this.objVehiculo})]),
        cantModulos: null, impoModulos: null, cantHorasExced: null, impoHorasExced: null, cantKmExced: null,
        impoKmExced: null, impoPeaje: null, facturacion: 0, estado: 0, numFactura: 0, desc_facturacion: ''
    })
    personal():FormArray {
        return this.formCus.get("personal") as FormArray
    }
    vehiculos():FormArray {
        return this.formCus.get("vehiculos") as FormArray
    }
    numFactura():boolean {
        const value = this.formCus.get("estado")?.value
        if(value == 3 || value == 4)
            return true
        else
        return false
    }

    $optionsEstadoCust = this.searchService.getEstadoCustodia();
    
    ngOnInit() {
        effect(async () => {
            // console.log(`The editCustodiaId is: ${this.custodiaId()}`);
            if (this.custodiaId()) {
                await this.load()
            } else {
                this.personal().clear()
                this.vehiculos().clear()
                this.personal().push(this.fb.group({...this.objPersonal}))
                this.vehiculos().push(this.fb.group({...this.objVehiculo}))
                this.formCus.reset({estado: 0})
            }
        }, { injector: this.injector });
        
        effect(async () => {
            // console.log(this.edit());
            if (this.edit()) {
                this.formCus.enable()
            }else{
                this.formCus.disable()
            }
        }, { injector: this.injector });
    }

    async load() {
        let infoCust= await firstValueFrom(this.searchService.getInfoObjCustodia(this.custodiaId()))
        infoCust.fechaInicio = new Date(infoCust.fechaInicio)
        if (infoCust.fechaFinal)
            infoCust.fechaFinal = new Date(infoCust.fechaFinal)
        this.personal().clear()
        this.vehiculos().clear()

        infoCust.personal.forEach((obj:any) => {
            this.personal().push(this.fb.group({...this.objPersonal}))
        });
        if (this.personal().length == 0)
            this.personal().push(this.fb.group({...this.objPersonal}))
        
        infoCust.vehiculos.forEach((obj:any) => {
            this.vehiculos().push(this.fb.group({...this.objVehiculo}))
        });
        if (this.vehiculos().length == 0)
            this.vehiculos().push(this.fb.group({...this.objVehiculo}))

        this.formCus.reset(infoCust)

        
        if (this.edit()) {
            this.formCus.enable()
        }else{
            this.formCus.disable()
        }


        const currDate = new Date()
        this.periodo.set({year:currDate.getFullYear(),month:currDate.getMonth()+1})
    }

    onChangePeriodo(result: Date): void {
        if (result) {
            const date = new Date(result)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            this.periodo.set({ year, month })
        }
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit()) {
            this.personal().push((this.fb.group({...this.objPersonal})))
        }
    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit()) {
            this.vehiculos().push(this.fb.group({...this.objVehiculo}))
        }
    }

    removePersonal(index: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.personal().controls.length > 1 && this.edit()) {
            this.personal().removeAt(index)
        }
    }

    removeVehiculo(index: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.vehiculos().controls.length > 1 && this.edit()) {
            this.vehiculos().removeAt(index)
        }
    }

    async save() {
        this.isLoading.set(true)
        const form = this.formCus.value
        try {
            if (this.custodiaId()) {
                await firstValueFrom(this.apiService.updateObjCustodia(form, this.custodiaId()))
            } else {
                const res = await firstValueFrom(this.apiService.addObjCustodia(form))
                if (res.data.custodiaId)
                    this.custodiaId.set(Number(res.data.custodiaId))
            }
            this.formCus.markAsUntouched()
            this.formCus.markAsPristine()
        } catch (e) {
            
        }
        this.isLoading.set(false)
    }

    onChangeImpo() {
        const form = Object(this.formCus.value)
        let facturacion: number = 0
        for (const key in form) {
            if (key.includes('impo') && form[key]) {
                let auxKey = key.slice('impo'.length)
                auxKey = 'cant' + auxKey
                if (form[auxKey] !== undefined) {
                    let cant = form[auxKey] ? form[auxKey] : 0
                    facturacion += (form[key] * cant);
                } else {
                    facturacion += form[key];
                }
            }
        }
        this.formCus.controls['facturacion'].patchValue(facturacion)
    }

    async searchDueno(index: number) {
        let value = this.vehiculos().value[index]
        const patente = value.patente
        if (patente.length > 5) {
            const res = await firstValueFrom(this.searchService.getLastPersonalByPatente(patente))
            if (res) {
                value.duenoId = res.duenoId
                this.vehiculos().controls[index].patchValue(value)
            }
        }
    }

    async searchDescRequirente() {
        const clienteId = this.formCus.value['clienteId']
        if (clienteId) {
            const res = await firstValueFrom(this.searchService.getRequirentesByCliente(clienteId))
            if (res.length) {
                this.optionsDescRequirente = res
            }
        }
    }

}