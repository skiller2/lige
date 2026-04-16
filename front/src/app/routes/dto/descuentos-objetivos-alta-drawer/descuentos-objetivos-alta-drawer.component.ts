import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom, Observable, forkJoin } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { LoadingService } from '@delon/abc/loading';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { applyEach, disabled, FieldTree, form, FormField, hidden, readonly, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';

export interface FormDesc {
    id: number;
    AplicaEl: Date | null;
    AplicaA: string;
    DescuentoId: number;
    ObjetivoId: number;
    Cuotas: number;
    Importe: string;
    Detalle: string;
    FechaAnulacion: Date | null;
    DetalleAnulacion: string;
    ImportacionDocumentoId: number | null;
    oldObjetivoId: number;
    EfectoKey: { EfectoId: number | null, EfectoIndividualId: number | null };
    EfectoId: number | null;
    EfectoIndividualId: number | null;
    Cantidad: number | any;
    PorcentajeDescuento: number | any;
}

@Component({
    selector: 'app-descuentos-objetivos-alta-drawer',
    templateUrl: './descuentos-objetivos-alta-drawer.component.html',
    styleUrl: './descuentos-objetivos-alta-drawer.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule,
        ObjetivoSearchComponent, ViewResponsableComponent, FormField],
    providers: [AngularUtilService],
})
export class DescuentosObjetivosAltaDrawerComponent {
    isLoading = signal(false);
    visibleDesc = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    ObjetivoDescuentoId = model<number>(0);
    objetivoId = model<number>(0);
    // disabled = input<boolean>(false);
    // cancelDesc = input<boolean>(false);
    // isAnulacion = input<boolean>(false);
    crudAccion = input<string>('');
    onAddorUpdate = output()

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);

    private descuentoObjetivoDefault: FormDesc = {
        id: 0,
        AplicaA: '', DescuentoId: 0, ObjetivoId: 0, AplicaEl: new Date(),
        Cuotas: 1, Importe: '', Detalle: '',
        DetalleAnulacion: '',
        FechaAnulacion: null,
        ImportacionDocumentoId: null,
        oldObjetivoId: 0,
        EfectoKey: { EfectoId: null, EfectoIndividualId: null },
        EfectoId: null,
        EfectoIndividualId: null,
        Cantidad: 1,
        PorcentajeDescuento: 100,
    }

    readonly descuentoObjetivo = signal<FormDesc>(this.descuentoObjetivoDefault);

    readonly formDescuentoObjetivo = form(this.descuentoObjetivo, (p) => {
        disabled(p.AplicaEl, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.AplicaA, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.DescuentoId, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.ObjetivoId, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.Cuotas, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.Importe, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.PorcentajeDescuento, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.Cantidad, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.EfectoKey, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')
        disabled(p.Detalle, () => this.crudAccion() === 'R' || this.crudAccion() === 'D')

        disabled(p.DetalleAnulacion, () => this.crudAccion() === 'R')
        disabled(p.FechaAnulacion, () => true)
        disabled(p.ImportacionDocumentoId, () => true)

        hidden(p.DetalleAnulacion, () => this.crudAccion() === 'C' || this.crudAccion() === 'U')
        hidden(p.FechaAnulacion, () => this.crudAccion() === 'C' || this.crudAccion() === 'U')
        hidden(p.ImportacionDocumentoId, () => this.crudAccion() === 'C' || this.crudAccion() === 'U')
    })

    loadEffect = effect(async () => {
        if (!this.visibleDesc()) return;

        const ObjetivoDescuentoId = this.ObjetivoDescuentoId();
        const objetivoId = this.objetivoId();

        if (ObjetivoDescuentoId && objetivoId) {
            void this.loadDescuentoObjetivo();
        }else {
            untracked(() => queueMicrotask(() => this.resetForm()));
        }
    });

    isEfecto = computed(() => this.descuentoObjetivo().DescuentoId == 50)

    DescuentoId = computed(() => this.descuentoObjetivo().DescuentoId)
    effectoKey = computed(() => this.descuentoObjetivo().EfectoKey)

    efectoCompareFn = (o1: any, o2: any): boolean => ((o1?.EfectoId === o2?.EfectoId && o1?.EfectoIndividualId === o2?.EfectoIndividualId) ? true : false)

    listaEfectosObj = resource({
        params: () => ({ ObjetivoId: this.descuentoObjetivo().ObjetivoId, isEfecto: this.isEfecto() }),
        loader: async ({ params }) => {
            if (params.isEfecto && params.ObjetivoId) {
                const res = await firstValueFrom(this.searchService.getEfectoByObjetivoId(params.ObjetivoId))
                return res ?? []
            }
            return []
        }
    })

    formEffect = effect(() => {
        if (this.DescuentoId() != 50) {
            this.descuentoObjetivo.update((state) => {
                return { ...state, EfectoId: null, EfectoIndividualId: null, EfectoKey: { EfectoId: null, EfectoIndividualId: null }, PorcentajeDescuento: 100, Cantidad: 1 }
            })
        }

        if (this.effectoKey()) {
            untracked(() => {
                this.descuentoObjetivo.update((state) => {
                    return { ...state, EfectoId: this.descuentoObjetivo().EfectoKey.EfectoId, EfectoIndividualId: this.descuentoObjetivo().EfectoKey.EfectoIndividualId }
                })
            })
        }
    })

    onEfectoChange() {
        setTimeout(() => {
            const listaEfectos = this.listaEfectosObj.value();
            const efectoSeleccionado = listaEfectos.find((e: any) =>
                e.EfectoId === this.descuentoObjetivo().EfectoKey.EfectoId &&
                e.EfectoIndividualId === this.descuentoObjetivo().EfectoKey.EfectoIndividualId
            );
            if (efectoSeleccionado) {
                this.descuentoObjetivo.update((state) => {
                    return { ...state, Importe: efectoSeleccionado.Importe ?? '' }
                })
            }
        }, 200);
    }

    lastEfecto = signal<{ EfectoId: number | null, EfectoIndividualId: number | null, EfectoDescripcionCompleta: string } | null>(null)

    importeTotal = computed(() => {
        const s = this.descuentoObjetivo();
        const importe = Number(s.Importe) || 0;
        const cant = Number(s.Cantidad) || 0;
        const pct = Number(s.PorcentajeDescuento) || 0;
        const total = (importe * cant * (pct / 100));
        return total.toFixed(2);
    });

    importeCuota = computed(() => {
        const s = this.descuentoObjetivo();
        const cuotas = Number(s.Cuotas) || 1;
        if (this.isEfecto()) {
            const total = Number(this.importeTotal()) || 0;
            return (total / cuotas).toFixed(2);
        }
        const importe = Number(s.Importe) || 0;
        return (importe / cuotas).toFixed(2);
    });

    async loadDescuentoObjetivo() {
        const infoDesc = await firstValueFrom(this.searchService.getDescuentoObjetivo(this.objetivoId(), this.ObjetivoDescuentoId()))

        infoDesc.oldObjetivoId = infoDesc.ObjetivoId
        infoDesc.AplicaEl = infoDesc.AplicaEl ? new Date(infoDesc.AplicaEl) : null
        infoDesc.FechaAnulacion = infoDesc.FechaAnulacion ? new Date(infoDesc.FechaAnulacion) : null
        infoDesc.EfectoKey = { EfectoId: infoDesc.EfectoId ?? null, EfectoIndividualId: infoDesc.EfectoIndividualId ?? null }

        this.descuentoObjetivo.set(infoDesc)

        if (infoDesc.EfectoId)
            this.lastEfecto.set({ EfectoId: infoDesc.EfectoId, EfectoIndividualId: infoDesc.EfectoIndividualId, EfectoDescripcionCompleta: infoDesc.EfectoDescripcionCompleta })
        else
            this.lastEfecto.set(null)
    }

    // private destroy$ = new Subject();

    // selectedObjetivoIdChange$ = new BehaviorSubject(0);
    // objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);

    optionsAplicaA = toSignal(this.searchService.getDecuentosAplicaAOptions(), { initialValue: [] });
    optionsTipo = toSignal(this.searchService.getDecuentosTipoOptions(), { initialValue: [] });
    objetivoDetalle = resource({
        params: () => ({ ObjetivoId: this.inputObjetivoId(), anio: this.anio(), mes: this.mes() }),
        loader: async ({ params }) => {

            if (params.ObjetivoId && params.anio && params.mes) {
                return await firstValueFrom(this.getObjetivoDetalle(params.ObjetivoId, params.anio, params.mes))
            }
        }
    })

    anio = computed(() => {
        const value = this.descuentoObjetivo().AplicaEl
        return value ? new Date(value).getFullYear() : 0
    });

    mes = computed(() => {
        const value = this.descuentoObjetivo().AplicaEl
        return value ? new Date(value).getMonth() + 1 : 0
    });

    inputObjetivoId = computed(() => {
        return this.descuentoObjetivo().ObjetivoId
    });

    async ngOnInit() { }

    async save() {
        await submit(this.formDescuentoObjetivo, async (form) => {
            let values = form().value()
            try {
                if (values.id) {
                    await firstValueFrom(this.apiService.updateDescuento(values))
                } else {
                    const res = await firstValueFrom(this.apiService.addDescuento(values))
                    if (res.data.id)
                        this.descuentoObjetivo.update((state) => {
                            return { ...state, id: res.data.id, oldObjetivoId: values.ObjetivoId }
                        })
                }
                this.onAddorUpdate.emit()
                form().reset()
            } catch (e) {

            }
        })
    }

    resetForm() {
        this.descuentoObjetivo.set(this.descuentoObjetivoDefault)
        this.lastEfecto.set(null)

        this.formDescuentoObjetivo().reset()
    }

    getObjetivoDetalle(objetivoId: number, anio: number, mes: number): Observable<any> {
        // this.loadingSrv.open({ type: 'spin', text: '' })
        return forkJoin([
            this.searchService.getObjetivoResponsables(objetivoId, anio, mes),
            this.searchService.getObjetivoContratos(objetivoId, anio, mes),
            this.searchService.getAsistenciaPeriodo(objetivoId, anio, mes),
        ]).pipe(
            map((data: any[]) => {
                this.loadingSrv.close()
                return { responsable: data[0], contratos: data[1], periodo: data[2] };
            })
        );
    }

    async cancel() {
        this.isLoading.set(true)
        let values = this.descuentoObjetivo()
        try {
            if (this.ObjetivoDescuentoId() && this.objetivoId()) {
                await firstValueFrom(this.apiService.cancellationObjetivoDescuento(values))
                void this.loadDescuentoObjetivo();
                this.onAddorUpdate.emit()
                this.formDescuentoObjetivo().reset()
            }
        } catch (e) { }
        this.isLoading.set(false)
    }

}