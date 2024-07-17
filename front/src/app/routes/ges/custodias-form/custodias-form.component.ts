import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';


@Component({
    selector: 'app-custodias-form',
    templateUrl: './custodias-form.component.html',
    styleUrls: ['./custodias-form.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, DetallePersonaComponent, FiltroBuilderComponent, NzAutocompleteModule],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CustodiaFormComponent {

    visibleDrawer: boolean = false
    periodo = signal({ year: 0, month: 0 });
    objPersonal = { personalId: 0, importe: null }
    objVehiculo = { patente: '', duenoId: 0, importe: null, peaje: null }
    personalId = signal(0);
    custodiaId = model(0);

    optionsDescRequirente: Array<any> = []

    private apiService = inject(ApiService)
    private searchService = inject(SearchService)
    private injector = inject(Injector)
    edit = input(true)

    fb = inject(FormBuilder)
    formCus = this.fb.group({ clienteId: 0, descRequirente: '', descripcion: '',
        fechaInicio: '', origen: '', fechaFinal: '', destino: '',
        personal: this.fb.array([this.fb.group({...this.objPersonal}),this.fb.group({...this.objPersonal})]),
        vehiculos: this.fb.array([this.fb.group({...this.objVehiculo})]),
        cantModulos: null, impoModulos: null, cantHorasExced: null, impoHorasExced: null, cantKmExced: null,
        impoKmExced: null, impoPeaje: null, facturacion: 0, estado: 0,
    })
    personal():FormArray {
        return this.formCus.get("personal") as FormArray
    }
    vehiculos():FormArray {
        return this.formCus.get("vehiculos") as FormArray
    }

    $optionsEstadoCust = this.searchService.getEstadoCustodia();
    
    ngOnInit() {
        effect(async () => {
            // console.log(`The editCustodiaId is: ${this.custodiaId()}`);
            if (this.custodiaId()) {
                await this.load()
            } else {
                this.formCus.reset()
            }
        }, { injector: this.injector });
        
        effect(async () => {
            if (this.edit()) {
                this.formCus.enable()
            }else{
                this.formCus.disable()
            }
        }, { injector: this.injector });
    }

    async load() {
        let infoCust= await firstValueFrom(this.searchService.getInfoObjCustodia(this.custodiaId()))
        // console.log('datos custodia',infoCust)
        infoCust.fechaInicio = new Date(infoCust.fechaInicio)
        if (infoCust.fechaFinal)
            infoCust.fechaFinal = new Date(infoCust.fechaFinal)
        this.personal().clear()
        this.vehiculos().clear()
        infoCust.personal.forEach((obj:any) => {
            this.personal().push(this.fb.group({...this.objPersonal}))
        });
        infoCust.vehiculos.forEach((obj:any) => {
            this.vehiculos().push(this.fb.group({...this.objVehiculo}))
        });
        if (this.edit()) {
            this.personal().enable()
            this.vehiculos().enable()
        }else{
            this.personal().disable()
            this.vehiculos().disable()
        }
        setTimeout(() => {
            this.formCus.patchValue(infoCust)       
        }, 100);
        {}
    }

    onChangePeriodo(result: Date): void {
        if (result) {
            const year = result.getFullYear()
            const month = result.getMonth() + 1
            this.periodo.set({ year, month })
        }
    }

    openDrawer(index: any): void {
        const personalId = this.personal().value[index].personalId
        if (!personalId) return
        this.personalId.set(personalId)
        this.visibleDrawer = true
    }

    closeDrawer(): void {
        this.visibleDrawer = false;
        this.personalId.set(0)
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit()) {
            this.personal().controls.push((this.fb.group({...this.objPersonal})))
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
        const form = this.formCus.value
        // console.log('form', form);
        if (this.custodiaId()) {
            await firstValueFrom(this.apiService.updateObjCustodia(form, this.custodiaId()))
        } else {
            const res = await firstValueFrom(this.apiService.addObjCustodia(form))
            if (res.data.custodiaId) {
               this.custodiaId.set(res.data.custodiaId)
            }
        }
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