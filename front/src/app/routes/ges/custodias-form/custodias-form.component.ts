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
    providers: [CurrencyPipe]
})
export class CustodiaFormComponent {
    private currencyPipe = inject(CurrencyPipe)

    isLoading = signal(false);
    objPersonal = { PersonalId: 0, HorasTrabajadas: 0, ImporteSumaFija: 0, Importe: 0, detalle: '', detalleRetiro: '' }
    objVehiculo = { Patente: '', PersonalId: 0, ImporteVehiculo: null, PeajeVehiculo: null }
    objAudit = { usuario: '', fecha: '', accion: '' }
    personalId = signal(0);
    custodiaId = model(0);
    edit = model(true)
    costo = signal(0)
    auditHistory = signal<any[]>([])


    facturacion = signal(0)
    horaspopover = signal('test')
    diferencia = computed(() => {
        if (this.costo() || this.facturacion()) {
            const diffTmp = (this.facturacion() > 0) ? 100 - this.costo() * 100 / this.facturacion() : 0
            return Math.round(diffTmp * 100) / 100;
        }  else
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
        CustodiaCodigo: 0, Responsable: '', ClienteId: 0, DescripcionRequirente: '',
        Descripcion: '', FechaInicio: '', Origen: '', FechaFin: '', Destino: '',
        personal: this.fb.array([this.newRowPersonal()]),
        vehiculos: this.fb.array([this.fb.group({ ...this.objVehiculo })]),
        CantidadModulos: null, ImporteModulo: null, CantidadHorasExcedente: null, ImporteHorasExcedente: null, CantidadKmExcedente: null,
        ImporteKmExcedente: null, ImportePeaje: null, ImporteFactura: 0, EstadoCodigo: 0, NumeroFactura: 0, DescripcionFacturacion: '', FechaLiquidacion: ''
    })
    personal(): FormArray {
        return this.formCus.get("personal") as FormArray
    }
    vehiculos(): FormArray {
        return this.formCus.get("vehiculos") as FormArray
    }
    numFactura(): boolean {
        const value = this.formCus.get("EstadoCodigo")?.value
        return (value == 4)
    }

    anioLiquidacion(): number {
        return new Date(this.formCus.get("FechaFin")?.value!).getFullYear()
    }

    mesLiquidacion(): number {
        return new Date(this.formCus.get("FechaFin")?.value!).getMonth() + 1
    }


    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    async load() {
        if (this.custodiaId()) {
            let infoCust = await firstValueFrom(this.searchService.getInfoObjCustodia(this.custodiaId()))

            infoCust.FechaInicio = new Date(infoCust.FechaInicio)
            if (infoCust.FechaFin)
                infoCust.FechaFin = new Date(infoCust.FechaFin)
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

            this.auditHistory.set([
                {usuario: infoCust.AudUsuarioIng, fecha: this.formatDate(infoCust.AudFechaIng), accion: 'Creación'},
                {usuario: infoCust.AudUsuarioMod, fecha: this.formatDate(infoCust.AudFechaMod), accion: 'Modificación'}
            ])

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
        this.auditHistory.set([])
        this.formCus.reset({ EstadoCodigo: 0 })

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
        const PersonalId = persona.get('PersonalId')?.value
        const HorasTrabajadas: number = persona.value.HorasTrabajadas || 0
        const ImporteSumaFija: number = persona.value.ImporteSumaFija || 0

        if (PersonalId) {
            const categorias = await firstValueFrom(this.searchService.getCategoriasPersona(PersonalId, this.anio(), this.mes(), 1, 0))
            const catcus = categorias.categorias?.filter((c: any) => c.TipoAsociadoId == 2)
            valorHora = catcus[0]?.ValorLiquidacionHoraNormal || 0
            fullName = catcus[0]?.fullName || ''
        }

        if (persona.enabled) {
            const totalTmp: number = Number(HorasTrabajadas) * Number(valorHora) + Number(ImporteSumaFija)
            
            const total = Math.round(totalTmp * 100) / 100;

            persona.patchValue({
                importe: total,
                detalle: `${fullName} \n ${this.currencyPipe.transform(valorHora)} * ${HorasTrabajadas}hs = ${this.currencyPipe.transform(HorasTrabajadas * valorHora)} (Valor Hora Cat * Horas Trabajadas)`,
                detalleRetiro: `${this.currencyPipe.transform(valorHora)} * ${HorasTrabajadas}hs + ${this.currencyPipe.transform(ImporteSumaFija)} (Cat Valor Hora * Horas Trabajadas + Suma fija)`
            }, { onlySelf: false, emitEvent: false, })
            persona.get('PersonalId')?.markAsPending()
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
                const res = await firstValueFrom(this.apiService.updateObjCustodia({ ...form, anio: this.anio(), mes: this.mes() }, this.custodiaId()))
                const oldAuditHistory: any[] = this.auditHistory()
                oldAuditHistory.pop()
                oldAuditHistory.push({usuario: res.data.AudUsuarioMod, fecha: this.formatDate(res.data.AudFechaMod), accion: 'Modificación'})
                this.auditHistory.set(oldAuditHistory)
            } else {
                const res = await firstValueFrom(this.apiService.addObjCustodia({ ...form, anio: this.anio(), mes: this.mes() }))
                if (res.data.custodiaId) {
                    this.custodiaId.set(Number(res.data.custodiaId))
                    this.formCus.patchValue({ CustodiaCodigo: res.data.custodiaId, Responsable: res.data.responsable })
                    this.auditHistory.set([
                        {usuario: res.data.AudUsuarioIng, fecha: this.formatDate(res.data.AudFechaIng), accion: 'Creación'},
                        {usuario: res.data.AudUsuarioIng, fecha: this.formatDate(res.data.AudFechaIng), accion: 'Modificación'}
                    ])
                }
            }

            this.formCus.markAsUntouched()
            this.formCus.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }

    onChangeImpo() {
        const facturacionTmp = (Number(this.formCus.value.CantidadModulos) ?? 0) * (Number(this.formCus.value.ImporteModulo) ?? 0) +
            (Number(this.formCus.value.CantidadHorasExcedente) ?? 0) * (Number(this.formCus.value.ImporteHorasExcedente) ?? 0) +
            (Number(this.formCus.value.CantidadKmExcedente) ?? 0) * (Number(this.formCus.value.ImporteKmExcedente) ?? 0) +
            (Number(this.formCus.value.ImportePeaje) ?? 0)
        
        const facturacion = Math.round(facturacionTmp * 100) / 100;

        this.formCus.controls['ImporteFactura'].patchValue(facturacion)
        this.facturacion.set(facturacion)
    }

    async searchDueno(index: number) {
        let value = this.vehiculos().value[index]
        const Patente = value.Patente
        if (Patente.length > 5) {
            const res = await firstValueFrom(this.searchService.getLastPersonalByPatente(Patente))
            if (res) {
                value.PersonalId = res.PersonalId
                this.vehiculos().controls[index].patchValue(value)
            }
        }
    }

    async searchDescRequirente() {
        const ClienteId = this.formCus.value['ClienteId']
        if (ClienteId) {
            const res = await firstValueFrom(this.searchService.getRequirentesByCliente(ClienteId))
            if (res.length) {
                this.optionsDescRequirente = res
            }
        }
    }

    onChangeCosto() {
        setTimeout(() => {
            let costo = 0
            const personal = this.personal()
            const vehiculos = this.vehiculos()

            personal.value.forEach((obj: any) => { costo += Number(obj.Importe) })
            vehiculos.value.forEach((obj: any) => { costo += (Number(obj.ImporteVehiculo) + Number(obj.PeajeVehiculo)) })

            this.costo.set(costo)

        }, 400);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private formatDate(dateString: string): string {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
    }

}