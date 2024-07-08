import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
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
    ngForm = viewChild.required(NgForm);
    cantInputs : Array<number> = [1,2,3,4]
    listInputPersonal: Array<number> = this.cantInputs.slice(0,2);
    listInputVehiculo: Array<number> = this.cantInputs.slice(0,1);
    optionsDescRequirente: Array<any> = []

    visibleDrawer: boolean = false
    periodo = signal({ year: 0, month: 0 });
    personalId = signal(0);
    editCustodiaId = signal(0);
    private apiService = inject(ApiService)
    private searchService = inject(SearchService)

    @Input() set custodia(value: number) {
        this.editCustodiaId.set(value);
        if (this.editCustodiaId()){
            this.load()
        } else {
            this.ngForm().reset()
        }
    }

    @Input() edit: boolean = true

    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    // ngOnInit() {
    //     this.ngForm().form.disable()
    // }

    async load() {
        const res = await firstValueFrom(this.searchService.getInfoObjCustodia(this.editCustodiaId()))
        res.form.fechaInicio = new Date(res.form.fechaInicio)
        if(res.form.fechaFinal)
            res.form.fechaFinal = new Date(res.form.fechaFinal)
        this.listInputPersonal = res.personalLength
        this.listInputVehiculo = res.vehiculoLength
        // console.log(this.ngForm().value);
        // console.log(res);
        this.ngForm().reset(res.form)
    }

    onChangePeriodo(result: Date): void {
        if (result) {
            const year = result.getFullYear()
            const month = result.getMonth()+1
            this.periodo.set({ year, month })
        }
    }

    openDrawer(key:any): void {
        const personalId = this.ngForm().value[key]
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
        if (this.edit) {
            const id = this.listInputPersonal.length > 0 ? this.listInputPersonal[this.listInputPersonal.length - 1] + 1 : 0;
            this.listInputPersonal.push(id);
        }
    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit) {
            const id = this.listInputVehiculo.length > 0 ? this.listInputVehiculo[this.listInputVehiculo.length - 1] + 1 : 0;
            this.listInputVehiculo.push(id);
        }
    }

    removePersonal(i: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputPersonal.length > 1 && this.edit) {
            const index = this.listInputPersonal.indexOf(i);
            this.listInputPersonal.splice(index, 1);
        }
    }

    removeVehiculo(i: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputVehiculo.length > 1 && this.edit) {
            const index = this.listInputVehiculo.indexOf(i);
            this.listInputVehiculo.splice(index, 1);
        }
    }

    async save() {
        const form = this.ngForm().value
        if (this.editCustodiaId()) {
            await firstValueFrom(this.apiService.updateObjCustodia(form, this.editCustodiaId()))
        } else {
            const res = await firstValueFrom(this.apiService.addObjCustodia(form))
            if (res.data.custodiaId){
                this.editCustodiaId.set(res.data.custodiaId)
            }
        }
    }

    onChangeImpo(){
        const form = this.ngForm().value
        let facturacion : number = 0
        for (const key in form) {
            if (!(parseInt(key)) && key.includes('impo') && form[key]) {
                let auxKey = key.slice('impo'.length)
                auxKey = 'cant'+auxKey
                if (form[auxKey] !== undefined) {
                    let cant = form[auxKey]? form[auxKey] : 0
                    facturacion += (form[key] * cant);
                } else {
                    facturacion += form[key];
                }
            }
        }
        this.ngForm().controls['facturacion'].setValue(facturacion)
    }

    async searchDueno(index: number){
        const keyDueno = index + 'duenoId'
        const patente = this.ngForm().value['1patente']
        if (patente.length > 5) {
            const res = await firstValueFrom(this.searchService.getLastPersonalByPatente(patente))
            if (res) {
                this.ngForm().controls[keyDueno].setValue(res.duenoId)
            }
        }
    }

    async searchDescRequirente(){
        const clienteId = this.ngForm().value['clienteId']
        if (clienteId) {
            const res = await firstValueFrom(this.searchService.getRequirentesByCliente(clienteId))
            if (res.length) {
                this.optionsDescRequirente = res
            }
        }
    }

}