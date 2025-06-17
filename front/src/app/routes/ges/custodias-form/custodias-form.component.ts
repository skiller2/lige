import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, effect, ChangeDetectionStrategy, signal, model, Input, input, computed, } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { NgForm, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzTypographyModule } from 'ng-zorro-antd/typography';


@Component({
    selector: 'app-custodias-form',
    templateUrl: './custodias-form.component.html',
    styleUrls: ['./custodias-form.component.less'],
    encapsulation: ViewEncapsulation.None,
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, NzAutocompleteModule, NzTypographyModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers:[CurrencyPipe]
})
export class CustodiaFormComponent {
    private currencyPipe = inject(CurrencyPipe)

    isLoading = signal(false);
    objPersonal = { personalId: 0, horas_trabajadas: 0, importe_suma_fija: 0, importe: 0, detalle: '',detalleRetiro:'' }
    objVehiculo = { patente: '', duenoId: 0, importe: null, peaje: null }
    personalId = signal(0);
    custodiaId = model(0);
    edit = model(true)
    costo = signal(0)
    facturacion = signal(0)
    horaspopover = signal('test')
    diferencia = computed(() => {
        if (this.costo() || this.facturacion())
            return (this.facturacion() > 0) ? 100 - this.costo() * 100 / this.facturacion() : 0
        else
            return 0
    });

    anio = input(0)
    mes = input(0)

    optionsDescRequirente: Array<any> = []

    private apiService = inject(ApiService)
    private searchService = inject(SearchService)
    private injector = inject(Injector)

    private destroy$ = new Subject<void>();

    fb = inject(FormBuilder)

    newRowPersonal() {
        const row = this.fb.group({ ...this.objPersonal })
        row.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.updatePersonaImporte(row))
        return row
    }

    formCus = this.fb.group({
        id: 0, responsable: '', clienteId: 0, descRequirente: '',
        descripcion: '', fechaInicio: '', origen: '', fechaFinal: '', destino: '',
        personal: this.fb.array([this.newRowPersonal()]),
        vehiculos: this.fb.array([this.fb.group({ ...this.objVehiculo })]),
        cantModulos: null, impoModulos: null, cantHorasExced: null, impoHorasExced: null, cantKmExced: null,
        impoKmExced: null, impoPeaje: null, facturacion: 0, estado: 0, numFactura: 0, desc_facturacion: '', fecha_liquidacion: ''
    })
    personal(): FormArray {
        return this.formCus.get("personal") as FormArray
    }
    vehiculos(): FormArray {
        return this.formCus.get("vehiculos") as FormArray
    }
    numFactura(): boolean {
        const value = this.formCus.get("estado")?.value
        return (value == 4)
    }

    anioLiquidacion(): number {
        return new Date(this.formCus.get("fechaFinal")?.value!).getFullYear()
    }

    mesLiquidacion(): number {
        return new Date(this.formCus.get("fechaFinal")?.value!).getMonth() + 1
    }


    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    async load() {
        if (this.custodiaId()) {
            let infoCust = await firstValueFrom(this.searchService.getInfoObjCustodia(this.custodiaId()))
            infoCust.fechaInicio = new Date(infoCust.fechaInicio)
            if (infoCust.fechaFinal)
                infoCust.fechaFinal = new Date(infoCust.fechaFinal)
            this.personal().clear()
            this.vehiculos().clear()

            infoCust.personal.forEach((obj: any) => {
                this.personal().push(this.newRowPersonal())
            });
            if (this.personal().length == 0)
                this.personal().push(this.newRowPersonal())

            infoCust.vehiculos.forEach((obj: any) => {
                this.vehiculos().push(this.fb.group({ ...this.objVehiculo }))
            });
            if (this.vehiculos().length == 0)
                this.vehiculos().push(this.fb.group({ ...this.objVehiculo }))

            this.formCus.reset(infoCust)
            setTimeout(() => {
                this.onChangeCosto()
                this.onChangeImpo()
            }, 100)
        }

        if (this.edit()) {
            this.formCus.enable()
        } else {
            this.formCus.disable()
        }


    }

    async reset() {
        this.personal().clear()
        this.vehiculos().clear()
        this.personal().push(this.newRowPersonal())
        this.vehiculos().push(this.fb.group({ ...this.objVehiculo }))
        this.formCus.reset({ estado: 0 })

        if (this.edit()) {
            this.formCus.enable()
        } else {
            this.formCus.disable()
        }
    }

    onChangePeriodo(result: Date): void {
        /*
                if (result) {
                    const date = new Date(result)
                    const year = date.getFullYear()
                    const month = date.getMonth() + 1
                    this.periodo.set({ year, month })
                }
        */
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit()) {
            this.personal().push(this.newRowPersonal())
        }
    }

    async updatePersonaImporte(persona: FormGroup): Promise<void> {
        let valorHora = 0, fullName = ''
        const personalId = persona.get('personalId')?.value
        const horas_trabajadas = persona.value.horas_trabajadas || 0
        const importe_suma_fija = persona.value.importe_suma_fija || 0

        if (personalId) {
            const categorias = await firstValueFrom(this.searchService.getCategoriasPersona(personalId, this.anio(), this.mes(), 1, 0))
            const catcus = categorias.categorias?.filter((c: any) => c.TipoAsociadoId == 2)
            valorHora = catcus[0]?.ValorLiquidacionHoraNormal || 0
            fullName = catcus[0]?.fullName || ''
        }

        if (persona.enabled) {
            persona.patchValue({
                importe: horas_trabajadas * valorHora + importe_suma_fija,
                detalle: `${fullName} \n ${this.currencyPipe.transform(valorHora)} * ${horas_trabajadas}hs = ${this.currencyPipe.transform(horas_trabajadas * valorHora)} (Valor Hora Cat * Horas Trabajadas)`,
                detalleRetiro: `${this.currencyPipe.transform(valorHora)} * ${horas_trabajadas}hs + ${this.currencyPipe.transform(importe_suma_fija)} (Cat Valor Hora * Horas Trabajadas + Suma fija)`
            }, { onlySelf: false, emitEvent: false, })
            persona.get('personalId')?.markAsPending()
        }

    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault();
        if (this.edit()) {
            this.vehiculos().push(this.fb.group({ ...this.objVehiculo }))
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
                await firstValueFrom(this.apiService.updateObjCustodia({ ...form, anio: this.anio(), mes: this.mes() }, this.custodiaId()))
            } else {
                const res = await firstValueFrom(this.apiService.addObjCustodia({ ...form, anio: this.anio(), mes: this.mes() }))
                if (res.data.custodiaId) {
                    this.custodiaId.set(Number(res.data.custodiaId))
                    this.formCus.patchValue({ id: res.data.custodiaId, responsable: res.data.responsable })

                }
            }

            this.formCus.markAsUntouched()
            this.formCus.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

    onChangeImpo() {
        const facturacion = parseFloat(((this.formCus.value.cantModulos ?? 0) * (this.formCus.value.impoModulos ?? 0) +
            (this.formCus.value.cantHorasExced ?? 0) * (this.formCus.value.impoHorasExced ?? 0) +
            (this.formCus.value.cantKmExced ?? 0) * (this.formCus.value.impoKmExced ?? 0) +
            (this.formCus.value.impoPeaje ?? 0)).toFixed(2))
        this.formCus.controls['facturacion'].patchValue(facturacion)
        this.facturacion.set(facturacion)
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

    onChangeCosto() {
        let costo = 0
        let personal = this.personal()
        let vehiculos = this.vehiculos()
        personal.value.forEach((obj: any) => { costo += obj.importe })
        vehiculos.value.forEach((obj: any) => { costo += (obj.importe + obj.peaje) })

        this.costo.set(costo)
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }


}