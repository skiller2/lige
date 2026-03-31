import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect, output, resource, untracked } from '@angular/core';
import { tap, firstValueFrom, queueScheduler } from 'rxjs';
import { AngularUtilService, queueMicrotaskOrSetTimeout } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { SettingOutline } from '@ant-design/icons-angular/icons';


export interface FormDesc {
    id: number;
    DescuentoId: number;
    PersonalId: number;
    AplicaEl: Date | null;
    Cuotas: number;
    Importe: string;
    Detalle: string;
    DetalleAnulacion: string;
    FechaAnulacion: Date | null;
    ImportacionDocumentoId: number | null;
    oldPersonalId: number;
    EfectoKey: { EfectoId: number | null, EfectoIndividualId: number | null };
    EfectoId: number | null;
    EfectoIndividualId: number | null;
    Cantidad: number;
    PorcentajeDescuento: number;
}


@Component({
    selector: 'app-descuentos-personal-alta-drawer',
    templateUrl: './descuentos-personal-alta-drawer.component.html',
    styleUrl: './descuentos-personal-alta-drawer.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, PersonalSearchComponent, FormField],
    providers: [AngularUtilService]
})
export class DescuentosPersonalAltaDrawerComponent {
    visibleDesc = model<boolean>(false)
    descuentoId = model<number>(0);
    personalId = model<number>(0);
    disabled = input<boolean>(false);
    cancelDesc = input<boolean>(false);
    isAnulacion = input<boolean>(false);
    placement: NzDrawerPlacement = 'left';
    onAddorUpdate = output()
    periodo = input<any>(null)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    private descuentoPersonalDefault: FormDesc = {
        id: 0,
        DescuentoId: 0,
        PersonalId: 0,
        AplicaEl: null,
        Cuotas: 1,
        Importe: '',
        Detalle: '',
        DetalleAnulacion: '',
        FechaAnulacion: null,
        ImportacionDocumentoId: null,
        oldPersonalId: 0,
        EfectoKey: { EfectoId: null, EfectoIndividualId: null },
        EfectoId: null,
        EfectoIndividualId: null,
        Cantidad: 1,
        PorcentajeDescuento: 100,
    }

    readonly descuentoPersonal = signal<FormDesc>(this.descuentoPersonalDefault);

    readonly formDescuentoPersonal = form(this.descuentoPersonal, (p) => {
        disabled(p, () => !this.visibleDesc() || this.disabled())
    })


    loadEffect = effect(() => {
        if (!this.visibleDesc()) return;

        const did = this.descuentoId();
        const pid = this.personalId();
        if (did && pid) {
            void this.loadDescuentoPersonal();
        } else {

            untracked(() => queueMicrotask(() => this.resetForm(null)));
        }
    });


    effectoKey = computed(() => { return this.descuentoPersonal().EfectoKey })



    formEffect = effect(() => {
        if (this.DescuentoId() != 50) {
            this.descuentoPersonal.update((state) => {
                return { ...state, EfectoId: null, EfectoIndividualId: null, EfectoKey: { EfectoId: null, EfectoIndividualId: null }, PorcentajeDescuento: 100, Cantidad: 1 }
            })
        }

        if (this.effectoKey()) {

            untracked(() => {

                this.descuentoPersonal.update((state) => {
                    return { ...state, EfectoId: this.descuentoPersonal().EfectoKey.EfectoId, EfectoIndividualId: this.descuentoPersonal().EfectoKey.EfectoIndividualId }
                })
            })
        }
    })


    AplicaEl = computed(() => this.descuentoPersonal().AplicaEl)
    readonly anio = computed(() => this.AplicaEl() ? new Date(this.AplicaEl()!).getFullYear() : 0);
    readonly mes = computed(() => this.AplicaEl() ? new Date(this.AplicaEl()!).getMonth() + 1 : 0);

    //    anio = signal<number>(0)
    //    mes = signal<number>(0)

    PersonalId = computed(() => { return this.descuentoPersonal().PersonalId })
    DescuentoId = computed(() => { return this.descuentoPersonal().DescuentoId })


    sitrevista = resource({
        params: () => ({ PersonalId: this.PersonalId(), anio: this.anio(), mes: this.mes() }),
        loader: async ({ params }) => {
            if (params.PersonalId && params.anio && params.mes) {
                const res = await firstValueFrom(this.apiService.getPersonaSitRevista(params.PersonalId, params.anio, params.mes))
                return res
            }
        }
    })

    listaDescuentosPer = resource({
        params: () => ({ PersonalId: this.PersonalId(), anio: this.anio(), mes: this.mes() }),
        loader: async ({ params }) => {
            if (params.PersonalId && params.anio && params.mes) {
                const res = await firstValueFrom(this.searchService.getDescuentosByPersonalId(params.PersonalId, params.anio, params.mes))
                return res || []
            }
            return []
        }
    })

    efectoCompareFn = (o1: any, o2: any): boolean => ((o1?.EfectoId === o2?.EfectoId && o1?.EfectoIndividualId === o2?.EfectoIndividualId) ? true : false)

    listaEfectosPer = resource({
        params: () => ({ PersonalId: this.PersonalId(), isEfecto: this.isEfecto() }),
        loader: async ({ params }) => {
            if (params.isEfecto) {
                const res = await firstValueFrom(this.searchService.getEfectoByPersonalId(params.PersonalId))
                return res ?? []
            }
            return []
        }
    })

    onEfectoChange() {
        // Pequeño delay para que el modelo se actualice primero
        setTimeout(() => {
            const listaEfectos = this.listaEfectosPer.value();

            const efectoSeleccionado = listaEfectos.find((e: any) =>
                e.EfectoId === this.descuentoPersonal().EfectoKey.EfectoId &&
                e.EfectoIndividualId === this.descuentoPersonal().EfectoKey.EfectoIndividualId
            );

            if (efectoSeleccionado) {
                this.descuentoPersonal.update((state) => {
                    return { ...state, Importe: efectoSeleccionado.Importe ?? '' }
                })
            }

        },200);
    }

    optionsTipoDescuento = toSignal(this.searchService.getDecuentosTipoOptions(), { initialValue: [] });

    isEfecto = computed(() => {
        return (this.descuentoPersonal().DescuentoId == 50) ? true : false
    })

    importeCuota = computed(() => {
        const s = this.descuentoPersonal();
        const importe = Number(s.Importe) || 0;
        const cant = Number(s.Cantidad) || 0;
        const pct = Number(s.PorcentajeDescuento) || 0;
        const cuotas = Number(s.Cuotas) || 1;      // evita /0
        const total = (importe * cant * (pct / 100)) / cuotas;
        return total.toFixed(2); // string
    });

    importeTotal = computed(() => {
        const s = this.descuentoPersonal();
        const importe = Number(s.Importe) || 0;
        const cant = Number(s.Cantidad) || 0;
        const pct = Number(s.PorcentajeDescuento) || 0;
        const total = (importe * cant * (pct / 100));
        return total.toFixed(2); // string
    });

    lastEfecto = signal<{ EfectoId: number | null, EfectoIndividualId: number | null, EfectoDescripcionCompleta: string } | null>(null)
    private anioDef: number = 0
    private mesDef: number = 0

    async loadDescuentoPersonal() {
        const infoDes = await firstValueFrom(this.searchService.getDescuentoPersona(this.personalId(), this.descuentoId()))
        infoDes.oldPersonalId = infoDes.PersonalId
        this.descuentoPersonal.set(infoDes)
        this.descuentoPersonal.update((state) => {
            return { ...state, oldPersonalId: infoDes.PersonalId, EfectoKey: { EfectoId: infoDes.EfectoId, EfectoIndividualId: infoDes.EfectoIndividualId }, AplicaEl: infoDes.AplicaEl ? new Date(infoDes.AplicaEl) : null }
        })

        if (infoDes.EfectoId)
            this.lastEfecto.set({ EfectoId: infoDes.EfectoId, EfectoIndividualId: infoDes.EfectoIndividualId, EfectoDescripcionCompleta: infoDes.EfectoDescripcionCompleta })
        else
            this.lastEfecto.set(null)

        //queueMicrotask(() => this.formDescuentoPersonal().reset())


        setTimeout(() => {
            this.formDescuentoPersonal().reset()
        }, 500)


    }

    async ngOnInit() {
        const periodo: any = await firstValueFrom(this.searchService.getProxPeriodo())
        this.anioDef = periodo.anio
        this.mesDef = periodo.mes
    }

    ngOnDestroy(): void {
    }

    async save() {

        await submit(this.formDescuentoPersonal, async (form) => {

            const values: any = form().value()
            try {
                if (values.id) {
                    await firstValueFrom(this.apiService.updateDescuento(values))
                } else {
                    const res = await firstValueFrom(this.apiService.addDescuento(values))
                    if (res.data.id) {
                        this.descuentoPersonal.update((state) => {
                            return { ...state, id: res.data.id, oldPersonalId: values.PersonalId }
                        })
                    }
                }
                this.onAddorUpdate.emit()

                form().reset()
            } catch (e) {

            }
        })
    }

    resetForm(e: any) {
        if (e)
            e.preventDefault()

        this.descuentoPersonal.set(this.descuentoPersonalDefault)
        this.descuentoPersonal.update((state) => {
            return { ...state, AplicaEl: new Date(this.anioDef, this.mesDef - 1, 1) }
        })
        this.lastEfecto.set(null)

        this.formDescuentoPersonal().reset()
    }

    async cancel(e: any) {
        e.preventDefault()

        await submit(this.formDescuentoPersonal, async (form) => {
            const values: any = form().value()
            try {
                if (this.descuentoId() && this.personalId()) {
                    await firstValueFrom(this.apiService.cancellationPersonalOtroDescuento(values))
                    this.onAddorUpdate.emit()
                    this.formDescuentoPersonal().reset()

                }
            } catch (e) { }
        })
    }
}