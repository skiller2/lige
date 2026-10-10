import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject, effect, ChangeDetectionStrategy, signal, input, output, computed, untracked, resource } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from '../../../services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { toSignal } from '@angular/core/rxjs-interop';
import { applyEach, disabled, form, FormField, required, submit } from '@angular/forms/signals';

// Estado Facturado: es el único que pide número de factura
const ESTADO_FACTURADO = 4

// Los inputs de texto (con máscara) trabajan con string: se convierte al cargar y al guardar
const aTexto = (valor: any): string => (valor == null) ? '' : String(valor)
const aNumero = (valor: string): string | null => (valor === '') ? null : valor

export interface PersonalCustodia {
    PersonalId: number
    HorasTrabajadas: string
    ImporteSumaFija: string
    Importe: number | null
}

export interface VehiculoCustodia {
    Patente: string
    PersonalId: number
    ImporteVehiculo: string
    PeajeVehiculo: string
}

export interface CustodiaForm {
    CustodiaCodigo: number
    Responsable: string
    ClienteId: number | null
    DescripcionRequirente: string
    Descripcion: string
    FechaInicio: Date | null
    Origen: string
    FechaFin: Date | null
    Destino: string
    personal: PersonalCustodia[]
    vehiculos: VehiculoCustodia[]
    CantidadModulos: number | null
    ImporteModulo: string
    CantidadHorasExcedente: number | null
    ImporteHorasExcedente: string
    CantidadKmExcedente: number | null
    ImporteKmExcedente: string
    ImportePeaje: string
    EstadoCodigo: number | null
    NumeroFactura: number | null
    DescripcionFacturacion: string
    FechaLiquidacion: Date | string | null
}

@Component({
    selector: 'app-custodias-form',
    templateUrl: './custodias-form.component.html',
    styleUrls: ['./custodias-form.component.less'],
    encapsulation: ViewEncapsulation.None,
    imports: [SHARED_IMPORTS, CommonModule, FormField, PersonalSearchComponent, ClienteSearchComponent, NzAutocompleteModule, NzTypographyModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe]
})
export class CustodiaFormComponent {
    private currencyPipe = inject(CurrencyPipe)
    private apiService = inject(ApiService)
    private searchService = inject(SearchService)

    // 0 = alta; mayor a 0 = custodia a cargar
    CustodiaCodigo = input<number>(0)
    soloLectura = input<boolean>(false)
    anio = input<number>(0)
    mes = input<number>(0)

    custodiaGuardada = output<number>()

    auditHistory = signal<any[]>([])
    optionsDescRequirente = signal<any[]>([])
    optionsEstadoCust = toSignal(this.searchService.getEstadoCustodia(), { initialValue: [] })

    private readonly defaultPersonal: PersonalCustodia = { PersonalId: 0, HorasTrabajadas: '', ImporteSumaFija: '', Importe: 0 }
    private readonly defaultVehiculo: VehiculoCustodia = { Patente: '', PersonalId: 0, ImporteVehiculo: '', PeajeVehiculo: '' }

    private readonly defaultCustodia: CustodiaForm = {
        CustodiaCodigo: 0, Responsable: '', ClienteId: null, DescripcionRequirente: '',
        Descripcion: '', FechaInicio: null, Origen: '', FechaFin: null, Destino: '',
        personal: [structuredClone(this.defaultPersonal)],
        vehiculos: [structuredClone(this.defaultVehiculo)],
        CantidadModulos: null, ImporteModulo: '', CantidadHorasExcedente: null, ImporteHorasExcedente: '',
        CantidadKmExcedente: null, ImporteKmExcedente: '', ImportePeaje: '',
        EstadoCodigo: 0, NumeroFactura: null, DescripcionFacturacion: '', FechaLiquidacion: null
    }

    readonly custodia = signal<CustodiaForm>(structuredClone(this.defaultCustodia))

    // El resto de las reglas (pares Cant/Importe, cierre por estado) las valida el back y vuelven como fieldErrors
    readonly formCustodia = form(this.custodia, (p) => {
        disabled(p, () => this.soloLectura())
        disabled(p.CustodiaCodigo, () => true)
        disabled(p.Responsable, () => true)
        required(p.ClienteId, { message: 'Cliente es requerido' })
        required(p.FechaInicio, { message: 'Fecha Inicial es requerida' })
        required(p.Origen, { message: 'Origen es requerido' })
        required(p.NumeroFactura, { message: 'Número de Factura es requerido', when: (ctx) => ctx.valueOf(p.EstadoCodigo) == ESTADO_FACTURADO })
        applyEach(p.vehiculos, (vehiculo) => {
            required(vehiculo.PersonalId, { message: 'Dueño es requerido', when: (ctx) => !!ctx.valueOf(vehiculo.Patente) })
        })
    })

    esFacturado = computed(() => this.custodia().EstadoCodigo == ESTADO_FACTURADO)

    // 1. Personas cargadas: cambia solo si se agrega, quita o cambia una persona
    private personalIds = computed(() =>
        this.custodia().personal.map(p => p.PersonalId).filter(id => id > 0).join(','))

    // 2. Valor hora de la categoría de custodia de cada persona (0 si no tiene). Se pide de nuevo cuando cambian las personas o el período
    private valoresHora = resource({
        params: () => ({ ids: this.personalIds(), anio: this.anio(), mes: this.mes() }),
        loader: async ({ params }) => {
            const valores: Record<number, number> = {}
            for (const id of params.ids.split(',').filter(Boolean).map(Number)) {
                const respuesta = await firstValueFrom(this.searchService.getCategoriasPersona(id, params.anio, params.mes, 1, 0))
                const categoriaCustodia = respuesta?.categorias?.find((c: any) => c.TipoAsociadoId == 2)
                valores[id] = Number(categoriaCustodia?.ValorLiquidacionHoraNormal) || 0
            }
            return valores
        },
        defaultValue: {}
    })

    // 3. Retiro de cada persona: en solo lectura el grabado; editando, Horas * Valor hora + Suma fija
    calculoPersonal = computed(() => {
        const valores = this.valoresHora.value()
        return this.custodia().personal.map(p => {
            if (this.soloLectura())
                return { Importe: Number(p.Importe) || 0, detalle: '', detalleRetiro: '' }

            const valorHora = valores[p.PersonalId] ?? 0
            const horas = Number(p.HorasTrabajadas) || 0
            const sumaFija = Number(p.ImporteSumaFija) || 0
            return {
                Importe: Math.round((horas * valorHora + sumaFija) * 100) / 100,
                detalle: `${this.currencyPipe.transform(valorHora)} * ${horas}hs = ${this.currencyPipe.transform(horas * valorHora)} (Valor Hora Cat * Horas Trabajadas)`,
                detalleRetiro: `${this.currencyPipe.transform(valorHora)} * ${horas}hs + ${this.currencyPipe.transform(sumaFija)} (Cat Valor Hora * Horas Trabajadas + Suma fija)`
            }
        })
    })

    costo = computed(() => {
        const personal = this.calculoPersonal().reduce((total, p) => total + p.Importe, 0)
        const vehiculos = this.custodia().vehiculos.reduce((total, v) => total + (Number(v.ImporteVehiculo) || 0) + (Number(v.PeajeVehiculo) || 0), 0)
        return personal + vehiculos
    })

    facturacion = computed(() => {
        const c = this.custodia()
        const total = (Number(c.CantidadModulos) || 0) * (Number(c.ImporteModulo) || 0) +
            (Number(c.CantidadHorasExcedente) || 0) * (Number(c.ImporteHorasExcedente) || 0) +
            (Number(c.CantidadKmExcedente) || 0) * (Number(c.ImporteKmExcedente) || 0) +
            (Number(c.ImportePeaje) || 0)
        return Math.round(total * 100) / 100
    })

    diferencia = computed(() => {
        if (!this.facturacion()) return 0
        return Math.round((100 - this.costo() * 100 / this.facturacion()) * 100) / 100
    })

    // Período en que se liquidaría según la Fecha Final
    periodoLiquidacion = computed(() => {
        const fechaFin = this.custodia().FechaFin
        if (!fechaFin) return { anio: 0, mes: 0 }
        const fecha = new Date(fechaFin)
        return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 }
    })

    private ultimoCodigo = -1
    private cargarCustodia = effect(() => {
        const codigo = this.CustodiaCodigo()
        if (codigo === this.ultimoCodigo) return
        this.ultimoCodigo = codigo
        untracked(() => (codigo > 0) ? this.load(codigo) : this.clearForm())
    })

    async load(CustodiaCodigo: number) {
        const info = await firstValueFrom(this.searchService.getInfoObjCustodia(CustodiaCodigo))
        if (!info?.CustodiaCodigo) return

        this.custodia.set({
            ...structuredClone(this.defaultCustodia),
            ...info,
            Responsable: info.Responsable ?? '',
            DescripcionRequirente: info.DescripcionRequirente ?? '',
            Descripcion: info.Descripcion ?? '',
            Origen: info.Origen ?? '',
            Destino: info.Destino ?? '',
            DescripcionFacturacion: info.DescripcionFacturacion ?? '',
            FechaInicio: info.FechaInicio ? new Date(info.FechaInicio) : null,
            FechaFin: info.FechaFin ? new Date(info.FechaFin) : null,
            ImporteModulo: aTexto(info.ImporteModulo),
            ImporteHorasExcedente: aTexto(info.ImporteHorasExcedente),
            ImporteKmExcedente: aTexto(info.ImporteKmExcedente),
            ImportePeaje: aTexto(info.ImportePeaje),
            personal: info.personal?.length
                ? info.personal.map((p: any) => ({ PersonalId: p.PersonalId, HorasTrabajadas: aTexto(p.HorasTrabajadas), ImporteSumaFija: aTexto(p.ImporteSumaFija), Importe: p.Importe }))
                : [structuredClone(this.defaultPersonal)],
            vehiculos: info.vehiculos?.length
                ? info.vehiculos.map((v: any) => ({ Patente: v.Patente ?? '', PersonalId: v.PersonalId, ImporteVehiculo: aTexto(v.ImporteVehiculo), PeajeVehiculo: aTexto(v.PeajeVehiculo) }))
                : [structuredClone(this.defaultVehiculo)],
        })

        this.auditHistory.set([
            { usuario: info.AudUsuarioIng, fecha: this.formatDate(info.AudFechaIng), accion: 'Creación' },
            { usuario: info.AudUsuarioMod, fecha: this.formatDate(info.AudFechaMod), accion: 'Modificación' }
        ])

        setTimeout(() => { this.formCustodia().reset() }, 400)   // Hack para dejar el form pristine después de cargar los datos
    }

    clearForm(): void {
        this.custodia.set(structuredClone(this.defaultCustodia))
        this.auditHistory.set([])
        this.formCustodia().reset()
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault()
        this.custodia.update(m => ({ ...m, personal: [...m.personal, structuredClone(this.defaultPersonal)] }))
    }

    removePersonal(index: number, e: MouseEvent): void {
        e.preventDefault()
        if (this.custodia().personal.length < 2) return
        this.custodia.update(m => ({ ...m, personal: m.personal.filter((_, i) => i !== index) }))
    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault()
        this.custodia.update(m => ({ ...m, vehiculos: [...m.vehiculos, structuredClone(this.defaultVehiculo)] }))
    }

    removeVehiculo(index: number, e: MouseEvent): void {
        e.preventDefault()
        if (this.custodia().vehiculos.length < 2) return
        this.custodia.update(m => ({ ...m, vehiculos: m.vehiculos.filter((_, i) => i !== index) }))
    }

    async searchDueno(index: number, Patente: string) {
        if (!Patente || Patente.length <= 5) return
        const res = await firstValueFrom(this.searchService.getLastPersonalByPatente(Patente))
        if (!res?.PersonalId) return
        this.custodia.update(m => ({
            ...m,
            vehiculos: m.vehiculos.map((v, i) => i === index ? { ...v, PersonalId: res.PersonalId } : v)
        }))
    }

    async searchDescRequirente() {
        const ClienteId = this.custodia().ClienteId
        if (!ClienteId) return
        const res = await firstValueFrom(this.searchService.getRequirentesByCliente(ClienteId))
        if (res?.length) this.optionsDescRequirente.set(res)
    }

    async save() {
        if (this.soloLectura() || this.formCustodia().submitting() || !this.formCustodia().dirty() || !this.formCustodia().valid()) return

        await submit(this.formCustodia, async (form) => {
            try {
                const valor = form().value()
                const importes = this.calculoPersonal()
                // Vacío viaja como null: el back compara contra la base al editar una custodia liquidada
                const datos = {
                    ...valor,
                    ImporteModulo: aNumero(valor.ImporteModulo),
                    ImporteHorasExcedente: aNumero(valor.ImporteHorasExcedente),
                    ImporteKmExcedente: aNumero(valor.ImporteKmExcedente),
                    ImportePeaje: aNumero(valor.ImportePeaje),
                    personal: valor.personal.map((p, i) => ({
                        ...p, HorasTrabajadas: aNumero(p.HorasTrabajadas), ImporteSumaFija: aNumero(p.ImporteSumaFija), Importe: importes[i]?.Importe ?? 0
                    })),
                    vehiculos: valor.vehiculos.map(v => ({ ...v, ImporteVehiculo: aNumero(v.ImporteVehiculo), PeajeVehiculo: aNumero(v.PeajeVehiculo) })),
                    ImporteFactura: this.facturacion(),
                    anio: this.anio(),
                    mes: this.mes()
                }

                // El código cargado en el form decide entre alta y modificación
                let codigo = Number(valor.CustodiaCodigo) || 0
                if (codigo) {
                    await firstValueFrom(this.apiService.updateObjCustodia(datos, codigo))
                } else {
                    const res = await firstValueFrom(this.apiService.addObjCustodia(datos))
                    codigo = Number(res.data.custodiaId)
                }

                await this.load(codigo)
                this.custodiaGuardada.emit(codigo)
            } catch (e: any) {
                return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors)
            }
            return undefined
        })
    }

    private formatDate(dateString: string): string {
        if (!dateString) return ''

        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString

        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()

        return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`
    }

}
